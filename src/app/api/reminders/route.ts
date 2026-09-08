/**
 * GET /api/reminders — read-only list of problems due for spaced revision
 * today, most overdue first (see `getDueProblems` for the
 * `(lastRevisedDate ?? solvedAt) + 5 days` rule). No auth required: this is
 * a GET, and GETs are always open per the API's auth policy.
 */
import { NextResponse } from "next/server";
import { loadAppDataUncached } from "@/lib/load-data";
import { getDueProblems } from "@/lib/reminders";
import { todayDateKey } from "@/lib/activity";
import { handleApiRoute } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApiRoute(async () => {
    const { problems } = await loadAppDataUncached();
    const due = getDueProblems(problems, todayDateKey());
    return NextResponse.json(due);
  });
}
