/**
 * Single entry point for loading the app's full dataset (patterns +
 * problems + day activities) for the *current signed-in user*. Patterns and
 * the problem catalog are shared; `problems[].solved/notes/lastRevisedDate/
 * solvedAt` and `dayActivities` are merged in / filtered for that one user
 * (see src/models/ProblemProgress.ts, src/models/DayActivity.ts).
 */
import { cache } from "react";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { PatternModel, toPatternDTO, type PatternDocument, type PatternDTO } from "@/models/Pattern";
import { ProblemModel, toProblemDTO, type ProblemDocument, type ProblemDTO } from "@/models/Problem";
import {
  ProblemProgressModel,
  toProblemProgressDTO,
  type ProblemProgressDocument,
} from "@/models/ProblemProgress";
import {
  DayActivityModel,
  toDayActivityDTO,
  type DayActivityDocument,
  type DayActivityDTO,
} from "@/models/DayActivity";
import {
  ActivityEventModel,
  toActivityEventDTO,
  type ActivityEventDocument,
  type ActivityEventDTO,
} from "@/models/ActivityEvent";

export type AppData = {
  patterns: PatternDTO[];
  problems: ProblemDTO[];
  dayActivities: DayActivityDTO[];
  activityEvents: ActivityEventDTO[];
};

async function fetchAppData(userId: string): Promise<AppData> {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await connectToDatabase();
  // Patterns/problems are the shared catalog; progress/activity are scoped
  // to `userId`. All four are independent reads, so fetch concurrently.
  const [patternDocs, problemDocs, progressDocs, activityDocs, activityEventDocs] = await Promise.all([
    PatternModel.find().sort({ order: 1 }).lean<PatternDocument[]>(),
    ProblemModel.find().lean<ProblemDocument[]>(),
    ProblemProgressModel.find({ userId }).lean<ProblemProgressDocument[]>(),
    DayActivityModel.find({ userId }).lean<DayActivityDocument[]>(),
    ActivityEventModel.find({ userId }).sort({ createdAt: 1 }).lean<ActivityEventDocument[]>(),
  ]);

  const progressByProblemId = new Map(
    progressDocs.map((p) => [p.problem.toString(), toProblemProgressDTO(p)]),
  );

  return {
    patterns: patternDocs.map(toPatternDTO),
    problems: problemDocs.map((doc) => toProblemDTO(doc, progressByProblemId.get(doc._id.toString()))),
    dayActivities: activityDocs.map(toDayActivityDTO),
    activityEvents: activityEventDocs.map(toActivityEventDTO),
  };
}

/**
 * For Server Components (pages, the root layout's Header). Wrapped in
 * React's `cache()` so multiple call sites within the same render (e.g. the
 * layout's Header and the page itself) share one DB round-trip. Resolves
 * the current session itself via `auth()` so every call site keeps calling
 * `loadAppData()` with no arguments — `proxy.ts` already keeps signed-out
 * visitors off every page that calls this, so a missing session here means
 * something is calling it from a route `proxy.ts` doesn't cover.
 */
export const loadAppData = cache(async (): Promise<AppData> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("loadAppData called without a signed-in session");
  }
  return fetchAppData(session.user.id);
});
