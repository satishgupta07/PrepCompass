"use client";

import { useState, useTransition } from "react";
import type { PatternGroup } from "@/lib/grouping";
import { deletePattern } from "@/actions/patterns";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChevronDownIcon, ExternalLinkIcon, TrashIcon } from "@/components/ui/icons";
import { ProblemTable } from "./ProblemTable";
import { AddProblemForm } from "./AddProblemForm";

/**
 * Collapsible section for one pattern: header (name, reference link,
 * delete button, solved-count/progress bar) plus, when expanded, the
 * pattern's problem table and an "Add Problem" trigger.
 *
 * Props:
 * - `group` — a pattern bundled with its problems and precomputed
 *   solved/total/percent stats (see `src/lib/grouping.ts`).
 * - `defaultOpen` — initial expanded state (the tracker page opens the
 *   first pattern by default).
 * - `forceOpen` — when true (active search/filter in `TrackerView`),
 *   overrides local state so every matching pattern stays expanded
 *   regardless of what the user previously clicked.
 *
 * Own state: `isOpen` tracks manual expand/collapse; `effectiveOpen` is
 * the actual rendered state, OR'd with `forceOpen`. Deleting a pattern
 * runs through a transition so the header's delete icon can show a
 * pending/disabled state and surface a returned error inline.
 */
export function PatternAccordion({
  group,
  defaultOpen = false,
  forceOpen = false,
}: {
  group: PatternGroup;
  defaultOpen?: boolean;
  forceOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string>();
  const { pattern, problems, solvedCount, totalCount, percent } = group;
  const effectiveOpen = forceOpen || isOpen;

  function handleDeletePattern(event: React.MouseEvent) {
    // Stop the click from also toggling the accordion (the delete icon
    // sits inside the clickable header row).
    event.stopPropagation();
    if (!window.confirm(`Delete pattern "${pattern.name}"?`)) return;

    startTransition(async () => {
      const result = await deletePattern(pattern.id);
      setDeleteError(result.error);
    });
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* Header row is a div-as-button (not <button>) so it can contain the
          nested reference link and delete button; role/tabIndex/onKeyDown
          restore native button semantics and keyboard accessibility. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") setIsOpen((open) => !open);
        }}
        aria-expanded={effectiveOpen}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-muted transition-transform ${effectiveOpen ? "" : "-rotate-90"}`}
          />
          <span className="truncate text-lg font-semibold text-foreground">{pattern.name}</span>
          {pattern.referenceLink && (
            <a
              href={pattern.referenceLink}
              target="_blank"
              rel="noopener noreferrer"
              // Don't let opening the reference link also toggle the accordion.
              onClick={(e) => e.stopPropagation()}
              aria-label={`${pattern.name} reference`}
              className="text-muted transition-colors hover:text-foreground"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={handleDeletePattern}
            disabled={isPending}
            aria-label={`Delete ${pattern.name}`}
            className="text-muted transition-colors hover:text-hard"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-muted">
            {solvedCount} / {totalCount}
          </span>
          <ProgressBar percent={percent} />
        </span>
      </div>

      {effectiveOpen && (
        <div className="border-t border-border">
          {deleteError && <p className="px-4 pt-3 text-sm text-hard">{deleteError}</p>}
          <ProblemTable problems={problems} emptyStateMessage="No problems here yet." />
          <div className="flex justify-end px-4 py-3">
            <AddProblemForm pattern={pattern} />
          </div>
        </div>
      )}
    </section>
  );
}
