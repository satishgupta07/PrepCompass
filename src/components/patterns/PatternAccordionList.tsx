import type { PatternGroup } from "@/lib/grouping";
import { PatternAccordion } from "./PatternAccordion";

/**
 * Renders the list of pattern accordions on the tracker page, or an empty
 * state when there are no patterns (or none match the current filters).
 *
 * Props:
 * - `groups` — patterns-with-problems to render, already filtered/sorted
 *   by the caller (`TrackerView`).
 * - `forceOpenAll` — passed straight through to every `PatternAccordion`
 *   so, while a search/filter is active, all matching patterns stay
 *   expanded instead of respecting each one's own open/closed state.
 *
 * Only the first pattern (`index === 0`) is expanded by default when no
 * filter is active, keeping the initial page load compact.
 */
export function PatternAccordionList({
  groups,
  forceOpenAll = false,
  isAdmin,
}: {
  groups: PatternGroup[];
  forceOpenAll?: boolean;
  isAdmin: boolean;
}) {
  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
        No patterns yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <PatternAccordion
          key={group.pattern.id}
          group={group}
          defaultOpen={index === 0}
          forceOpen={forceOpenAll}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
