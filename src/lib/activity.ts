// Writes to the DayActivity collection that powers the Activity graph and
// streaks. This is the only place `DayActivity.count` is ever mutated — it
// is increment-only (see recordActivity below), so callers never need to
// "undo" activity when a problem is unchecked.
import "server-only";
import { DayActivityModel } from "@/models/DayActivity";

/** Today's date key in the "YYYY-MM-DD" format used throughout (UTC, since `toISOString` is always UTC). */
export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Records one unit of activity (solved or revised) on the given day.
 * Never decremented — mirrors a commit graph, not a live counter, so
 * unchecking a problem later doesn't retroactively erase a day's activity.
 * Upserts because a day's DayActivity document may not exist yet.
 */
export async function recordActivity(dateKey: string): Promise<void> {
  await DayActivityModel.updateOne({ date: dateKey }, { $inc: { count: 1 } }, { upsert: true });
}
