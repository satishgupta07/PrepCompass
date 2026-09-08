"use client";

import { updateProblemDetails } from "@/actions/problems";
import type { ProblemDTO } from "@/models/Problem";
import { useServerFormAction } from "@/lib/hooks/useServerFormAction";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { inputClasses, labelClasses } from "@/components/ui/field-classes";

/**
 * Modal form for editing a problem's mutable details: notes, last-revised
 * date, and the three optional reference links.
 *
 * Submits to `updateProblemDetails`, the full-replace Server Action (see
 * AGENTS.md/CLAUDE.md: every field is always sent, so an emptied link
 * input means "clear this link" rather than "leave it unchanged" — unlike
 * the REST API's separate partial-PATCH path). Fields are uncontrolled
 * (`defaultValue` only), which is why `resetOnSuccess: false` is passed to
 * `useServerFormAction` — `defaultValue` is fixed to the pre-edit `problem`
 * prop, so a `form.reset()` right after a successful save would revert the
 * visible fields back to their old values instead of the ones just saved.
 *
 * Props: `problem` (data to prefill and the id to submit), `open`/`onClose`
 * (controlled by the parent `ProblemRow`, which owns the open/closed state).
 */
export function ProblemEditPanel({
  problem,
  open,
  onClose,
}: {
  problem: ProblemDTO;
  open: boolean;
  onClose: () => void;
}) {
  const { error, isPending, handleSubmit } = useServerFormAction(updateProblemDetails, {
    onSuccess: onClose,
    // Fields below are uncontrolled (defaultValue), so their current DOM
    // values already match what was just saved — resetting would instead
    // wipe them back to the pre-edit defaultValue on next render.
    resetOnSuccess: false,
  });

  return (
    <Modal open={open} onClose={onClose} title={problem.title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={problem.id} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-notes" className={labelClasses}>
            Notes / approach
          </label>
          <textarea
            id="edit-notes"
            name="notes"
            rows={5}
            defaultValue={problem.notes}
            maxLength={10_000}
            className={`${inputClasses} resize-y`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-last-revised" className={labelClasses}>
            Last revised date
          </label>
          <input
            id="edit-last-revised"
            name="lastRevisedDate"
            type="date"
            defaultValue={problem.lastRevisedDate ?? ""}
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-leetcode" className={labelClasses}>
            LeetCode link
          </label>
          <input
            id="edit-leetcode"
            name="leetcodeLink"
            type="url"
            defaultValue={problem.leetcodeLink ?? ""}
            placeholder="https://leetcode.com/problems/..."
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-github" className={labelClasses}>
            GitHub solution link
          </label>
          <input
            id="edit-github"
            name="githubLink"
            type="url"
            defaultValue={problem.githubLink ?? ""}
            placeholder="https://github.com/..."
            className={inputClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-youtube" className={labelClasses}>
            YouTube reference link
          </label>
          <input
            id="edit-youtube"
            name="youtubeLink"
            type="url"
            defaultValue={problem.youtubeLink ?? ""}
            placeholder="https://youtube.com/..."
            className={inputClasses}
          />
        </div>
        {error && <p className="text-sm text-hard">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
