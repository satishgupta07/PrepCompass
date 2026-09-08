import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * Mongoose model + DTO for a "pattern" — one of the LeetCode technique
 * categories (Two Pointers, Sliding Window, ...) that problems are grouped
 * under. See CLAUDE.md's "Two collections, three concerns" for why every
 * model pairs a schema with a DTO type and a toXDTO() converter: Client
 * Components only ever receive the plain, JSON-serializable DTO, never a
 * Mongoose document (whose ObjectId/Date fields don't survive that
 * boundary as-is).
 */

const patternSchema = new Schema(
  {
    // Both `name` and `slug` are unique — `name` is the user-facing label,
    // `slug` (derived from it, see src/lib/slug.ts) is the stable key that
    // Problem.pattern references, so patterns can't collide under either.
    name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true },
    // Display order in the pattern list; new patterns are appended after
    // the current highest order (see createPatternService).
    order: { type: Number, required: true },
    referenceLink: { type: String, trim: true },
  },
  { timestamps: true },
);

// Reuse an existing compiled model in dev/HMR instead of recompiling it,
// which would otherwise throw "Cannot overwrite model once compiled".
export const PatternModel =
  mongoose.models.Pattern ?? mongoose.model("Pattern", patternSchema);

export type PatternDocument = InferSchemaType<typeof patternSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** Plain, JSON-serializable shape for passing a pattern across the Server → Client Component boundary. */
export type PatternDTO = {
  id: string;
  name: string;
  slug: string;
  order: number;
  referenceLink?: string;
};

export function toPatternDTO(doc: PatternDocument): PatternDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    order: doc.order,
    // Mongoose stores an unset optional string as undefined already, but
    // normalize explicitly in case a lean query ever returns null.
    referenceLink: doc.referenceLink ?? undefined,
  };
}
