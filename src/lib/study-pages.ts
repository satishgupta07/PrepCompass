// Reads a notebook's page list (id + title) straight out of its HTML, so the
// progress checklist always matches the file in content/study/ — replace a
// notebook and the checklist follows, no second list to keep in sync.
//
// Every notebook is a run of `<section class="sheet" id="…" data-…>` blocks.
// The first sheet is always the cover/contents page, which isn't something
// you "study", so it's skipped. The title comes from `data-title` (React) or
// `data-label` (the others).
import "server-only";
import { readNotebookHtml, notebookMtimeMs } from "@/lib/study-files";

export type NotebookPage = { id: string; title: string };

// Two notebook layouts: scrolling `sheet` sections, or (the System Design
// notebook) one-at-a-time `page` sections switched by the URL hash.
const SHEET_TAG = /<section\s+class="(?:sheet|page)\b[^"]*"([^>]*)>/g;

function attr(attrs: string, name: string): string | undefined {
  // Leading whitespace/start anchor so `id` can't match inside `data-id`.
  return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attrs)?.[1];
}

/** Decodes the handful of entities the notebooks use inside attribute values. */
function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parsePages(html: string): NotebookPage[] {
  const pages: NotebookPage[] = [];
  // Drop the cover/contents sheet first — it may have no title at all, so it
  // has to go before the title check below or the wrong sheet would be cut.
  for (const match of [...html.matchAll(SHEET_TAG)].slice(1)) {
    const attrs = match[1];
    const id = attr(attrs, "id");
    const title = attr(attrs, "data-title") ?? attr(attrs, "data-label");
    if (id && title) pages.push({ id, title: decode(title) });
  }
  return pages;
}

// Parsed page lists, reused until the notebook file changes on disk.
const cache = new Map<string, { mtimeMs: number; pages: NotebookPage[] }>();

export async function getNotebookPages(slug: string): Promise<NotebookPage[]> {
  const mtimeMs = await notebookMtimeMs(slug);
  const hit = cache.get(slug);
  if (hit && hit.mtimeMs === mtimeMs) return hit.pages;

  const pages = parsePages(await readNotebookHtml(slug));
  cache.set(slug, { mtimeMs, pages });
  return pages;
}
