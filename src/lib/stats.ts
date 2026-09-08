// Aggregate solved/total counts per difficulty, used for the tracker's
// overall progress summary (e.g. "12/20 Easy, 8/30 Medium, ...").
import type { ProblemDTO } from "@/models/Problem";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";

export type DifficultyTally = { solved: number; total: number };

/**
 * Tallies solved/total problem counts per difficulty in a single pass over
 * `problems`, instead of filtering the array once per difficulty. Every
 * difficulty in `DIFFICULTIES` is present in the result (starting at 0/0)
 * even if no problems of that difficulty exist yet.
 */
export function tallyByDifficulty(problems: ProblemDTO[]): Map<Difficulty, DifficultyTally> {
  const tally = new Map<Difficulty, DifficultyTally>(
    DIFFICULTIES.map((difficulty) => [difficulty, { solved: 0, total: 0 }]),
  );

  for (const problem of problems) {
    const entry = tally.get(problem.difficulty)!;
    entry.total += 1;
    if (problem.solved) entry.solved += 1;
  }

  return tally;
}
