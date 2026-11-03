"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toggleStudyPage } from "@/actions/study";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { NotebookPage } from "@/lib/study-pages";

type Props = {
  slug: string;
  title: string;
  pages: NotebookPage[];
  initialStudied: string[];
  /** True when progress couldn't be loaded — the checklist is shown read-only. */
  progressUnavailable?: boolean;
};

/**
 * One notebook next to its study checklist. The notebook is the untouched
 * static HTML in an iframe (same origin, so the checklist can scroll it to a
 * given sheet); the checklist is per-user progress stored via
 * `toggleStudyPage`. Checking a box updates immediately and rolls back if
 * the server rejects it.
 */
export function StudyView({ slug, title, pages, initialStudied, progressUnavailable = false }: Props) {
  const [studied, setStudied] = useState(() => new Set(initialStudied));
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const frameRef = useRef<HTMLIFrameElement>(null);

  const done = pages.filter((page) => studied.has(page.id)).length;
  const percent = pages.length === 0 ? 0 : Math.round((done / pages.length) * 100);

  function setPage(id: string, value: boolean) {
    setError(null);
    setStudied((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
    startTransition(async () => {
      const result = await toggleStudyPage(slug, id, value);
      if (result.error) {
        setError(result.error);
        setStudied((prev) => {
          const next = new Set(prev);
          if (value) next.delete(id);
          else next.add(id);
          return next;
        });
      }
    });
  }

  function jumpTo(id: string) {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (!frame?.contentWindow || !doc) return;
    // Notebooks made of `.page` sections show one page at a time and switch
    // on the URL hash; the others are one long scroll.
    if (doc.querySelector(".page")) frame.contentWindow.location.hash = id;
    else doc.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[320px_1fr]">
      <aside className="flex flex-col gap-3 lg:h-[calc(100vh-7rem)]">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted">
            <ProgressBar percent={percent} />
            <span>
              {done}/{pages.length} studied · {percent}%
            </span>
          </div>
          <div className="flex gap-1 text-sm">
            <Link href="/study" className="rounded-md px-2 py-1 font-medium text-muted hover:bg-surface-hover hover:text-foreground">
              ← All notebooks
            </Link>
            <a
              href={`/study/pdf/${slug}`}
              download
              className="rounded-md px-2 py-1 font-medium text-muted hover:bg-surface-hover hover:text-foreground"
            >
              Download PDF
            </a>
          </div>
          {progressUnavailable && (
            <p className="text-sm text-muted">Progress is unavailable right now, so ticking is turned off.</p>
          )}
          {error && <p className="text-sm text-hard">{error}</p>}
        </div>
        <ol className="flex-1 overflow-y-auto rounded-lg border border-border bg-surface p-2 lg:min-h-0">
          {pages.map((page, index) => {
            const checked = studied.has(page.id);
            return (
              <li key={page.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-surface-hover">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={progressUnavailable}
                  onChange={(event) => setPage(page.id, event.target.checked)}
                  aria-label={`Mark "${page.title}" as studied`}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => jumpTo(page.id)}
                  className={`text-left text-sm ${checked ? "text-muted line-through" : "text-foreground"}`}
                >
                  <span className="text-muted">{index + 1}. </span>
                  {page.title}
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
      <iframe
        ref={frameRef}
        src={`/study/raw/${slug}`}
        title={title}
        className="h-[80vh] w-full rounded-lg border border-border bg-white lg:h-[calc(100vh-7rem)]"
      />
    </div>
  );
}
