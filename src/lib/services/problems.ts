import "server-only";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ProblemModel, toProblemDTO, type ProblemDocument, type ProblemDTO } from "@/models/Problem";
import { ProblemProgressModel } from "@/models/ProblemProgress";
import { PatternModel } from "@/models/Pattern";
import type { Difficulty } from "@/lib/difficulty";
import { ProblemCreateSchema, ProblemDetailsUpdateSchema } from "@/lib/validation";
import { isValidObjectId } from "@/lib/object-id";
import { recordActivity, todayDateKey } from "@/lib/activity";
import { serviceError, type ServiceResult } from "@/lib/api-response";

/**
 * DB logic shared by the Server Actions (src/actions/problems.ts, used by
 * the UI) and the REST API (src/app/api/problems/*), with one structural
 * split since the tracker went multi-user: `solved`/`notes`/
 * `lastRevisedDate`/`solvedAt` now live per-user in `ProblemProgress`, not
 * on `Problem` itself (see src/models/ProblemProgress.ts). The REST API has
 * no session/user concept, so its functions (`listProblemsService`,
 * `getProblemService`, `createProblemService`, `patchProblemService`,
 * `deleteProblemService`) only ever touch the shared catalog and return
 * `toProblemDTO(doc, null)` (progress-less) DTOs. The UI-only functions
 * (`setProblemSolved`, `markProblemRevisedToday`, `updateProblemDetailsForm`)
 * take a `userId` and read/write that user's `ProblemProgress` row.
 *
 * The other thing that genuinely differs per surface is "update details"
 * semantics: the UI's edit panel always submits every field at once
 * (full-replace — an absent link means "clear it"), while the API's PATCH
 * supports true partial updates (an absent key means "leave untouched",
 * `null` means "clear"). Rather than force those into one shape, each gets
 * its own function below.
 */

/**
 * Lists catalog problems for the REST API, optionally narrowed by pattern
 * slug and/or difficulty. There's no per-user `solved` filter here anymore
 * — the REST API has no session, so "solved" has no meaning without a user
 * to ask "solved by whom?" (the UI gets its own, per-user list from
 * `src/lib/load-data.ts`, which merges in `ProblemProgress` directly).
 */
export async function listProblemsService(filters: {
  pattern?: string;
  difficulty?: Difficulty;
}): Promise<ProblemDTO[]> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filters.pattern) query.pattern = filters.pattern;
  if (filters.difficulty) query.difficulty = filters.difficulty;

  const docs = await ProblemModel.find(query).lean<ProblemDocument[]>();
  return docs.map((doc) => toProblemDTO(doc, null));
}

/** Fetches a single catalog problem by id (REST only — see module docstring). */
export async function getProblemService(id: string): Promise<ServiceResult<ProblemDTO>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const doc = await ProblemModel.findById(id).lean<ProblemDocument | null>();
  if (!doc) return serviceError("Problem not found", 404);

  return { ok: true, data: toProblemDTO(doc, null) };
}

/**
 * Creates a new catalog problem (admin-only — gated by `requireAdmin()` in
 * the Server Action; the REST route stays gated by `API_KEY` only, no
 * session concept). Validation: `pattern` and `title` are required,
 * `difficulty` must be one of the known enum values, and the optional link
 * fields must be well-formed URLs if present (see ProblemCreateSchema).
 * The referenced pattern must already exist (looked up by slug).
 */
