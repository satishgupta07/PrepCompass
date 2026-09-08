import { buildContributionWeeks, getMonthMarkers } from "@/lib/calendar";

// Maps a day's activity count to a Tailwind background class, in five
// buckets — mirrors the classic GitHub contribution-graph look, from "no
// activity" through increasingly saturated shades of the accent color.
// Kept as discrete buckets (rather than a computed opacity) so the same
// tokens shown in the "Less ... More" legend below are the only ones ever
// rendered.
function intensityClass(count: number): string {
  if (count <= 0) return "bg-border/50";
  if (count === 1) return "bg-accent/30";
  if (count === 2) return "bg-accent/55";
  if (count <= 4) return "bg-accent/80";
  return "bg-accent";
}

/**
 * GitHub-style contribution graph for the Activity page.
 *
 * Renders a week-by-week grid of day cells going back `weeks` weeks from
 * `todayKey`, colored by how much activity (`countByDate`) happened that
 * day, plus a row of month labels above and a "Less/More" legend below.
 *
 * Props:
 * - `countByDate` — day key ("YYYY-MM-DD") -> DayActivity count, used only
 *   for lookups here; the grid's shape/order comes from `buildContributionWeeks`.
 * - `todayKey` — the day the grid ends on (anchors the whole grid).
 * - `weeks` — how many columns (weeks) of history to show; defaults to
 *   roughly a year.
 */
export function ActivityGraph({
  countByDate,
  todayKey,
  weeks = 53,
}: {
  countByDate: Map<string, number>;
  todayKey: string;
  weeks?: number;
}) {
  // `grid` is weeks[] of 7 day keys each (or null for days outside the
  // range, e.g. before the very first week starts on a non-Sunday).
  // `monthMarkers` is parallel to `grid` by week index, flagging which
  // week a new month starts in so we can inset a label + spacing there.
  const grid = buildContributionWeeks(todayKey, weeks);
  const monthMarkers = getMonthMarkers(grid);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
      <div className="inline-flex flex-col gap-1">
        {/* Month label row: one label slot per week column, indented where a month starts. */}
        <div className="inline-flex gap-1">
          {monthMarkers.map((marker, weekIndex) => (
            <div
              key={weekIndex}
              className={`w-3 shrink-0 text-[10px] whitespace-nowrap text-muted ${marker.isMonthStart ? "ml-2" : ""}`}
            >
              {marker.label}
            </div>
          ))}
        </div>
        {/* Day grid: one column per week, one cell per day-of-week within it. */}
        <div className="inline-flex gap-1">
          {grid.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className={`flex flex-col gap-1 ${monthMarkers[weekIndex]?.isMonthStart ? "ml-2" : ""}`}
            >
              {week.map((dateKey, dayIndex) => (
                <div
                  key={dayIndex}
                  title={dateKey ? `${dateKey}: ${countByDate.get(dateKey) ?? 0} activity` : undefined}
                  // `dateKey` is null for cells that pad out the grid before
                  // day one (or after today) — render those as transparent
                  // placeholders instead of an empty/zero activity cell.
                  className={`h-3 w-3 rounded-sm ${dateKey ? intensityClass(countByDate.get(dateKey) ?? 0) : "bg-transparent"}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-border/50" />
        <span className="h-3 w-3 rounded-sm bg-accent/30" />
        <span className="h-3 w-3 rounded-sm bg-accent/55" />
        <span className="h-3 w-3 rounded-sm bg-accent/80" />
        <span className="h-3 w-3 rounded-sm bg-accent" />
        <span>More</span>
      </div>
    </div>
  );
}
