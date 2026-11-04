// The "/resume" page: shows the resume (src/lib/resume-data.ts) exactly as it
// will print, with a Download PDF button (/resume/pdf). Admin only: anyone
// else, signed in or not, gets the normal 404 page. The content is a plain
// data file, so changing the resume means editing that file; there is no
// editor here.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { RESUME } from "@/lib/resume-data";
import { renderResumeHtml } from "@/lib/resume-html";

export const metadata: Metadata = { title: "Resume · PrepCompass", robots: { index: false, follow: false } };

// Depends on the session.
export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const session = await auth();
  if (session?.user?.role !== "admin") notFound();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Resume</h1>
          <p className="text-sm text-muted">
            Only admins can see this. The text is in <code>src/lib/resume-data.ts</code>.
          </p>
        </div>
        <a
          href="/resume/pdf"
          download
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
        >
          Download PDF
        </a>
      </div>
      {/* A fully sandboxed iframe (no scripts, no same-origin access) shows the
          resume in its own white page, untouched by the app's dark theme. */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <iframe
          title="Resume preview"
          srcDoc={renderResumeHtml(RESUME)}
          sandbox=""
          className="block h-[1180px] w-[794px] max-w-none"
        />
      </div>
    </div>
  );
}
