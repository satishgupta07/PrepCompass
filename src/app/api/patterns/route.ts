/**
 * GET/POST /api/patterns — list all patterns, or create a new one.
 * GET is always open; POST requires API key auth when `API_KEY` is configured
 * (see `requireApiAuth`).
 */
import { NextResponse } from "next/server";
import { listPatterns, createPatternService } from "@/lib/services/patterns";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiRoute, parseJsonBody, serviceResultToResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
    return handleApiRoute(async () => {
        const patterns = await listPatterns();
        return NextResponse.json(patterns);
    });
}

/** Body is the same shape `createPatternService` validates with Zod: `{ name, referenceLink }`. */
export async function POST(request: Request) {
    return handleApiRoute(async () => {
        const authError = requireApiAuth(request);
        if (authError) return authError;

        const parsed = await parseJsonBody(request);
        if ("errorResponse" in parsed) return parsed.errorResponse;

        const result = await createPatternService(parsed.body);
        return serviceResultToResponse(result, 201);
    });
}
