// Computes the spaced-revision queue shown on the Reminders page: which
// solved problems are due for another look, and how overdue each one is.
import type { ProblemDTO } from "@/models/Problem";

/** Days after solving (or last revising) a problem before it's due again. */
export const REVISION_INTERVAL_DAYS = 5;
const DAY_MS = 86_400_000;

export type DueProblem = ProblemDTO & { dueDate: string; daysOverdue: number };

/** Parses a "YYYY-MM-DD" date key as UTC midnight, in milliseconds. */
function toUtcMs(dateKey: string): number {
  return new Date(`${dateKey}T00:00:00.000Z`).getTime();
}

/**
 * Problems solved 5+ days ago (or last revised 5+ days ago) that are due
 * for another look, most overdue first.
 *
 * The revision "anchor" — the date the 5-day clock counts from — is
 * `lastRevisedDate` if the problem has been revised since solving, and
 * `solvedAt` (set once, the moment the problem was first checked solved)
 * otherwise. A problem is due once `anchor + REVISION_INTERVAL_DAYS` is on
 * or before today; `daysOverdue` is how many whole days past that due date
 * today is (0 means due today).
 */
export function getDueProblems(problems: ProblemDTO[], todayKey: string): DueProblem[] {
  const todayMs = toUtcMs(todayKey);

  return problems
    .filter((problem) => problem.solved && problem.solvedAt)
    .map((problem) => {
      const anchor = problem.lastRevisedDate ?? problem.solvedAt!;
      const dueMs = toUtcMs(anchor) + REVISION_INTERVAL_DAYS * DAY_MS;
      const daysOverdue = Math.floor((todayMs - dueMs) / DAY_MS);
      return { ...problem, dueDate: new Date(dueMs).toISOString().slice(0, 10), daysOverdue };
    })
    .filter((problem) => problem.daysOverdue >= 0) // not yet due
    .sort((a, b) => b.daysOverdue - a.daysOverdue); // most overdue first
}
