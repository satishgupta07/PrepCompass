// The "/reminders" page: the spaced-revision worklist. A problem is "due"
// once 5+ days have passed since it was solved (or last revised) — see
// REVISION_INTERVAL_DAYS / getDueProblems in src/lib/reminders.ts, which
// also orders the list most-overdue first. This page just loads the data,
// computes what's due for today, and builds a slug -> pattern name lookup
// so RemindersList can label each due problem without re-fetching patterns.
import { loadAppData } from "@/lib/load-data";
import { getDueProblems } from "@/lib/reminders";
import { todayDateKey } from "@/lib/activity";
import { RemindersList } from "@/components/reminders/RemindersList";

// Data depends on the runtime MONGODB_URI env var, so this page can't be
// statically generated at build time.
export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const { patterns, problems } = await loadAppData();
  const due = getDueProblems(problems, todayDateKey());
  const patternNameBySlug = Object.fromEntries(patterns.map((pattern) => [pattern.slug, pattern.name]));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reminders</h1>
        <p className="text-sm text-muted">
          Problems solved (or last revised) 5+ days ago that are due for another look.
        </p>
      </div>
      <RemindersList due={due} patternNameBySlug={patternNameBySlug} />
    </div>
  );
}
