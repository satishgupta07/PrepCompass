import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Mongoose model + DTO for one day's activity count, keyed by `date`
 * ("YYYY-MM-DD"). This is a separate collection from Pattern/Problem and
 * feeds the GitHub-style Activity graph and streak calculations
 * (src/lib/calendar.ts, src/lib/streak.ts).
 *
 * Populated as a side effect of solving or revising a problem
 * (src/lib/activity.ts's recordActivity), never edited directly by the
 * user. `count` is increment-only — mirroring a commit graph rather than a
 * live counter — so unchecking a "solved" problem later does not
 * retroactively erase that day's recorded activity.
 */

const dayActivitySchema = new Schema(
    {
        date: { type: String, required: true, unique: true }, // "YYYY-MM-DD"
        count: { type: Number, default: 0 },
    },
    { timestamps: true },
);

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const DayActivityModel =
    mongoose.models.DayActivity ?? mongoose.model("DayActivity", dayActivitySchema);

export type DayActivityDocument = InferSchemaType<typeof dayActivitySchema> & {
    _id: mongoose.Types.ObjectId;
};

/** Plain, JSON-serializable shape for passing a day's activity count across the Server → Client Component boundary. */
export type DayActivityDTO = {
    date: string;
    count: number;
};

export function toDayActivityDTO(doc: DayActivityDocument): DayActivityDTO {
    return { date: doc.date, count: doc.count };
}
