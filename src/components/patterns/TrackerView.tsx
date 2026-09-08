"use client";

import { useMemo, useState } from "react";
import type { PatternGroup } from "@/lib/grouping";
import {
  DEFAULT_FILTERS,
  applyFilterToGroups,
  hasActiveFilters,
  type ProblemFilters,
} from "@/lib/problem-filters";
import { FilterBar } from "./FilterBar";
import { PatternAccordionList } from "./PatternAccordionList";

/**
 * Top-level client component for the tracker page: owns the search/
 * difficulty/status filter state and renders the filter bar plus the
 * (possibly filtered) list of pattern accordions.
 *
 * `groups` (patterns + their problems, from the server) is the full,
 * unfiltered dataset; filtering happens entirely client-side so typing in
 * the search box doesn't round-trip to the server.
 */
export function TrackerView({ groups }: { groups: PatternGroup[] }) {
  const [filters, setFilters] = useState<ProblemFilters>(DEFAULT_FILTERS);
  const active = hasActiveFilters(filters);

  // Recompute the filtered view only when the inputs actually change.
  // Skipping the filter pass entirely when nothing is active both saves
  // work and avoids dropping patterns that have zero problems by default
  // (applyFilterToGroups + the empty-problems filter below would otherwise
  // hide those even with no active filters).
  const displayGroups = useMemo(() => {
    if (!active) return groups;
    // Apply the query/difficulty/status filter to each pattern's problem
    // list, then drop any pattern left with no matching problems so empty
    // sections don't clutter the filtered results.
    return applyFilterToGroups(groups, filters).filter((group) => group.problems.length > 0);
  }, [groups, filters, active]);

  return (
    <div className="flex flex-col gap-4">
      <FilterBar filters={filters} onChange={setFilters} />
      {active && displayGroups.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
          No problems match your filters.
        </p>
      ) : (
        <PatternAccordionList groups={displayGroups} forceOpenAll={active} />
      )}
    </div>
  );
}
