/**
 * GET/POST /api/problems — list problems (optionally filtered by pattern
 * (string, e.g. its slug), difficulty, and solved status via query params),
 * or create a new one. GET is always open; POST requires API key auth when
 * `API_KEY` is configured (see `requireApiAuth`).
 */
import { NextResponse, type NextRequest } from "next/server";
import { listProblemsService, createProblemService } from "@/lib/services/problems";
import { DIFFICULTIES, type Difficulty } from "@/lib/difficulty";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiRoute, parseJsonBody, serviceResultToResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Narrows a raw `?difficulty=` query value to a known `Difficulty`, or rejects it. */
function isDifficulty(value: string | null): value is Difficulty {
  return value !== null && (DIFFICULTIES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  return handleApiRoute(async () => {
    const { searchParams } = request.nextUrl;
    const pattern = searchParams.get("pattern") ?? undefined;
    const difficultyParam = searchParams.get("difficulty");
    // An unrecognized ?difficulty= value is silently ignored (treated as "no filter") rather than erroring.
    const difficulty = isDifficulty(difficultyParam) ? difficultyParam : undefined;
    const solvedParam = searchParams.get("solved");
    // Absent means "no filter"; present means filter to exactly "true" (anything else is treated as false).
    const solved = solvedParam === null ? undefined : solvedParam === "true";

    const problems = await listProblemsService({ pattern, difficulty, solved });
    return NextResponse.json(problems);
  });
}

/** Body is the same shape `createProblemService` validates with Zod. */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    const authError = requireApiAuth(request);
    if (authError) return authError;

    const parsed = await parseJsonBody(request);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const result = await createProblemService(parsed.body);
    return serviceResultToResponse(result, 201);
  });
}
