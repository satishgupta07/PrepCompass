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
 * True partial update of the catalog's reference links only
 * (`leetcodeLink`/`githubLink`/`youtubeLink`) — per `patchProblemService`'s
 * contract, a key omitted from the JSON body leaves that field untouched,
 * while an explicit `null` clears it. `solved`/`notes`/`lastRevisedDate`
 * are no longer patchable here: they're per-user now (ProblemProgress) and
 * this REST surface has no session to scope them by; sending those keys
 * gets rejected with a 400 (the schema is `.strict()`). This intentionally
 * differs from the "edit panel" Server Action (`updateProblemDetailsForm`),
 * which always replaces every field it's given.
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
