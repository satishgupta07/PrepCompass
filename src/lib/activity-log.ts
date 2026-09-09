import type { ActivityEventDTO } from "@/models/ActivityEvent";
import type { PatternDTO } from "@/models/Pattern";
import type { ProblemDTO } from "@/models/Problem";

/** One "solved" or "revised" action, ready to display — pattern resolved from slug to display name. */
export type ActivityEvent = {
  problemId: string;
  title: string;
  pattern: string;
  action: "solved" | "revised";
};

/**
 * Groups the full `ActivityEvent` log by day for the Activity page's
 * day-detail view, resolving each event's stored pattern slug to its
 * current display name (`ActivityEvent.pattern` is a slug, same as
 * `Problem.pattern` — see src/models/ActivityEvent.ts). Every action ever
 * recorded shows up here, in the order it happened, including a problem
 * revised more than once in a day or one later unsolved or removed from
 * the catalog.
 */
export function groupActivityByDate(
  events: ActivityEventDTO[],
  patterns: PatternDTO[],
): Map<string, ActivityEvent[]> {
  const patternNameBySlug = new Map(patterns.map((pattern) => [pattern.slug, pattern.name]));
  const log = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const entry: ActivityEvent = {
      problemId: event.problemId,
      title: event.title,
      pattern: patternNameBySlug.get(event.pattern) ?? event.pattern,
      action: event.action,
    };
    const existing = log.get(event.date);
    if (existing) existing.push(entry);
    else log.set(event.date, [entry]);
  }

  return log;
}

/**
 * Best-effort day-detail for dates that predate the `ActivityEvent` log
 * (that collection only starts recording from the day this feature
 * shipped) — reconstructed from each problem's *current* `solvedAt`/
 * `lastRevisedDate` rather than a real per-action history, so it can miss
 * a problem later unsolved/re-revised or show only one entry for a date
 * revised more than once. Only meant to backfill `groupActivityByDate`'s
 * gaps for old dates, never to replace it going forward.
 */
export function deriveFallbackActivityByDate(
  problems: ProblemDTO[],
  patterns: PatternDTO[],
): Map<string, ActivityEvent[]> {
  const patternNameBySlug = new Map(patterns.map((pattern) => [pattern.slug, pattern.name]));
  const log = new Map<string, ActivityEvent[]>();

  function addEvent(dateKey: string | undefined, entry: ActivityEvent) {
    if (!dateKey) return;
    const existing = log.get(dateKey);
    if (existing) existing.push(entry);
    else log.set(dateKey, [entry]);
  }

  for (const problem of problems) {
    const pattern = patternNameBySlug.get(problem.pattern) ?? problem.pattern;
    addEvent(problem.solvedAt, { problemId: problem.id, title: problem.title, pattern, action: "solved" });
    addEvent(problem.lastRevisedDate, {
      problemId: problem.id,
      title: problem.title,
      pattern,
      action: "revised",
    });
  }

  return log;
}
