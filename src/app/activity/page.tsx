// The "/activity" page: a GitHub-style contribution graph plus current/
// longest streak counters, built from the DayActivity collection (one
// increment-only count per "YYYY-MM-DD", recorded whenever a problem is
// solved or revised — see src/lib/activity.ts). Streak math and the
// week-grid layout live in src/lib/streak.ts and are rendered by
// ActivityGraph; this page just loads the raw day counts and derives the
// two lookup structures each of those needs.
import { loadAppData } from "@/lib/load-data";
import { todayDateKey } from "@/lib/activity";
import { computeCurrentStreak, computeLongestStreak } from "@/lib/streak";
import { ActivityGraph } from "@/components/activity/ActivityGraph";

// Data depends on the runtime MONGODB_URI env var, so this page can't be
// statically generated at build time.
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { dayActivities } = await loadAppData();
  const todayKey = todayDateKey();

  // "Active" days (count > 0) are what streaks are computed over; the full
  // count-by-date map is what the graph uses to shade each day's cell.
  const activeDates = new Set(dayActivities.filter((day) => day.count > 0).map((day) => day.date));
  const countByDate = new Map(dayActivities.map((day) => [day.date, day.count]));
  const currentStreak = computeCurrentStreak(activeDates, todayKey);
  const longestStreak = computeLongestStreak(activeDates);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
      <div className="flex flex-wrap gap-4">
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <div className="text-2xl font-semibold text-accent">{currentStreak}</div>
          <div className="text-sm text-muted">current streak (days)</div>
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
          <div className="text-2xl font-semibold text-foreground">{longestStreak}</div>
          <div className="text-sm text-muted">longest streak (days)</div>
        </div>
      </div>
      <ActivityGraph countByDate={countByDate} todayKey={todayKey} />
    </div>
  );
}
