// Client-side search/difficulty/status filtering applied on top of the
// pattern-grouped problem list (see grouping.ts) for the tracker page's
// search box and filter pills.
import type { ProblemDTO } from "@/models/Problem";
import type { PatternGroup } from "@/lib/grouping";
import type { Difficulty } from "@/lib/difficulty";

export type StatusFilter = "all" | "solved" | "unsolved";

export type ProblemFilters = {
  query: string;
  difficulty: Difficulty | "all";
  status: StatusFilter;
};

export const DEFAULT_FILTERS: ProblemFilters = { query: "", difficulty: "all", status: "all" };

export function hasActiveFilters(filters: ProblemFilters): boolean {
  return filters.query.trim() !== "" || filters.difficulty !== "all" || filters.status !== "all";
}

/** Whether a single problem satisfies the difficulty/status/title-search filters. */
function matchesFilters(problem: ProblemDTO, filters: ProblemFilters): boolean {
  if (filters.difficulty !== "all" && problem.difficulty !== filters.difficulty) return false;
  if (filters.status === "solved" && !problem.solved) return false;
  if (filters.status === "unsolved" && problem.solved) return false;

  const query = filters.query.trim().toLowerCase();
  if (query && !problem.title.toLowerCase().includes(query)) return false;

  return true;
}

/**
 * Filters problems within each group while keeping solvedCount/totalCount/
 * percent as the pattern's true stats — the header progress bar reflects
 * overall progress, not the current search, so filtering never makes it
 * look like progress was lost.
 */
export function applyFilterToGroups(groups: PatternGroup[], filters: ProblemFilters): PatternGroup[] {
  return groups.map((group) => ({
    ...group,
    problems: group.problems.filter((problem) => matchesFilters(problem, filters)),
  }));
}
