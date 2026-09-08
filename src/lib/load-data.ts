/**
 * Single entry point for loading the app's full dataset (patterns +
 * problems + day activities). Exposes a cached variant for Server
 * Components and an uncached variant for Route Handlers — see the
 * per-export comments below for why the two must not be swapped.
 */
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import { PatternModel, toPatternDTO, type PatternDocument, type PatternDTO } from "@/models/Pattern";
import { ProblemModel, toProblemDTO, type ProblemDocument, type ProblemDTO } from "@/models/Problem";
import {
  DayActivityModel,
  toDayActivityDTO,
  type DayActivityDocument,
  type DayActivityDTO,
} from "@/models/DayActivity";
import mockData from "../lib/mock-data.json"

export type AppData = {
  patterns: PatternDTO[];
  problems: ProblemDTO[];
  dayActivities: DayActivityDTO[];
  isMock: boolean;
};

/**
 * Until MONGODB_URI is configured, falls back to the bundled mock fixture so
 * the UI can be previewed end-to-end.
 */
async function fetchAppData(): Promise<AppData> {
  if (!process.env.MONGODB_URI) {
    return {
      patterns: mockData.patterns as PatternDTO[],
      problems: mockData.problems as ProblemDTO[],
      dayActivities: (mockData.dayActivities ?? []) as DayActivityDTO[],
      isMock: true,
    };
  }

  await connectToDatabase();
  // The three collections are independent, so fetch them concurrently rather than sequentially.
  // Patterns are ordered by their curated `order` field (drives display order in the UI);
  // problems/activities have no inherent order requirement at this layer.
  const [patternDocs, problemDocs, activityDocs] = await Promise.all([
    PatternModel.find().sort({ order: 1 }).lean<PatternDocument[]>(),
    ProblemModel.find().lean<ProblemDocument[]>(),
    DayActivityModel.find().lean<DayActivityDocument[]>(),
  ]);

  return {
    patterns: patternDocs.map(toPatternDTO),
    problems: problemDocs.map(toProblemDTO),
    dayActivities: activityDocs.map(toDayActivityDTO),
    isMock: false,
  };
}

/**
 * For Server Components only (pages, the root layout's Header). Wrapped in
 * React's `cache()` so multiple call sites within the same render (e.g. the
 * layout's Header and the page itself) share one DB round-trip.
 */
export const loadAppData = cache(fetchAppData);

/**
 * For Route Handlers. `cache()`'s per-request dedup is tied to the React
 * Server Component render lifecycle — a plain Route Handler isn't part of
 * that render, so reusing the cached wrapper there risks a stale value
 * leaking across unrelated requests. Route Handlers call this directly.
 */
export const loadAppDataUncached = fetchAppData;
