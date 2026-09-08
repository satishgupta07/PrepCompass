// Joins the two core collections (Pattern, Problem) into the per-pattern
// view the tracker page renders: each pattern alongside its own problems
// and solved/total/percent progress stats.
import type { PatternDTO } from "@/models/Pattern";
import type { ProblemDTO } from "@/models/Problem";

export type PatternGroup = {
  pattern: PatternDTO;
  problems: ProblemDTO[];
  solvedCount: number;
  totalCount: number;
  percent: number;
};

/**
 * Groups `problems` by their owning pattern (matched via `problem.pattern`
 * === `pattern.slug`), sorted in the patterns' curated display order.
 * Patterns with no problems yet still appear, with an empty list and 0%.
 */
export function groupByPattern(
  patterns: PatternDTO[],
  problems: ProblemDTO[],
): PatternGroup[] {
  // Bucket problems by pattern slug in one pass, rather than filtering the
  // full problem list once per pattern.
  const problemsByPatternSlug = new Map<string, ProblemDTO[]>();
  for (const problem of problems) {
    const list = problemsByPatternSlug.get(problem.pattern) ?? [];
    list.push(problem);
    problemsByPatternSlug.set(problem.pattern, list);
  }

  return [...patterns]
    .sort((a, b) => a.order - b.order)
    .map((pattern) => {
      const patternProblems = problemsByPatternSlug.get(pattern.slug) ?? [];
      const solvedCount = patternProblems.filter((p) => p.solved).length;
      const totalCount = patternProblems.length;
      const percent = totalCount === 0 ? 0 : Math.round((solvedCount / totalCount) * 100);
      return { pattern, problems: patternProblems, solvedCount, totalCount, percent };
    });
}
