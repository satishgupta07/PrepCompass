import type { ProblemDTO } from "@/models/Problem";
import { tallyByDifficulty } from "@/lib/stats";
import { DifficultyBadge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

/**
 * Top-of-page summary bar: overall solved/total count with a progress bar,
 * plus a per-difficulty solved/total breakdown. Purely derived from the
 * full (unfiltered) `problems` list passed in — no local state.
 */
export function StatsHeader({ problems }: { problems: ProblemDTO[] }) {
  const total = problems.length;
  const solved = problems.filter((p) => p.solved).length;
  // Guard against 0/0 -> NaN when there are no problems at all yet.
  const percent = total === 0 ? 0 : Math.round((solved / total) * 100);
  const byDifficulty = tallyByDifficulty(problems);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">
          {solved} / {total} solved
        </span>
        <ProgressBar percent={percent} />
      </div>
      <div className="flex flex-wrap gap-4">
        {[...byDifficulty.entries()].map(([difficulty, tally]) => (
          <span key={difficulty} className="flex items-center gap-1.5 text-sm">
            <DifficultyBadge difficulty={difficulty} />
            <span className="text-muted">
              {tally.solved}/{tally.total}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
