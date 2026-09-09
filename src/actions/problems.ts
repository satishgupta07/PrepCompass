/**
 * Server Actions for the Problem entity, used directly by the UI (the
 * "add problem" form, the solved checkbox, "mark revised today", the edit
 * panel, and delete).
 *
 * As with `@/actions/patterns`, all validation and MongoDB access lives in
 * `@/lib/services/problems` (shared with the REST API) — these functions
 * only unpack `FormData`/plain args, apply the admin/per-user auth guards
 * from `@/lib/auth-guard`, call the matching service function, and
 * revalidate the pages whose data could have changed.
 */
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireSession, requireUserId } from "@/lib/auth-guard";
import {
  createProblemService,
  setProblemSolved,
  markProblemRevisedToday,
  updateProblemDetailsForm,
  deleteProblemService,
} from "@/lib/services/problems";

/** Shape returned to `useActionState`/callers: empty object on success, `error` message on failure. */
export type ActionResult = { error?: string };

/**
 * Every problem mutation can affect the tracker (`/`), the 5-day reminders
 * list (`/reminders`), and the activity graph/streaks (`/activity`) — e.g.
 * solving a problem adds a reminder and bumps today's activity count — so
 * all of them revalidate the same three paths.
 */
function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/reminders");
  revalidatePath("/activity");
}

/**
 * Creates a new problem from the "add problem" form. Admin-only — adding to
 * the shared catalog, same bucket as adding a pattern or deleting a
 * problem. `_prevState` is unused but required by `useActionState`'s action
 * signature.
 */
export async function createProblem(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const result = await createProblemService({
    pattern: formData.get("pattern"),
    title: formData.get("title"),
    difficulty: formData.get("difficulty"),
    leetcodeLink: formData.get("leetcodeLink"),
    githubLink: formData.get("githubLink"),
    youtubeLink: formData.get("youtubeLink"),
  });
  if (!result.ok) return { error: result.error };

  revalidateAll();
  return {};
}

/** Flips the solved checkbox for the signed-in user. Fire-and-forget from the UI, so it has no error return. */
export async function toggleSolved(id: string, solved: boolean): Promise<void> {
  const userCheck = await requireUserId();
  if ("error" in userCheck) return;

  await setProblemSolved(userCheck.userId, id, solved);
  revalidateAll();
}

/** Sets the signed-in user's `lastRevisedDate` for this problem to today, used by the reminders page's "revised" action. */
export async function markRevisedToday(id: string): Promise<ActionResult> {
  const userCheck = await requireUserId();
  if ("error" in userCheck) return userCheck;

  const result = await markProblemRevisedToday(userCheck.userId, id);
  if (!result.ok) return { error: result.error };

  revalidateAll();
  return {};
}

/**
 * Full-replace update from the edit panel: every field is always submitted,
 * so (per `updateProblemDetailsForm`'s contract) an empty/absent link input
 * means "clear this link" rather than "leave unchanged" — unlike the REST
 * API's separate partial-PATCH path. Notes/last-revised-date are always the
 * signed-in user's own progress; the link fields only get written through
 * if they're an admin (see `updateProblemDetailsForm`).
 */
export async function updateProblemDetails(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const sessionCheck = await requireSession();
  if ("error" in sessionCheck) return sessionCheck;
  const { userId, isAdmin } = sessionCheck;

  const result = await updateProblemDetailsForm(userId, isAdmin, formData.get("id"), {
    notes: formData.get("notes"),
    lastRevisedDate: formData.get("lastRevisedDate"),
    leetcodeLink: formData.get("leetcodeLink"),
    githubLink: formData.get("githubLink"),
    youtubeLink: formData.get("youtubeLink"),
  });
  if (!result.ok) return { error: result.error };

  revalidateAll();
  return {};
}

/** Deletes a problem from the shared catalog by id. Admin-only. */
export async function deleteProblem(id: string): Promise<ActionResult> {
  const adminCheck = await requireAdmin();
  if (adminCheck) return adminCheck;

  const result = await deleteProblemService(id);
  if (!result.ok) return { error: result.error };

  revalidateAll();
  return {};
}
