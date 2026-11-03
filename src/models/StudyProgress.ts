import mongoose, { Schema } from "mongoose";

/**
 * Mongoose model for one user's progress through one study notebook
 * (content/study/<notebook>.html — see src/lib/study.ts). `completed` holds the
 * ids of the notebook pages (the `<section class="sheet" id="…">` ids, see
 * src/lib/study-pages.ts) the user has marked as studied; an id is added or
 * removed atomically by `setPageStudied` in src/lib/services/study.ts.
 *
 * Per-user state, like `ProblemProgress` — the notebooks themselves are
 * shared, static content.
 */
const studyProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notebook: { type: String, required: true },
    completed: { type: [String], default: [] },
  },
  { timestamps: true },
);

// One progress row per (user, notebook).
studyProgressSchema.index({ userId: 1, notebook: 1 }, { unique: true });

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const StudyProgressModel =
  mongoose.models.StudyProgress ?? mongoose.model("StudyProgress", studyProgressSchema);
