// The "/study" page: index of the handwritten-style study notebooks (HTML &
// CSS, JavaScript, React, Node.js) used for learning and interview prep, with
// the signed-in user's studied-pages progress on each. The notebooks are
// self-contained static HTML files in content/study/; "Study" opens one beside
// its checklist (/study/[slug]), "Open" shows the bare notebook (/study/raw/[slug]), and
// "Download PDF" hits /study/pdf/[slug] (see src/lib/study-pdf.ts). proxy.ts
// gates all of /study/* behind a session like every other non-API path. If
// MongoDB is unreachable the cards still render, just without progress.
import type { Metadata } from "next";
import { auth } from "@/auth";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { tryGetStudiedCounts } from "@/lib/services/study";
import { NOTEBOOKS } from "@/lib/study";
import { getNotebookPages } from "@/lib/study-pages";

export const metadata: Metadata = {
  title: "Study · PrepCompass",
  description: "Study notebooks and interview prep for HTML, CSS, JavaScript, React and Node.js.",
};

// Progress depends on the session and the runtime MONGODB_URI.
export const dynamic = "force-dynamic";

const ACTION_CLASSES =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground";

export default async function StudyPage() {
  const session = await auth();
  const [counts, pageLists] = await Promise.all([
    session?.user?.id ? tryGetStudiedCounts(session.user.id) : Promise.resolve({} as Record<string, number>),
    Promise.all(NOTEBOOKS.map((notebook) => getNotebookPages(notebook.slug))),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Study</h1>
        <p className="text-sm text-muted">
          Page-by-page notebooks for learning and interview prep. Tick off pages as you study them to track progress.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {NOTEBOOKS.map((notebook, index) => {
          const total = pageLists[index].length;
          const done = Math.min(counts?.[notebook.slug] ?? 0, total);
          return (
            <li key={notebook.slug} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-5">
              <a href={`/study/${notebook.slug}`} className="text-lg font-semibold text-foreground hover:underline">
                {notebook.title}
              </a>
              <span className="text-sm text-muted">{notebook.blurb}</span>
              <div className="mt-auto flex items-center gap-3 pt-2 text-xs font-medium uppercase tracking-wide text-muted">
                {counts && <ProgressBar percent={total === 0 ? 0 : (done / total) * 100} />}
                <span>
                  {counts ? `${done}/${total} pages` : `${total} pages`}
                </span>
              </div>
              <div className="flex gap-1 border-t border-border pt-3">
                <a href={`/study/${notebook.slug}`} className={ACTION_CLASSES}>
                  Study
                </a>
                <a href={`/study/raw/${notebook.slug}`} className={ACTION_CLASSES}>
                  Open
                </a>
                <a href={`/study/pdf/${notebook.slug}`} download className={ACTION_CLASSES}>
                  Download PDF
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
