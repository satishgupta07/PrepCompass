import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";

/**
 * Mongoose model + DTO for a single LeetCode problem. `pattern` stores the
 * owning Pattern's `slug` (not an ObjectId reference) — see
 * src/lib/services/patterns.ts for how a pattern delete is blocked while
 * problems still reference its slug.
 *
 * `solvedAt` and `lastRevisedDate` drive the spaced-revision feature (see
 * CLAUDE.md's "Spaced revision and streaks"): `solvedAt` is set once, the
 * first time `solved` flips to true, and only cleared if unchecked;
 * `lastRevisedDate` is bumped every time the problem is marked revised.
 * `src/lib/reminders.ts` computes what's due from
 * `(lastRevisedDate ?? solvedAt) + 5 days`.
 */

const problemSchema = new Schema(
  {
    // References Pattern.slug, not a Pattern ObjectId — see Pattern.ts.
    pattern: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    difficulty: { type: String, enum: [...DIFFICULTIES], required: true },
    solved: { type: Boolean, default: false, index: true },
    leetcodeLink: { type: String, trim: true },
    githubLink: { type: String, trim: true },
    youtubeLink: { type: String, trim: true },
    notes: { type: String, default: "", maxlength: 10_000 },
    // Last time the user marked this problem "revised"; drives the 5-day
    // spaced-revision reminder alongside solvedAt.
    lastRevisedDate: { type: Date },
    // Set once, the moment `solved` first becomes true; never touched again
    // after that (cleared only if the problem is unmarked as solved).
    solvedAt: { type: Date },
  },
  { timestamps: true },
);

// Compound index for the tracker page's per-pattern/solved-state filtering,
// plus a text index so problem titles are searchable.
problemSchema.index({ pattern: 1, solved: 1 });
problemSchema.index({ title: "text" });

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const ProblemModel =
  mongoose.models.Problem ?? mongoose.model("Problem", problemSchema);

export type ProblemDocument = InferSchemaType<typeof problemSchema> & {
  _id: mongoose.Types.ObjectId;
};

/**
 * Plain, JSON-serializable shape for passing problems from Server Components
 * to Client Components — a Mongoose document's ObjectId/Date fields aren't
 * serializable across that boundary as-is.
 */
export type ProblemDTO = {
  id: string;
  pattern: string;
  title: string;
  difficulty: Difficulty;
  solved: boolean;
  leetcodeLink?: string;
  githubLink?: string;
  youtubeLink?: string;
  notes: string;
  lastRevisedDate?: string;
  solvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export function toProblemDTO(doc: ProblemDocument): ProblemDTO {
  return {
    id: doc._id.toString(),
    pattern: doc.pattern,
    title: doc.title,
    difficulty: doc.difficulty as Difficulty,
    solved: doc.solved ?? false,
    leetcodeLink: doc.leetcodeLink ?? undefined,
    githubLink: doc.githubLink ?? undefined,
    youtubeLink: doc.youtubeLink ?? undefined,
    notes: doc.notes ?? "",
    // Date fields are stored as UTC midnight Dates but surfaced as plain
    // "YYYY-MM-DD" day keys — the UI only ever cares about the day, not a
    // time-of-day, and this keeps the DTO's date fields consistent with the
    // "YYYY-MM-DD" keys used elsewhere (DayActivity.date, reminders, etc).
    lastRevisedDate: doc.lastRevisedDate
      ? doc.lastRevisedDate.toISOString().slice(0, 10)
      : undefined,
    solvedAt: doc.solvedAt ? doc.solvedAt.toISOString().slice(0, 10) : undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
