/**
 * Server Actions for the Problem entity, used directly by the UI (the
 * "add problem" form, the solved checkbox, "mark revised today", the edit
 * panel, and delete).
 *
 * As with `@/actions/patterns`, all validation and MongoDB access lives in
 * `@/lib/services/problems` (shared with the REST API) — these functions
 * only unpack `FormData`/plain args, call the matching service function,
 * and revalidate the pages whose data could have changed.
 */
"use server";

import { revalidatePath } from "next/cache";
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
 * Creates a new problem from the "add problem" form.
 * `_prevState` is unused but required by `useActionState`'s action signature.
 */
export async function createProblem(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
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

/** Flips the solved checkbox. Fire-and-forget from the UI, so it has no error return. */
export async function toggleSolved(id: string, solved: boolean): Promise<void> {
  await setProblemSolved(id, solved);
  revalidateAll();
}

/** Sets a problem's `lastRevisedDate` to today, used by the reminders page's "revised" action. */
export async function markRevisedToday(id: string): Promise<ActionResult> {
  const result = await markProblemRevisedToday(id);
  if (!result.ok) return { error: result.error };

  revalidateAll();
  return {};
}

/**
 * Full-replace update from the edit panel: every field is always submitted,
 * so (per `updateProblemDetailsForm`'s contract) an empty/absent link means
 * "clear it" rather than "leave unchanged".
 */
export async function updateProblemDetails(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const result = await updateProblemDetailsForm(formData.get("id"), {
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

/** Deletes a problem by id. */
export async function deleteProblem(id: string): Promise<ActionResult> {
  const result = await deleteProblemService(id);
  if (!result.ok) return { error: result.error };

  revalidateAll();
  return {};
}
