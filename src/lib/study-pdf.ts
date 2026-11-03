// Renders a study notebook (content/study/<slug>.html) to PDF with headless
// Chromium via puppeteer-core. Chromium applies the notebook's own
// `@media print` rules (one sheet per page, backgrounds kept), so the PDF
// matches the on-screen format without a print dialog.
//
// A render launches a whole browser (~10-15 s, 100+ MB), so this module
// protects the server three ways:
//   1. Cache — finished PDFs are written to the OS temp dir, keyed by slug +
//      the notebook file's mtime, so each notebook is rendered once per edit
//      (and survives restarts). Editing the HTML invalidates it automatically.
//   2. De-duplication — concurrent requests for the same notebook share one
//      in-flight render instead of each starting their own.
//   3. Concurrency limit — at most MAX_CONCURRENT_RENDERS browsers at a time;
//      the rest wait in line.
//
// puppeteer-core ships no browser: it drives an installed Chrome/Edge. Set
// CHROME_PATH to point at one explicitly; otherwise common install locations
// are probed. See CLAUDE.md for the deployment caveat.
import "server-only";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { notebookMtimeMs, readNotebookHtml } from "@/lib/study-files";

const MAX_CONCURRENT_RENDERS = 1;
// Printing a big notebook (e.g. System Design: 70 pages with SVG filters) can
// take well over puppeteer's 30 s default.
const RENDER_TIMEOUT_MS = 180_000;
const CACHE_DIR = path.join(os.tmpdir(), "prepcompass-study-pdf");

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

function findChrome(): string {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) {
    if (!existsSync(fromEnv)) throw new Error(`CHROME_PATH does not exist: ${fromEnv}`);
    return fromEnv;
  }
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error("No Chrome/Chromium/Edge found. Install one or set CHROME_PATH.");
  }
  return found;
}

// --- concurrency limit: a tiny FIFO semaphore ------------------------------
let running = 0;
const waiting: (() => void)[] = [];

async function withRenderSlot<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT_RENDERS) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

// --- the actual render -------------------------------------------------------
async function renderWithChromium(slug: string): Promise<Uint8Array> {
  const html = await readNotebookHtml(slug);

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    // The notebooks pull their handwriting fonts from Google Fonts, so wait
    // for the page load (stylesheet included) and the fonts to be ready.
    await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    // "One page at a time" notebooks (`.page` sections, e.g. System Design)
    // only draw a page's diagrams and interactive labs when it is first shown,
    // so visit every page once before printing, then start each on a new
    // sheet of paper. (Their own print CSS already un-hides all pages.)
    const isPagedNotebook = await page.evaluate(() => document.querySelector(".page") !== null);
    if (isPagedNotebook) {
      await page.evaluate(async () => {
        for (const section of Array.from(document.querySelectorAll(".page"))) {
          location.hash = section.id;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        location.hash = "cover";
      });
      // The notebook fakes bold on its handwriting font with a text-shadow on
      // every <b>; printing thousands of those takes ~130 s and 24 MB versus
      // ~20 s with an equivalent thin text stroke (measured), same look.
      await page.addStyleTag({
        content:
          "@media print{.page{break-after:page}" +
          "b,strong{text-shadow:none!important;-webkit-text-stroke:.35px currentColor}}",
      });
    }
    await page.emulateMediaType("print");
    return await page.pdf({
      format: "A4",
      printBackground: true,
      timeout: RENDER_TIMEOUT_MS,
      margin: { top: "8mm", right: "8mm", bottom: "8mm", left: "8mm" },
    });
  } finally {
    await browser.close();
  }
}

// --- cache + de-duplication ----------------------------------------------------
const inFlight = new Map<string, Promise<Buffer>>();

async function renderAndCache(slug: string, cacheFile: string): Promise<Buffer> {
  const pdf = Buffer.from(await withRenderSlot(() => renderWithChromium(slug)));
  await mkdir(CACHE_DIR, { recursive: true });
  // Write-then-rename so a reader never sees a half-written file.
  const tmpFile = `${cacheFile}.${process.pid}.tmp`;
  await writeFile(tmpFile, pdf);
  await rename(tmpFile, cacheFile);
  return pdf;
}

/** Returns the notebook's PDF, rendering it only if there's no up-to-date cached copy. */
export async function getNotebookPdf(slug: string): Promise<Buffer> {
  const cacheFile = path.join(CACHE_DIR, `${slug}-${Math.round(await notebookMtimeMs(slug))}.pdf`);

  try {
    return await readFile(cacheFile);
  } catch {
    // not cached yet — fall through and render
  }

  let pending = inFlight.get(cacheFile);
  if (!pending) {
    pending = renderAndCache(slug, cacheFile).finally(() => inFlight.delete(cacheFile));
    inFlight.set(cacheFile, pending);
  }
  return pending;
}
