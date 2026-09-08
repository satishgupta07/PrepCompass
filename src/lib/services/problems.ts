import "server-only";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ProblemModel, toProblemDTO, type ProblemDocument, type ProblemDTO } from "@/models/Problem";
import { PatternModel } from "@/models/Pattern";
import type { Difficulty } from "@/lib/difficulty";
import { ProblemCreateSchema, ProblemDetailsUpdateSchema } from "@/lib/validation";
import { isValidObjectId } from "@/lib/object-id";
import { recordActivity, todayDateKey } from "@/lib/activity";
import { serviceError, type ServiceResult } from "@/lib/api-response";

/**
 * DB logic shared by the Server Actions (src/actions/problems.ts, used by
 * the UI) and the REST API (src/app/api/problems/*). The one thing that
 * genuinely differs per surface is "update details" semantics: the UI's
 * edit panel always submits every field at once (full replace — an absent
 * link means "clear it"), while the API's PATCH supports true partial
 * updates (an absent key means "leave untouched", `null` means "clear").
 * Rather than force those into one shape, each gets its own function below.
 */

/**
 * Lists problems, optionally narrowed by pattern slug, difficulty, and/or
 * solved state. Each filter is applied only when explicitly provided —
 * `filters.solved` is checked against `undefined` (not falsiness) since
 * `false` is a meaningful filter value ("show unsolved only").
 */
export async function listProblemsService(filters: {
  pattern?: string;
  difficulty?: Difficulty;
  solved?: boolean;
}): Promise<ProblemDTO[]> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (filters.pattern) query.pattern = filters.pattern;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.solved !== undefined) query.solved = filters.solved;

  const docs = await ProblemModel.find(query).lean<ProblemDocument[]>();
  return docs.map(toProblemDTO);
}

/** Fetches a single problem by id. */
export async function getProblemService(id: string): Promise<ServiceResult<ProblemDTO>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const doc = await ProblemModel.findById(id).lean<ProblemDocument | null>();
  if (!doc) return serviceError("Problem not found", 404);

  return { ok: true, data: toProblemDTO(doc) };
}

/**
 * Creates a new problem. Validation: `pattern` and `title` are required,
 * `difficulty` must be one of the known enum values, and the optional link
 * fields must be well-formed URLs if present (see ProblemCreateSchema).
 * The referenced pattern must already exist (looked up by slug). New
 * problems always start unsolved with empty notes, regardless of what the
 * caller passes for those fields.
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

  const doc = await ProblemModel.create({ ...parsed.data, solved: false, notes: "" });
  return { ok: true, data: toProblemDTO(doc.toObject() as ProblemDocument) };
}

/**
 * Toggles the "solved" checkbox. Only acts (and only records activity) on
 * an actual state transition — toggling to the same value is a no-op —
 * because `solvedAt` must be set exactly once, the first time a problem
 * becomes solved, and never overwritten on subsequent no-op saves.
 * Unmarking as solved clears `solvedAt` entirely (see CLAUDE.md: it's
 * "never touched again after that", i.e. re-solving later sets a fresh
 * `solvedAt`, not the original one).
 */
export async function setProblemSolved(id: string, solved: boolean): Promise<ServiceResult<null>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const existing = await ProblemModel.findById(id).lean<{ solved: boolean } | null>();
  if (!existing) return serviceError("Problem not found", 404);

  if (solved && !existing.solved) {
    const todayKey = todayDateKey();
    await ProblemModel.updateOne(
      { _id: id },
      { $set: { solved: true, solvedAt: new Date(`${todayKey}T00:00:00.000Z`) } },
    );
    await recordActivity(todayKey);
  } else if (!solved && existing.solved) {
    await ProblemModel.updateOne({ _id: id }, { $set: { solved: false }, $unset: { solvedAt: "" } });
  }

  return { ok: true, data: null };
}

/**
 * Stamps `lastRevisedDate` with today's date and records today's activity —
 * used by the "mark revised" action on the Reminders page. Unlike
 * `setProblemSolved`, this always writes (there's no "already revised
 * today" short-circuit); calling it twice in one day just re-sets the same
 * date and increments today's activity count again.
 */
export async function markProblemRevisedToday(id: string): Promise<ServiceResult<null>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const exists = await ProblemModel.exists({ _id: id });
  if (!exists) return serviceError("Problem not found", 404);

  const todayKey = todayDateKey();
  await ProblemModel.updateOne(
    { _id: id },
    { $set: { lastRevisedDate: new Date(`${todayKey}T00:00:00.000Z`) } },
  );
  await recordActivity(todayKey);

  return { ok: true, data: null };
}

/** Deletes a problem by id. */
export async function deleteProblemService(id: string): Promise<ServiceResult<null>> {
  if (!isValidObjectId(id)) return serviceError("Invalid problem id", 400);

  await connectToDatabase();
  const result = await ProblemModel.deleteOne({ _id: id });
  if (result.deletedCount === 0) return serviceError("Problem not found", 404);

  return { ok: true, data: null };
}

/**
 * Full-replace update used by the UI's edit panel (ProblemEditPanel) —
 * every field is submitted every time the form is saved, so (unlike
 * `patchProblemService` below) there's no "omitted means untouched"
 * distinction: `notes` is always overwritten, and an empty/absent
 * `lastRevisedDate` or link field always clears that field rather than
 * leaving it as-is. Validation rules come from ProblemDetailsUpdateSchema
 * (max lengths, optional-URL checks on the link fields).
 *
 * Activity is only recorded when `lastRevisedDate` actually changes to a
 * new day — resaving the same date (e.g. editing notes without touching
 * the date) must not double-count that day's activity.
 */
