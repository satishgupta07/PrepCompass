"use client";

import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/difficulty";
import type { ProblemFilters, StatusFilter } from "@/lib/problem-filters";
import { inputClasses } from "@/components/ui/field-classes";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "solved", label: "Solved" },
  { value: "unsolved", label: "Unsolved" },
];

/**
 * Filter controls for the tracker page: a free-text search box plus
 * difficulty and status dropdowns.
 *
 * Purely controlled/presentational — it holds no state of its own. Each
 * input reads from `filters` and, on change, calls `onChange` with a new
 * `ProblemFilters` object (spreading the previous filters so unrelated
 * fields are untouched). The parent (`TrackerView`) owns the actual filter
 * state and re-derives which patterns/problems to show from it.
 */
export function FilterBar({
  filters,
  onChange,
}: {
  filters: ProblemFilters;
  onChange: (filters: ProblemFilters) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="search"
        value={filters.query}
        onChange={(event) => onChange({ ...filters, query: event.target.value })}
        placeholder="Search problems..."
        className={`${inputClasses} max-w-xs`}
        aria-label="Search problems"
      />
      <select
        value={filters.difficulty}
        onChange={(event) =>
          onChange({ ...filters, difficulty: event.target.value as ProblemFilters["difficulty"] })
        }
        className={`${inputClasses} w-auto`}
        aria-label="Filter by difficulty"
      >
        <option value="all">All difficulties</option>
        {DIFFICULTIES.map((difficulty) => (
          <option key={difficulty} value={difficulty}>
            {DIFFICULTY_META[difficulty].label}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(event) => onChange({ ...filters, status: event.target.value as StatusFilter })}
        className={`${inputClasses} w-auto`}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