export async function createProblemService(input: unknown): Promise<ServiceResult<ProblemDTO>> {
  const parsed = ProblemCreateSchema.safeParse(input);
  if (!parsed.success) {
    return serviceError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  await connectToDatabase();

  const patternExists = await PatternModel.exists({ slug: parsed.data.pattern });
  if (!patternExists) {
    return serviceError("Unknown pattern", 404);
  }

  const doc = await ProblemModel.create(parsed.data);
  return { ok: true, data: toProblemDTO(doc.toObject() as ProblemDocument, null) };
}

/**
 * Toggles the "solved" checkbox for `userId`. Only acts (and only records
 * activity) on an actual state transition — toggling to the same value is
 * a no-op — because `solvedAt` must be set exactly once, the first time a
 * problem becomes solved for this user, and never overwritten on
 * subsequent no-op saves. Unmarking as solved clears `solvedAt` entirely
 * (re-solving later sets a fresh `solvedAt`, not the original one).
 */
export async function setProblemSolved(
  userId: string,
  problemId: string,
  solved: boolean,
): Promise<ServiceResult<null>> {
  if (!isValidObjectId(problemId)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const problemDoc = await ProblemModel.findOne({ _id: problemId }, { title: 1, pattern: 1 }).lean<{
    title: string;
    pattern: string;
  } | null>();
  if (!problemDoc) return serviceError("Problem not found", 404);

  const existing = await ProblemProgressModel.findOne({ userId, problem: problemId }).lean<{
    solved: boolean;
  } | null>();
  const wasSolved = existing?.solved ?? false;

  if (solved && !wasSolved) {
    const todayKey = todayDateKey();
    await ProblemProgressModel.updateOne(
      { userId, problem: problemId },
      { $set: { solved: true, solvedAt: new Date(`${todayKey}T00:00:00.000Z`) } },
      { upsert: true },
    );
    await recordActivity(userId, todayKey, {
      problemId,
      title: problemDoc.title,
      pattern: problemDoc.pattern,
      action: "solved",
    });
  } else if (!solved && wasSolved) {
    await ProblemProgressModel.updateOne(
      { userId, problem: problemId },
      { $set: { solved: false }, $unset: { solvedAt: "" } },
    );
  }

  return { ok: true, data: null };
}

/**
 * Stamps `userId`'s `lastRevisedDate` with today's date and records
 * today's activity — used by the "mark revised" action on the Reminders
 * page. Unlike `setProblemSolved`, this always writes (there's no "already
 * revised today" short-circuit); calling it twice in one day just re-sets
 * the same date and increments today's activity count again.
 */
export async function markProblemRevisedToday(
  userId: string,
  problemId: string,
): Promise<ServiceResult<null>> {
  if (!isValidObjectId(problemId)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const problemDoc = await ProblemModel.findOne({ _id: problemId }, { title: 1, pattern: 1 }).lean<{
    title: string;
    pattern: string;
  } | null>();
  if (!problemDoc) return serviceError("Problem not found", 404);

  const todayKey = todayDateKey();
  await ProblemProgressModel.updateOne(
    { userId, problem: problemId },
    { $set: { lastRevisedDate: new Date(`${todayKey}T00:00:00.000Z`) } },
    { upsert: true },
  );
  await recordActivity(userId, todayKey, {
    problemId,
    title: problemDoc.title,
    pattern: problemDoc.pattern,
    action: "revised",
  });

  return { ok: true, data: null };
}

/**
 * Deletes a catalog problem by id (admin-only, same gating as create), and
 * cascades the delete to every user's `ProblemProgress` row for it so
 * orphaned progress documents don't accumulate.
 */
export async function deleteProblemService(id: string): Promise<ServiceResult<null>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const result = await ProblemModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) return serviceError("Problem not found", 404);

  await ProblemProgressModel.deleteMany({ problem: id });
  return { ok: true, data: null };
}

/**
 * Full-replace update used by the UI's edit panel (ProblemEditPanel) —
 * every field is submitted every time the form is saved. Two different
 * destinations per field, split by who's allowed to touch what:
 *
 * - `notes`/`lastRevisedDate` always write to `userId`'s own
 *   `ProblemProgress` row (full-replace: an empty/absent `lastRevisedDate`
 *   always clears it, matching the pre-multi-user behavior). Activity is
 *   only recorded when `lastRevisedDate` actually changes to a new day.
 * - `leetcodeLink`/`githubLink`/`youtubeLink` are shared catalog metadata,
 *   not personal progress — they're only written when `isAdmin` is true,
 *   and are otherwise ignored entirely (not even "leave unchanged" vs
 *   "clear" logic runs for a non-admin submission, since the edit panel
 *   doesn't render those fields for a non-admin in the first place).
 */
export async function updateProblemDetailsForm(
  userId: string,
  isAdmin: boolean,
  id: unknown,
  input: unknown,
): Promise<ServiceResult<null>> {
  if (typeof id !== "string" || !isValidObjectId(id)) {
    return serviceError("Invalid problem id", 400);
  }

  const parsed = ProblemDetailsUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return serviceError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  await connectToDatabase();

  const problemDoc = await ProblemModel.findOne({ _id: id }, { title: 1, pattern: 1 }).lean<{
    title: string;
    pattern: string;
  } | null>();
  if (!problemDoc) return serviceError("Problem not found", 404);

  if (isAdmin) {
    const catalogSet: Record<string, unknown> = {};
    const catalogUnset: Record<string, ""> = {};
    for (const key of ["leetcodeLink", "githubLink", "youtubeLink"] as const) {
      const value = parsed.data[key];
      if (value) catalogSet[key] = value;
      else catalogUnset[key] = "";
    }
    await ProblemModel.updateOne(
      { _id: id },
      { $set: catalogSet, ...(Object.keys(catalogUnset).length ? { $unset: catalogUnset } : {}) },
    );
  }

  const existingProgress = await ProblemProgressModel.findOne({ userId, problem: id }).lean<{
    lastRevisedDate?: Date;
  } | null>();
  const existingDateKey = existingProgress?.lastRevisedDate?.toISOString().slice(0, 10);

  const progressSet: Record<string, unknown> = { notes: parsed.data.notes };
  const progressUnset: Record<string, ""> = {};
  if (parsed.data.lastRevisedDate) {
    progressSet.lastRevisedDate = new Date(`${parsed.data.lastRevisedDate}T00:00:00.000Z`);
  } else {
    progressUnset.lastRevisedDate = "";
  }

  await ProblemProgressModel.updateOne(
    { userId, problem: id },
    { $set: progressSet, ...(Object.keys(progressUnset).length ? { $unset: progressUnset } : {}) },
    { upsert: true },
  );

  if (parsed.data.lastRevisedDate && parsed.data.lastRevisedDate !== existingDateKey) {
    await recordActivity(userId, parsed.data.lastRevisedDate, {
      problemId: id,
      title: problemDoc.title,
      pattern: problemDoc.pattern,
      action: "revised",
    });
  }

  return { ok: true, data: null };
}

// `.strict()` rejects unknown keys outright (rather than silently ignoring
// them), so a typo'd field name — or, post-multi-user, a `solved`/`notes`/
// `lastRevisedDate` key a caller hasn't updated for — surfaces as a 400
// instead of a silent no-op. Only the catalog link fields are patchable
// through the REST API now; per-user progress has no REST surface (no
// session concept to scope it by).
const ApiProblemPatchSchema = z
  .object({
    leetcodeLink: z.string().trim().url().nullable().optional(),
    githubLink: z.string().trim().url().nullable().optional(),
    youtubeLink: z.string().trim().url().nullable().optional(),
  })
  .strict();

/**
 * Partial-update used by the REST API's PATCH /api/problems/[id]. Standard
 * PATCH semantics: an omitted key leaves that field untouched, an explicit
 * `null` clears it, a value sets it — for the three catalog link fields
 * only.
 */
export async function patchProblemService(id: string, rawInput: unknown): Promise<ServiceResult<ProblemDTO>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  const parsed = ApiProblemPatchSchema.safeParse(rawInput);
  if (!parsed.success) {
    return serviceError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  await connectToDatabase();
  const existing = await ProblemModel.findById(id).lean<ProblemDocument | null>();
  if (!existing) return serviceError("Problem not found", 404);

  const input = parsed.data;
  const setFields: Record<string, unknown> = {};
  const unsetFields: Record<string, ""> = {};

  // undefined = untouched, null = clear, string = set.
  for (const key of ["leetcodeLink", "githubLink", "youtubeLink"] as const) {
    const value = input[key];
    if (value !== undefined) {
      if (value === null) unsetFields[key] = "";
      else setFields[key] = value;
    }
  }

  // Nothing to change (e.g. a PATCH with only already-matching values) —
  // skip the write and just echo back the current state.
  if (Object.keys(setFields).length === 0 && Object.keys(unsetFields).length === 0) {
    return { ok: true, data: toProblemDTO(existing, null) };
  }

  await ProblemModel.updateOne(
    { _id: id },
    { $set: setFields, ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}) },
  );

  const updated = await ProblemModel.findById(id).lean<ProblemDocument>();
  return { ok: true, data: toProblemDTO(updated!, null) };
}