export async function updateProblemDetailsForm(
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

  const existing = await ProblemModel.findById(id).lean<{ lastRevisedDate?: Date } | null>();
  if (!existing) return serviceError("Problem not found", 404);
  const existingDateKey = existing.lastRevisedDate?.toISOString().slice(0, 10);

  const setFields: Record<string, unknown> = { notes: parsed.data.notes };
  const unsetFields: Record<string, ""> = {};

  if (parsed.data.lastRevisedDate) {
    setFields.lastRevisedDate = new Date(`${parsed.data.lastRevisedDate}T00:00:00.000Z`);
  } else {
    unsetFields.lastRevisedDate = "";
  }

  // Full-replace semantics: a falsy (empty/absent) link field clears it.
  for (const key of ["leetcodeLink", "githubLink", "youtubeLink"] as const) {
    const value = parsed.data[key];
    if (value) setFields[key] = value;
    else unsetFields[key] = "";
  }

  await ProblemModel.updateOne(
    { _id: id },
    { $set: setFields, ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}) },
  );

  if (parsed.data.lastRevisedDate && parsed.data.lastRevisedDate !== existingDateKey) {
    await recordActivity(parsed.data.lastRevisedDate);
  }

  return { ok: true, data: null };
}

// `.strict()` rejects unknown keys outright (rather than silently ignoring
// them), so a typo'd field name in a PATCH request surfaces as a 400
// instead of a silent no-op. Every field is optional (`.optional()`) to
// support partial updates, and link fields/`lastRevisedDate` are additionally
// `.nullable()` so `null` can be sent to explicitly clear them.
const ApiProblemPatchSchema = z
  .object({
    solved: z.boolean().optional(),
    notes: z.string().max(10_000).optional(),
    lastRevisedDate: z.string().trim().min(1).nullable().optional(),
    leetcodeLink: z.string().trim().url().nullable().optional(),
    githubLink: z.string().trim().url().nullable().optional(),
    youtubeLink: z.string().trim().url().nullable().optional(),
  })
  .strict();

/**
 * Partial-update used by the REST API's PATCH /api/problems/[id]. Standard
 * PATCH semantics: an omitted key leaves that field untouched; an explicit
 * `null` clears it; a value sets it. `solved` reuses the same
 * solvedAt/activity bookkeeping as the checkbox toggle: it only fires
 * (and only records activity) when it's an actual transition, and setting
 * it to `false` clears `solvedAt` outright.
 *
 * Unlike the other service functions here, this one returns the full
 * updated DTO (not just `null`) so the API's PATCH response can echo back
 * the current state of the problem — including a short-circuit that
 * returns the existing document unchanged if the request had no effective
 * fields to apply, avoiding a needless write and re-fetch.
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

  if (input.notes !== undefined) setFields.notes = input.notes;

  // undefined = untouched, null = clear, string = set.
  if (input.lastRevisedDate !== undefined) {
    if (input.lastRevisedDate === null) unsetFields.lastRevisedDate = "";
    else setFields.lastRevisedDate = new Date(`${input.lastRevisedDate}T00:00:00.000Z`);
  }

  // Same undefined/null/value tri-state as lastRevisedDate, applied to all
  // three link fields.
  for (const key of ["leetcodeLink", "githubLink", "youtubeLink"] as const) {
    const value = input[key];
    if (value !== undefined) {
      if (value === null) unsetFields[key] = "";
      else setFields[key] = value;
    }
  }

  // Only treat `solved` as a write when it actually flips the current
  // value — resending the same value must not re-stamp solvedAt or record
  // activity again (mirrors setProblemSolved's transition-only behavior).
  let solvedChangedToTrue = false;
  if (input.solved !== undefined && input.solved !== existing.solved) {
    if (input.solved) {
      setFields.solved = true;
      setFields.solvedAt = new Date(`${todayDateKey()}T00:00:00.000Z`);
      solvedChangedToTrue = true;
    } else {
      setFields.solved = false;
      unsetFields.solvedAt = "";
    }
  }

  // Nothing to change (e.g. a PATCH with only already-matching values) —
  // skip the write and just echo back the current state.
  if (Object.keys(setFields).length === 0 && Object.keys(unsetFields).length === 0) {
    return { ok: true, data: toProblemDTO(existing) };
  }

  await ProblemModel.updateOne(
    { _id: id },
    { $set: setFields, ...(Object.keys(unsetFields).length ? { $unset: unsetFields } : {}) },
  );

  if (solvedChangedToTrue) await recordActivity(todayDateKey());

  // Record activity for the revision date itself only if it's actually a
  // new day for this problem, same rule as updateProblemDetailsForm.
  const existingDateKey = existing.lastRevisedDate?.toISOString().slice(0, 10);
  if (input.lastRevisedDate && input.lastRevisedDate !== existingDateKey) {
    await recordActivity(input.lastRevisedDate);
  }

  const updated = await ProblemModel.findById(id).lean<ProblemDocument>();
  return { ok: true, data: toProblemDTO(updated!) };
}
