/**
 * DELETE /api/patterns/[id] — deletes a single pattern by id.
 * Requires API key auth when `API_KEY` is configured (see `requireApiAuth`).
 */
import { NextResponse } from "next/server";
import { deletePatternService } from "@/lib/services/patterns";
import { requireApiAuth } from "@/lib/api-auth";
import { handleApiRoute } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// Next.js 16: dynamic route params are async, so `params` is a Promise even for a single `[id]` segment.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    return handleApiRoute(async () => {
        const authError = requireApiAuth(request);
        if (authError) return authError;

        const { id } = await params;
        const result = await deletePatternService(id);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

        return NextResponse.json({ ok: true });
    });
}
