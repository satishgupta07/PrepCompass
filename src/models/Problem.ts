import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import type { ProblemProgressDTO } from "@/models/ProblemProgress";

/**
 * Mongoose model + DTO for a single LeetCode problem. `pattern` stores the
 * owning Pattern's `slug` (not an ObjectId reference) — see
 * src/lib/services/patterns.ts for how a pattern delete is blocked while
 * problems still reference its slug.
 *
 * This is the shared catalog only (title, difficulty, reference links) —
 * admin-managed, the same for every user. Per-user state (`solved`,
 * `notes`, `lastRevisedDate`, `solvedAt`) lives in `ProblemProgress`
 * (src/models/ProblemProgress.ts) and gets merged back in by `toProblemDTO`
 * below, so `ProblemDTO` keeps the same shape every existing consumer
 * (grouping, stats, reminders, the UI) already expects.
 */

const problemSchema = new Schema(
  {
    // References Pattern.slug, not a Pattern ObjectId — see Pattern.ts.
    pattern: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    difficulty: { type: String, enum: [...DIFFICULTIES], required: true },
    leetcodeLink: { type: String, trim: true },
    githubLink: { type: String, trim: true },
    youtubeLink: { type: String, trim: true },
  },
  { timestamps: true },
);

// Text index so problem titles are searchable.
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
 * serializable across that boundary as-is. This is a merged view (catalog +
 * the current user's progress), not a 1:1 mirror of either schema.
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

/**
 * Merges a catalog `Problem` doc with the current user's (optional)
 * `ProblemProgress` DTO. `progress` is `null`/`undefined` when this user has
 * never interacted with the problem yet — in that case it defaults to
 * unsolved, no notes, no revision history, matching a freshly-added
 * problem's previous defaults.
 */
export function toProblemDTO(
  doc: ProblemDocument,
  progress?: ProblemProgressDTO | null,
): ProblemDTO {
  return {
    id: doc._id.toString(),
    pattern: doc.pattern,
    title: doc.title,
    difficulty: doc.difficulty as Difficulty,
    solved: progress?.solved ?? false,
    leetcodeLink: doc.leetcodeLink ?? undefined,
    githubLink: doc.githubLink ?? undefined,
    youtubeLink: doc.youtubeLink ?? undefined,
    notes: progress?.notes ?? "",
    lastRevisedDate: progress?.lastRevisedDate,
    solvedAt: progress?.solvedAt,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
