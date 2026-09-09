import type { ProblemDTO } from "@/models/Problem";
import { ProblemRow } from "./ProblemRow";

/**
 * Fixed-layout table of problems for a single pattern. Renders the column
 * headers and delegates each row to `ProblemRow`, which owns per-row
 * interactivity (toggle/edit/delete). Falls back to `emptyStateMessage`
 * when `problems` is empty (e.g. a newly created pattern with none yet) —
 * the message is a prop rather than hardcoded so callers can tailor it.
 */
export function ProblemTable({
  problems,
  emptyStateMessage,
  isAdmin,
}: {
  problems: ProblemDTO[];
  emptyStateMessage: string;
  isAdmin: boolean;
}) {
  if (problems.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted">{emptyStateMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="w-20 py-2 pl-4 pr-2 text-center font-medium">Status</th>
            <th className="w-60 py-2 pr-4 font-medium">Problem</th>
            <th className="w-24 py-2 pr-4 font-medium">Difficulty</th>
            <th className="hidden w-100 py-2 pr-4 font-medium lg:table-cell">Notes</th>
            <th className="hidden w-24 py-2 pr-4 font-medium lg:table-cell">Revised</th>
            <th className="w-20 py-2 pr-2 text-center font-medium">LeetCode</th>
            <th className="w-20 py-2 pr-2 text-center font-medium">Solution</th>
            <th className="w-20 py-2 pr-4 text-center font-medium">Video</th>
            <th className="w-16 py-2 pr-4 text-center font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {problems.map((problem) => (
            <ProblemRow key={problem.id} problem={problem} isAdmin={isAdmin} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
