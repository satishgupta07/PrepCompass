"use client";

import { useTransition } from "react";
import type { DueProblem } from "@/lib/reminders";
import { markRevisedToday } from "@/actions/problems";
import { DifficultyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

/**
 * Reminders page list: one row per problem due for spaced revision
 * (`due`, most overdue first — see `src/lib/reminders.ts` for how that's
 * computed from `lastRevisedDate`/`solvedAt` + the 5-day interval), each
 * with a "Mark revised" button.
 *
 * Props:
 * - `due` — the problems currently due, precomputed on the server.
 * - `patternNameBySlug` — lookup for displaying a problem's pattern name,
 *   since `DueProblem` only carries the pattern slug.
 *
 * Marking a problem revised calls the `markRevisedToday` Server Action,
 * which updates `lastRevisedDate` and records today's activity; the page
 * revalidates and this problem drops out of `due` once it's no longer
 * overdue. `isPending` disables every button while any mark-revised call
 * is in flight, to avoid double-submits.
 */
export function RemindersList({
  due,
  patternNameBySlug,
}: {
  due: DueProblem[];
  patternNameBySlug: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();

  if (due.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
        Nothing due — you&apos;re all caught up.
      </p>
    );
  }

  function handleMarkRevised(id: string) {
    startTransition(async () => {
      await markRevisedToday(id);
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {due.map((problem) => (
        <li
          key={problem.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="font-medium text-foreground">{problem.title}</span>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>{patternNameBySlug[problem.pattern] ?? problem.pattern}</span>
              <DifficultyBadge difficulty={problem.difficulty} />
              <span>{problem.daysOverdue === 0 ? "due today" : `${problem.daysOverdue}d overdue`}</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => handleMarkRevised(problem.id)}
            disabled={isPending}
          >
            Mark revised
          </Button>
        </li>
      ))}
    </ul>
  );
}
