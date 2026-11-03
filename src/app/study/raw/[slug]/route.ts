// GET /study/raw/:slug — serves a study notebook's HTML untouched (the page
// at /study/[slug] shows it in an iframe; "Open" links here directly). Lives
// outside /api, so proxy.ts requires a signed-in session. Only slugs from
// the NOTEBOOKS catalog are accepted.
import { NextResponse } from "next/server";
import { readNotebookHtml } from "@/lib/study-files";
import { findNotebook } from "@/lib/study";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notebook = findNotebook(slug);
  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  const html = await readNotebookHtml(notebook.slug);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
