/**
 * Server Action for study-notebook progress, used by the checklist on
 * /study/[slug]. Validation and MongoDB access live in
 * `@/lib/services/study`; this only applies the signed-in-user guard and
 * revalidates the two pages that show the numbers.
 */
"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-guard";
import { setPageStudied } from "@/lib/services/study";

export type ActionResult = { error?: string };

/** Marks a notebook page studied (or not) for the signed-in user. */
export async function toggleStudyPage(slug: string, pageId: string, studied: boolean): Promise<ActionResult> {
  const userCheck = await requireUserId();
  if ("error" in userCheck) return userCheck;

  try {
    const result = await setPageStudied(userCheck.userId, slug, pageId, studied);
    if (!result.ok) return { error: result.error };
  } catch (error) {
    // Database down/slow: report it so the checkbox rolls back instead of
    // the client seeing an unhandled server error.
    console.error("toggleStudyPage failed", error);
    return { error: "Couldn't save your progress. Try again." };
  }

  revalidatePath("/study");
  revalidatePath(`/study/${slug}`);
  return {};
}
