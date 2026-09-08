/**
 * Server Actions for the Pattern entity, used directly by the UI (e.g. the
 * "add pattern" form and the delete button on a pattern card).
 *
 * Per the "one service layer, two transports" split described in
 * CLAUDE.md, this file does no validation or MongoDB work itself — it only
 * unpacks `FormData`/plain args, delegates to the shared service functions
 * in `@/lib/services/patterns` (also used by the REST API), and calls
 * `revalidatePath` so the tracker page reflects the change on next render.
 */
"use server";

import { revalidatePath } from "next/cache";
import { createPatternService, deletePatternService } from "@/lib/services/patterns";

/** Shape returned to `useActionState`/callers: empty object on success, `error` message on failure. */
export type ActionResult = { error?: string };

/**
 * Creates a new pattern from the "add pattern" form.
 * `_prevState` is unused but required by `useActionState`'s action signature.
 */
export async function createPattern(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const result = await createPatternService({
    name: formData.get("name"),
    referenceLink: formData.get("referenceLink"),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  return {};
}

/** Deletes a pattern (and, per the service, its problems) by id. */
export async function deletePattern(id: string): Promise<ActionResult> {
  const result = await deletePatternService(id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  return {};
}
