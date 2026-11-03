/**
 * MongoDB logic for study-notebook progress (see src/models/StudyProgress.ts).
 * Called from the Server Action in src/actions/study.ts and from the /study
 * pages, always with the signed-in user's id.
 */
import "server-only";
import { connectToDatabase } from "@/lib/db";
import { StudyProgressModel } from "@/models/StudyProgress";
import { findNotebook } from "@/lib/study";
import { getNotebookPages } from "@/lib/study-pages";

/** How long a page waits on MongoDB for read-only progress before giving up. */
const PROGRESS_READ_TIMEOUT_MS = 3_000;

/** Page ids this user has marked studied in one notebook. */
export async function getStudiedPageIds(userId: string, slug: string): Promise<string[]> {
  await connectToDatabase();
  const doc = await StudyProgressModel.findOne({ userId, notebook: slug }).lean<{ completed: string[] }>();
  return doc?.completed ?? [];
}

/** Studied-page counts per notebook slug for this user, in one query. */
export async function getStudiedCounts(userId: string): Promise<Record<string, number>> {
  await connectToDatabase();
  const docs = await StudyProgressModel.find({ userId }).lean<{ notebook: string; completed: string[] }[]>();
  return Object.fromEntries(docs.map((doc) => [doc.notebook, doc.completed.length]));
}

/**
 * Runs a progress read but never lets it break (or stall) the page: the
 * notebooks themselves are static files, so if MongoDB is down or slow the
 * /study pages should still render, just without progress. Returns `null`
 * on error or after PROGRESS_READ_TIMEOUT_MS so callers can show a notice.
 */
async function orNullOnFailure<T>(read: () => Promise<T>): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), PROGRESS_READ_TIMEOUT_MS);
  });
  try {
    // The read keeps running if it loses the race; swallow its late rejection.
    const attempt = read().catch(() => null);
    return await Promise.race([attempt, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export const tryGetStudiedCounts = (userId: string) => orNullOnFailure(() => getStudiedCounts(userId));

export const tryGetStudiedPageIds = (userId: string, slug: string) =>
  orNullOnFailure(() => getStudiedPageIds(userId, slug));

/** MongoDB "duplicate key" error code — see the retry in `setPageStudied`. */
const DUPLICATE_KEY = 11000;

function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: number } | null)?.code === DUPLICATE_KEY;
}

/**
 * Marks one notebook page studied/not studied. Both the notebook and the
 * page id are checked against the real catalog/HTML first, so a made-up id
 * can't be stored; `$addToSet`/`$pull` keep concurrent toggles from
 * clobbering each other.
 *
 * The first toggle for a (user, notebook) pair is an upsert, and two of
 * those racing can both try to insert the row — the loser gets a duplicate-key
 * error from the unique index. By then the winner's row exists, so one retry
 * turns it into a plain update.
 */
export async function setPageStudied(
  userId: string,
  slug: string,
  pageId: string,
  studied: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!findNotebook(slug)) return { ok: false, error: "Notebook not found" };
  const pages = await getNotebookPages(slug);
  if (!pages.some((page) => page.id === pageId)) return { ok: false, error: "Page not found" };

  await connectToDatabase();
  const filter = { userId, notebook: slug };
  const update = studied ? { $addToSet: { completed: pageId } } : { $pull: { completed: pageId } };

  try {
    await StudyProgressModel.updateOne(filter, update, { upsert: true });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    await StudyProgressModel.updateOne(filter, update, { upsert: true });
  }
  return { ok: true };
}
