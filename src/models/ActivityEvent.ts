import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Append-only log of every "solved" or "revised" action a user takes, one
 * row per action. Unlike `ProblemProgress` (which only holds each problem's
 * *current* state) or `DayActivity` (which only holds a per-day count),
 * this is what lets the Activity page's day-detail view show everything
 * that happened on a given day — including a problem revised more than
 * once, or one later unsolved or removed from the catalog.
 *
 * `title`/`pattern` (the owning pattern's slug, resolved to a display name
 * at read time the same way `Problem.pattern` is elsewhere) are
 * snapshotted at write time rather than looked up live via `problem` — a
 * later rename or delete of the problem must never change or break a past
 * day's history. `problem` is kept as a reference anyway for a possible
 * future "jump to this problem" link, but nothing here depends on it still
 * resolving to a document.
 */

const activityEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    problem: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
    title: { type: String, required: true, trim: true },
    pattern: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    action: { type: String, enum: ["solved", "revised"], required: true },
  },
  { timestamps: true },
);

// Every day-detail lookup is "this user's events on this day".
activityEventSchema.index({ userId: 1, date: 1 });

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const ActivityEventModel =
  mongoose.models.ActivityEvent ?? mongoose.model("ActivityEvent", activityEventSchema);

export type ActivityEventDocument = InferSchemaType<typeof activityEventSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ActivityAction = "solved" | "revised";

/** Plain, JSON-serializable shape for passing an activity event across the Server → Client Component boundary. */
export type ActivityEventDTO = {
  id: string;
  problemId: string;
  title: string;
  pattern: string;
  date: string;
  action: ActivityAction;
};

export function toActivityEventDTO(doc: ActivityEventDocument): ActivityEventDTO {
  return {
    id: doc._id.toString(),
    problemId: doc.problem.toString(),
    title: doc.title,
    pattern: doc.pattern,
    date: doc.date,
    action: doc.action as ActivityAction,
  };
}
