// Builds the data behind the GitHub-style Activity graph: a Sun-Sat week
// grid to render, plus the month labels/dividers drawn above it. All date
// math here is done in UTC (via the `Z`-suffixed ISO strings and the
// `getUTC*`/`setUTC*` accessors) to match the "YYYY-MM-DD" date keys used
// everywhere else in the app — mixing in local-time Date methods here would
// shift the grid by a day for users west/east of UTC.

/**
 * Builds a GitHub-style contribution grid: `weeks` columns of 7 rows (one
 * row per weekday, Sun-Sat), always ending with the week that contains
 * `todayKey`. Any generated day that falls after today (only possible in
 * today's own row, to its right) is emitted as `null` so the UI can render
 * it blank instead of as a future day with zero activity.
 */
export function buildContributionWeeks(todayKey: string, weeks: number): (string | null)[][] {
  const totalDays = weeks * 7;
  const today = new Date(`${todayKey}T00:00:00.000Z`);
  const todayDow = today.getUTCDay(); // 0 = Sunday .. 6 = Saturday

  // The grid must start on a Sunday and span exactly `totalDays` days while
  // still landing on `today` in its correct weekday slot within the final
  // row. `today` sits `todayDow` days into its row, and that row is the
  // last of `totalDays` days, so the first day of the grid is
  // `totalDays - 1 - todayDow` days before today.
  const cursor = new Date(today);
  cursor.setUTCDate(cursor.getUTCDate() - (totalDays - 1 - todayDow));

  const result: (string | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: (string | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push(key > todayKey ? null : key);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    result.push(week);
  }
  return result;
}

export type MonthMarker = { label: string | null; isMonthStart: boolean };

/**
 * For each week column returned by `buildContributionWeeks`, decides its
 * month label (only shown on the column where that month first appears)
 * and whether to add extra spacing before that column to visually separate
 * it from the previous month.
 */
export function getMonthMarkers(weeks: (string | null)[][]): MonthMarker[] {
  // -1 is not a valid `getUTCMonth()` value, so the first column with any
  // real day always counts as "a new month" and gets a label.
  let previousMonth = -1;

  return weeks.map((week, index) => {
    // A week may be entirely `null` (all days in the future) — nothing to
    // label in that case.
    const firstDay = week.find((day) => day !== null);
    if (!firstDay) return { label: null, isMonthStart: false };

    const month = new Date(`${firstDay}T00:00:00.000Z`).getUTCMonth();
    const isNewMonth = month !== previousMonth;
    const label = isNewMonth
      ? new Date(`${firstDay}T00:00:00.000Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
      : null;
    previousMonth = month;

    // Never mark the very first column as a "month start" divider — there's
    // no preceding month to separate it from.
    return { label, isMonthStart: isNewMonth && index !== 0 };
  });
}
