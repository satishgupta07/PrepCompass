import mongoose from "mongoose";

/**
 * Thin wrapper around Mongoose's ObjectId check. Services validate route
 * params (e.g. a Problem/Pattern `id`) against this before querying, so a
 * malformed id returns a clean 400 instead of Mongoose throwing a cast
 * error deeper in the call stack. Kept as its own module so callers depend
 * on this lib rather than importing `mongoose` directly.
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}
