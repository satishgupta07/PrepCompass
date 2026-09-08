"use client";

import { useState } from "react";
import { createProblem } from "@/actions/problems";
import type { PatternDTO } from "@/models/Pattern";
import { DIFFICULTIES, DIFFICULTY_META } from "@/lib/difficulty";
import { useServerFormAction } from "@/lib/hooks/useServerFormAction";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { inputClasses, labelClasses } from "@/components/ui/field-classes";
import { PlusIcon } from "@/components/ui/icons";

/**
 * "Add Problem" trigger button + modal form, scoped to a single pattern.
 *
 * Rendered inside a `PatternAccordion`'s header row, so the trigger button
 * stops click propagation to avoid also toggling the accordion open/closed.
 * The pattern's `slug` is submitted as a hidden field so the `createProblem`
 * Server Action knows which pattern to attach the new problem to; the rest
 * of the state/submit handling mirrors `AddPatternForm`.
 */
export function AddProblemForm({ pattern }: { pattern: PatternDTO }) {
  const [open, setOpen] = useState(false);
  const { error, isPending, handleSubmit } = useServerFormAction(createProblem, {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button
        variant="ghost"
        onClick={(event) => {
          // Prevent the click from bubbling up to the accordion header,
          // which toggles open/closed on click.
          event.stopPropagation();
          setOpen(true);
        }}
        className="text-xs"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        Add Problem
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Add problem — ${pattern.name}`}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Hidden field ties the new problem to this pattern; not a visible form field. */}
          <input type="hidden" name="pattern" value={pattern.slug} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="problem-title" className={labelClasses}>
              Title
            </label>
            <input
              id="problem-title"
              name="title"
              required
              maxLength={200}
              placeholder="e.g. Two Sum"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="problem-difficulty" className={labelClasses}>
              Difficulty
            </label>
            <select id="problem-difficulty" name="difficulty" required defaultValue="easy" className={inputClasses}>
              {DIFFICULTIES.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {DIFFICULTY_META[difficulty].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="problem-leetcode" className={labelClasses}>
              LeetCode link (optional)
            </label>
            <input id="problem-leetcode" name="leetcodeLink" type="url" placeholder="https://leetcode.com/problems/..." className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="problem-github" className={labelClasses}>
              GitHub solution link (optional)
            </label>
            <input id="problem-github" name="githubLink" type="url" placeholder="https://github.com/..." className={inputClasses} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="problem-youtube" className={labelClasses}>
              YouTube reference link (optional)
            </label>
            <input id="problem-youtube" name="youtubeLink" type="url" placeholder="https://youtube.com/..." className={inputClasses} />
          </div>
          {error && <p className="text-sm text-hard">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add problem"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
