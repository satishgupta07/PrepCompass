// Where the study notebooks live on disk, and how to read them. The HTML sits
// in content/study/ (not public/) on purpose: a file in public/ is served by
// the CDN on serverless hosts and isn't part of the function's file system, so
// reading it from a route would fail there. content/ is bundled into the
// functions that need it via `outputFileTracingIncludes` in next.config.ts —
// keep the two in sync if this path ever changes.
import "server-only";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const NOTEBOOK_DIR = path.join(process.cwd(), "content", "study");

/** Absolute path of a notebook's HTML. Only call with a slug that passed `findNotebook`. */
export function notebookFilePath(slug: string): string {
  return path.join(NOTEBOOK_DIR, `${slug}.html`);
}

export function readNotebookHtml(slug: string): Promise<string> {
  return readFile(notebookFilePath(slug), "utf8");
}

/** Last-modified time (ms) of a notebook file — used to key the PDF cache. */
export async function notebookMtimeMs(slug: string): Promise<number> {
  return (await stat(notebookFilePath(slug))).mtimeMs;
}
