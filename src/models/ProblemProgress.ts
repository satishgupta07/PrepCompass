import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Mongoose model for one user's progress against one catalog `Problem` —
 * `solved`, `notes`, `lastRevisedDate`, `solvedAt` used to live directly on
 * `Problem` until the tracker became multi-user; they live here now so the
 * same shared problem catalog can carry a different solved/notes state per
 * user. See `src/models/Problem.ts`'s `toProblemDTO` for how this gets
 * merged back into the `ProblemDTO` shape the UI already expects.
 *
 * `solvedAt`/`lastRevisedDate` semantics are unchanged from before the
 * split: `solvedAt` is set once, the moment `solved` first becomes true for
 * this user, and cleared only if they uncheck it; `lastRevisedDate` is
 * bumped every time they mark it revised.
 */

const problemProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
    solved: { type: Boolean, default: false },
    notes: { type: String, default: "", maxlength: 10_000 },
    lastRevisedDate: { type: Date },
    solvedAt: { type: Date },
  },
  { timestamps: true },
);

// One progress row per (user, problem); also serves as the lookup index for
// "this user's progress on this problem".
problemProgressSchema.index({ userId: 1, problem: 1 }, { unique: true });

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const ProblemProgressModel =
  mongoose.models.ProblemProgress ?? mongoose.model("ProblemProgress", problemProgressSchema);

export type ProblemProgressDocument = InferSchemaType<typeof problemProgressSchema> & {
  _id: mongoose.Types.ObjectId;
};

/**
 * Plain, JSON-serializable shape for one user's progress on one problem.
 * Only ever consumed by `toProblemDTO` (src/models/Problem.ts) to merge into
 * the combined catalog+progress `ProblemDTO` the UI expects — never passed
 * to a Client Component on its own.
 */
export type ProblemProgressDTO = {
  solved: boolean;
  notes: string;
  lastRevisedDate?: string;
  solvedAt?: string;
};

export function toProblemProgressDTO(doc: ProblemProgressDocument): ProblemProgressDTO {
  return {
    solved: doc.solved,
    notes: doc.notes,
    // Stored as UTC midnight Dates but surfaced as plain "YYYY-MM-DD" day
    // keys, consistent with DayActivity.date/reminders elsewhere.
    lastRevisedDate: doc.lastRevisedDate ? doc.lastRevisedDate.toISOString().slice(0, 10) : undefined,
    solvedAt: doc.solvedAt ? doc.solvedAt.toISOString().slice(0, 10) : undefined,
  };
}
