"use client";

import { useState } from "react";
import { createPattern } from "@/actions/patterns";
import { useServerFormAction } from "@/lib/hooks/useServerFormAction";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { inputClasses, labelClasses } from "@/components/ui/field-classes";
import { PlusIcon } from "@/components/ui/icons";

/**
 * "Add Pattern" trigger button + modal form.
 *
 * Self-contained: owns the modal's open/closed state and submits directly
 * to the `createPattern` Server Action via `useServerFormAction` (which
 * handles pending/error state and calling the action with the form's
 * `FormData`). On success the modal closes and the form resets; the parent
 * page picks up the new pattern via the Server Action's `revalidatePath`.
 * No props — this is rendered once per page, not per-pattern.
 */
export function AddPatternForm() {
  const [open, setOpen] = useState(false);
  const { error, isPending, handleSubmit } = useServerFormAction(createPattern, {
    onSuccess: () => setOpen(false),
  });

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        Add Pattern
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add pattern">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pattern-name" className={labelClasses}>
              Name
            </label>
            <input
              id="pattern-name"
              name="name"
              required
              maxLength={100}
              placeholder="e.g. Monotonic Stack"
              className={inputClasses}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pattern-reference" className={labelClasses}>
              Reference link (optional)
            </label>
            <input
              id="pattern-reference"
              name="referenceLink"
              type="url"
              placeholder="https://..."
              className={inputClasses}
            />
          </div>
          {error && <p className="text-sm text-hard">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add pattern"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
