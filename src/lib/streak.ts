// Streak math for the Activity graph: "current streak" (consecutive active
// days counting back from today/yesterday) and "longest streak" (the
// longest run of consecutive active days ever). `activeDates` is the set
// of "YYYY-MM-DD" date keys that have at least one DayActivity entry
// (see activity.ts / DayActivity model).

const DAY_MS = 86_400_000;

/** Parses a "YYYY-MM-DD" date key as UTC midnight, in milliseconds. */
function toUtcMs(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00.000Z`).getTime();
}

/**
 * Counts consecutive active days ending at today, walking backwards.
 * If today itself has no activity yet, the streak isn't broken until
 * tomorrow — so counting starts from yesterday instead, letting a streak
 * "survive" until the current day ends without activity being logged.
 */
export function computeCurrentStreak(activeDates: Set<string>, todayKey: string): number {
  let cursorMs = toUtcMs(todayKey);
  if (!activeDates.has(todayKey)) {
    cursorMs -= DAY_MS;
  }

  let streak = 0;
  while (activeDates.has(new Date(cursorMs).toISOString().slice(0, 10))) {
    streak += 1;
    cursorMs -= DAY_MS;
  }
  return streak;
}

/**
 * Finds the longest run of consecutive calendar days within `activeDates`,
 * regardless of when it occurred (unlike `computeCurrentStreak`, this
 * isn't anchored to today). Walks the dates in ascending order, extending
 * `current` while each date is exactly one day after the previous one and
 * resetting to 1 on any gap.
 */
export function computeLongestStreak(activeDates: Set<string>): number {
  const sorted = [...activeDates].sort();
  let longest = 0;
  let current = 0;
  let previousMs: number | null = null;

  for (const dateKey of sorted) {
    const ms = toUtcMs(dateKey);
    current = previousMs !== null && ms - previousMs === DAY_MS ? current + 1 : 1;
    longest = Math.max(longest, current);
    previousMs = ms;
  }

  return longest;
}
