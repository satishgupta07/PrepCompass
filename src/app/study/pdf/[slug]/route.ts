// GET /study/pdf/:slug — downloads a study notebook as a PDF. Sits outside
// /api, so proxy.ts requires a signed-in session. Only slugs from the
// NOTEBOOKS catalog are accepted.
import { NextResponse } from "next/server";
import { findNotebook } from "@/lib/study";
import { getNotebookPdf } from "@/lib/study-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const notebook = findNotebook(slug);
  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  try {
    const pdf = await getNotebookPdf(notebook.slug);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${notebook.slug}-study-notebook.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "Could not generate the PDF" }, { status: 500 });
  }
}
