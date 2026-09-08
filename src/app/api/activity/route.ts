/**
 * GET /api/activity — read-only feed for the GitHub-style Activity graph.
 *
 * Returns the raw per-day activity counts plus the derived current/longest
 * streak, so a caller doesn't need to reimplement the streak math itself.
 * No auth required: this is a GET, and GETs are always open per the API's
 * auth policy (see `src/lib/api-auth.ts`).
 */
import { NextResponse } from "next/server";
import { loadAppDataUncached } from "@/lib/load-data";
import { todayDateKey } from "@/lib/activity";
import { computeCurrentStreak, computeLongestStreak } from "@/lib/streak";
import { handleApiRoute } from "@/lib/api-response";

// Data depends on the MONGODB_URI env var at request time, so this route can't be statically rendered.
export const dynamic = "force-dynamic";

export async function GET() {
  return handleApiRoute(async () => {
    const { dayActivities } = await loadAppDataUncached();
    const todayKey = todayDateKey();
    // Streaks are computed over "active" dates only — days with at least one recorded activity.
    const activeDates = new Set(dayActivities.filter((day) => day.count > 0).map((day) => day.date));

    return NextResponse.json({
      dayActivities,
      currentStreak: computeCurrentStreak(activeDates, todayKey),
      longestStreak: computeLongestStreak(activeDates),
    });
  });
}
