"use client";

import { useState } from "react";
import { buildContributionWeeks, getMonthMarkers } from "@/lib/calendar";
import type { ActivityEvent } from "@/lib/activity-log";
import { Modal } from "@/components/ui/Modal";

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

function formatDayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Contents of the day-detail modal: every solve/revise action recorded on
 * the clicked day (see `groupActivityByDate`), in the order it happened —
 * a problem revised more than once that day shows once per action.
 */
function DayDetail({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No problems solved or revised on this day.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event, index) => (
        <li
          key={`${event.problemId}-${event.action}-${index}`}
          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{event.title}</span>
            <span className="text-xs text-muted">{event.pattern}</span>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              event.action === "solved" ? "bg-easy/20 text-easy" : "bg-accent/20 text-accent"
            }`}
          >
            {event.action === "solved" ? "Solved" : "Revised"}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * GitHub-style contribution graph for the Activity page.
 *
 * Renders a week-by-week grid of day cells going back `weeks` weeks from
 * `todayKey`, colored by how much activity (`countByDate`) happened that
 * day, plus a row of month labels above and a "Less/More" legend below.
 * Clicking a day that had any activity opens a modal listing what was
 * solved/revised that day (`activityByDate`); days with no activity aren't
 * clickable.
 *
 * Props:
 * - `countByDate` — day key ("YYYY-MM-DD") -> DayActivity count, used only
 *   for lookups here; the grid's shape/order comes from `buildContributionWeeks`.
 * - `activityByDate` — day key -> the problems solved/revised that day.
 * - `todayKey` — the day the grid ends on (anchors the whole grid).
 * - `weeks` — how many columns (weeks) of history to show; defaults to
 *   roughly a year.
 */
export function ActivityGraph({
  countByDate,
  activityByDate,
  todayKey,
  weeks = 53,
}: {
  countByDate: Map<string, number>;
  activityByDate: Map<string, ActivityEvent[]>;
  todayKey: string;
  weeks?: number;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
              {week.map((dateKey, dayIndex) => {
                const count = dateKey ? countByDate.get(dateKey) ?? 0 : 0;
                const hasActivity = count > 0;

                // `dateKey` is null for cells that pad out the grid before
                // day one (or after today) — render those as transparent
                // placeholders instead of an empty/zero activity cell.
                if (!dateKey) {
                  return <div key={dayIndex} className="h-3 w-3 rounded-sm bg-transparent" />;
                }

                if (!hasActivity) {
                  return (
                    <div
                      key={dayIndex}
                      title={`${dateKey}: no activity`}
                      className={`h-3 w-3 rounded-sm ${intensityClass(count)}`}
                    />
                  );
                }

                return (
                  <button
                    key={dayIndex}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    title={`${dateKey}: ${count} activity`}
                    aria-label={`${dateKey}: ${count} activity, view details`}
                    className={`h-3 w-3 cursor-pointer rounded-sm ring-offset-1 ring-offset-surface transition-transform hover:scale-125 hover:ring-2 hover:ring-foreground/40 ${intensityClass(count)}`}
                  />
                );
              })}
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
      <Modal open={selectedDate !== null} onClose={() => setSelectedDate(null)} title={selectedDate ? formatDayLabel(selectedDate) : ""}>
        <DayDetail events={selectedDate ? activityByDate.get(selectedDate) ?? [] : []} />
      </Modal>
    </div>
  );
}
