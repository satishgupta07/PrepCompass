// Writes to the DayActivity and ActivityEvent collections that power the
// Activity graph, streaks, and the day-detail view. This is the only place
// either is ever written — `DayActivity.count` is increment-only and
// `ActivityEvent` rows are never edited or deleted, so callers never need
// to "undo" activity when a problem is unchecked.
import "server-only";
import { DayActivityModel } from "@/models/DayActivity";
import { ActivityEventModel, type ActivityAction } from "@/models/ActivityEvent";

/** Today's date key in the "YYYY-MM-DD" format used throughout (UTC, since `toISOString` is always UTC). */
export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Records one solve/revise action for `userId` on the given day: bumps that
 * day's `DayActivity.count` (never decremented — mirrors a commit graph,
 * not a live counter, so unchecking a problem later doesn't retroactively
 * erase a day's activity) and appends an immutable `ActivityEvent` row so
 * the Activity page's day-detail view can list every individual action,
 * not just the day's total.
 */
export async function recordActivity(
  userId: string,
  dateKey: string,
  event: { problemId: string; title: string; pattern: string; action: ActivityAction },
): Promise<void> {
  await Promise.all([
    DayActivityModel.updateOne({ userId, date: dateKey }, { $inc: { count: 1 } }, { upsert: true }),
    ActivityEventModel.create({
      userId,
      problem: event.problemId,
      title: event.title,
      pattern: event.pattern,
      date: dateKey,
      action: event.action,
    }),
  ]);
}
