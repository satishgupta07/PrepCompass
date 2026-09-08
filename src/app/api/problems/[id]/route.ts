/**
 * GET/PATCH/DELETE /api/problems/[id] — read, partially update, or delete a
 * single problem. GET is always open; PATCH and DELETE require API key auth
 * when `API_KEY` is configured (see `requireApiAuth`).
 */
import { NextResponse } from "next/server";
import { getProblemService, patchProblemService, deleteProblemService } from "@/lib/services/problems";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiRoute, parseJsonBody, serviceResultToResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// Next.js 16: dynamic route params are async, so `params` is a Promise even for a single `[id]` segment.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const { id } = await params;
    const result = await getProblemService(id);
    return serviceResultToResponse(result);
  });
}

/**
 * True partial update: per `patchProblemService`'s contract, a key omitted
 * from the JSON body leaves that field untouched, while an explicit `null`
 * clears it. This intentionally differs from the "edit panel" Server Action
 * (`updateProblemDetailsForm`), which always replaces every field.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const authError = requireApiAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const parsed = await parseJsonBody(request);
    if ("errorResponse" in parsed) return parsed.errorResponse;

    const result = await patchProblemService(id, parsed.body);
    return serviceResultToResponse(result);
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiRoute(async () => {
    const authError = requireApiAuth(request);
    if (authError) return authError;

    const { id } = await params;
    const result = await deleteProblemService(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({ ok: true });
  });
}
