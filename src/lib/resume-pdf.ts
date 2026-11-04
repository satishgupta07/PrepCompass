// Prints the resume (src/lib/resume-html.ts) to an A4 PDF with the same
// headless Chrome/Edge setup the study notebooks use, sharing its browser
// lookup (CHROME_PATH) and one-render-at-a-time limit. The result is a text
// PDF (selectable, parseable by ATS software), not an image. A single page of
// plain HTML renders in a couple of seconds, so there is no cache.
import "server-only";
import puppeteer from "puppeteer-core";
import { renderResumeHtml } from "@/lib/resume-html";
import type { ResumeData } from "@/lib/resume-data";
import { findChrome, withRenderSlot } from "@/lib/study-pdf";

export function renderResumePdf(data: ResumeData): Promise<Buffer> {
  return withRenderSlot(async () => {
    const browser = await puppeteer.launch({
      executablePath: findChrome(),
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(renderResumeHtml(data), { waitUntil: "load", timeout: 30_000 });
      await page.emulateMediaType("print");
      const pdf = await page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  });
}
