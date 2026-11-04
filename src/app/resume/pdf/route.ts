// GET /resume/pdf — downloads the resume as an ATS-friendly PDF. Admin only:
// proxy.ts already requires a session, and this additionally requires the
// admin role, answering 404 (not 403) so the route's existence isn't revealed.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { RESUME } from "@/lib/resume-data";
import { renderResumePdf } from "@/lib/resume-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const pdf = await renderResumePdf(RESUME);
    const fileName = `${RESUME.name.replace(/[^A-Za-z0-9]+/g, "_")}_Resume.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Resume PDF generation failed", error);
    return NextResponse.json({ error: "Could not generate the PDF" }, { status: 500 });
  }
}
