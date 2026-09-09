/**
 * Server Actions for the Pattern entity, used directly by the UI (e.g. the
 * "add pattern" form and the delete button on a pattern card).
 *
 * Per the "one service layer, two transports" split described in
 * CLAUDE.md, this file does no validation or MongoDB work itself — it only
 * checks the `requireAdmin()` guard (patterns are shared/admin-managed,
 * same as problems), unpacks `FormData`/plain args, delegates to the shared
 * service functions in `@/lib/services/patterns` (also used by the REST
 * API), and calls `revalidatePath` so the tracker page reflects the change
 * on next render.
 */
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { createPatternService, deletePatternService } from "@/lib/services/patterns";

/** Shape returned to `useActionState`/callers: empty object on success, `error` message on failure. */
export type ActionResult = { error?: string };

/**
 * Creates a new pattern from the "add pattern" form. Admin-only.
 * `_prevState` is unused but required by `useActionState`'s action signature.
 */
export async function createPattern(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const result = await createPatternService({
    name: formData.get("name"),
    referenceLink: formData.get("referenceLink"),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  return {};
}

/** Deletes a pattern (and, per the service, its problems) by id. Admin-only. */
export async function deletePattern(id: string): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const result = await deletePatternService(id);
  if (!result.ok) return { error: result.error };

  revalidatePath("/");
  return {};
}
