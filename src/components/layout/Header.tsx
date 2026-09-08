import Link from "next/link";
import { loadAppData } from "@/lib/load-data";
import { getDueProblems } from "@/lib/reminders";
import { todayDateKey } from "@/lib/activity";

/**
 * App-wide top nav: brand link plus Tracker/Reminders/Activity links. An
 * async Server Component — it loads problem data itself (via the cached
 * `loadAppData`, so this doesn't cost an extra DB round trip when a page
 * also calls it in the same request) to compute how many problems are due
 * for revision today, shown as a badge count on the Reminders link.
 */
export async function Header() {
  const { problems } = await loadAppData();
  const dueCount = getDueProblems(problems, todayDateKey()).length;

  return (
    <header className="border-b border-border bg-surface/60">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          <span className="text-base font-semibold text-foreground">PrepCompass</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/" className="text-muted transition-colors hover:text-foreground">
            Tracker
          </Link>
          <Link
            href="/reminders"
            className="flex items-center gap-1.5 text-muted transition-colors hover:text-foreground"
          >
            Reminders
            {dueCount > 0 && (
              <span className="rounded-full bg-hard px-1.5 py-0.5 text-xs font-medium text-background">
                {dueCount}
              </span>
            )}
          </Link>
          <Link href="/activity" className="text-muted transition-colors hover:text-foreground">
            Activity
          </Link>
        </nav>
      </div>
    </header>
  );
}
