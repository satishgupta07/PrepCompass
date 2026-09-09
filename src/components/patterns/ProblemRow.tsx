"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { ProblemDTO } from "@/models/Problem";
import { toggleSolved, deleteProblem } from "@/actions/problems";
import { DifficultyBadge } from "@/components/ui/Badge";
import { IconLink } from "@/components/ui/IconLink";
import { GithubIcon, LeetCodeIcon, PencilIcon, TrashIcon, YoutubeIcon } from "@/components/ui/icons";
import { ProblemEditPanel } from "./ProblemEditPanel";

const MS_PER_DAY = 86_400_000;

// Human-friendly "how long ago" label for the last-revised-date tooltip,
// e.g. "today" / "1d ago" / "5d ago". Purely a display helper — the
// underlying due/overdue math for reminders lives in src/lib/reminders.ts.
function relativeDays(isoDate: string): string {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / MS_PER_DAY);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

// Short display date for the "Revised" column, e.g. "Mar 4".
function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * One row in a pattern's problem table: solved checkbox, title, difficulty
 * badge, notes preview, last-revised date, reference icon links, and
 * edit/delete actions. Also owns the `ProblemEditPanel` modal for editing
 * this problem's details.
 *
 * State:
 * - `optimisticSolved` (`useOptimistic`) — flips the checkbox immediately
 *   on click, before `toggleSolved`'s Server Action round-trip resolves,
 *   so the UI doesn't lag; it's automatically reconciled with the real
 *   `problem.solved` prop once the action settles and the page revalidates.
 * - `isPending` (`useTransition`) — true while a toggle/delete action is
 *   in flight; used to disable the checkbox/delete button so a second
 *   click can't race the first.
 * - `isEditOpen` — whether the edit modal is open.
 */
export function ProblemRow({ problem, isAdmin }: { problem: ProblemDTO; isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticSolved, setOptimisticSolved] = useOptimistic(problem.solved);
  const [isEditOpen, setIsEditOpen] = useState(false);

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      // Set the optimistic value first so the checkbox updates instantly;
      // the Server Action call below is what actually persists it and
      // (via revalidatePath) records today's activity/streak.
      setOptimisticSolved(checked);
      await toggleSolved(problem.id, checked);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${problem.title}"?`)) return;
    startTransition(async () => {
      await deleteProblem(problem.id);
    });
  }

  return (
    <>
      <tr className="border-t border-border align-top">
        <td className="w-20 py-3 pl-4 pr-2 text-center">
          <input
            type="checkbox"
            checked={optimisticSolved}
            onChange={(event) => handleToggle(event.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-border bg-surface accent-accent"
            aria-label={`${problem.title} solved`}
          />
        </td>
        <td className="w-60 py-3 pr-4">
          <div className="font-medium text-foreground">{problem.title}</div>
        </td>
        <td className="w-24 py-3 pr-4">
          <DifficultyBadge difficulty={problem.difficulty} />
        </td>
        <td className="hidden w-100 py-3 pr-4 lg:table-cell">
          {problem.notes ? (
            <p className="whitespace-normal break-words text-muted">{problem.notes}</p>
          ) : (
            <span className="text-muted/40">—</span>
          )}
        </td>
        <td className="hidden w-24 py-3 pr-4 lg:table-cell">
          {problem.lastRevisedDate ? (
            <span className="text-muted" title={relativeDays(problem.lastRevisedDate)}>
              {formatDate(problem.lastRevisedDate)}
            </span>
          ) : (
            <span className="text-muted/40">—</span>
          )}
        </td>
        <td className="w-20 py-3 pr-2">
          <div className="flex justify-center">
            <IconLink href={problem.leetcodeLink} label="Open on LeetCode">
              <LeetCodeIcon className="h-4 w-4" />
            </IconLink>
          </div>
        </td>
        <td className="w-20 py-3 pr-2">
          <div className="flex justify-center">
            <IconLink href={problem.githubLink} label="View GitHub solution">
              <GithubIcon className="h-4 w-4" />
            </IconLink>
          </div>
        </td>
        <td className="w-20 py-3 pr-4">
          <div className="flex justify-center">
            <IconLink href={problem.youtubeLink} label="Watch reference video">
              <YoutubeIcon className="h-4 w-4" />
            </IconLink>
          </div>
        </td>
        <td className="w-16 py-3 pr-4">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              aria-label="Edit notes"
              className="text-muted transition-colors hover:text-foreground"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                aria-label="Delete problem"
                className="text-muted transition-colors hover:text-hard"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </td>
      </tr>
      <ProblemEditPanel
        problem={problem}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        isAdmin={isAdmin}
      />
    </>
  );
}
