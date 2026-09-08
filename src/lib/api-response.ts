/**
 * Shared helpers for turning a service-layer result into a REST response.
 * Server Actions consume `ServiceResult` directly (they don't need HTTP
 * status codes), while `src/app/api/**` routes go through
 * `serviceResultToResponse` so every endpoint reports errors the same way.
 */
import { NextResponse } from "next/server";

/** Discriminated union every service function (patterns.ts, problems.ts) returns instead of throwing on expected failures (validation, not-found, etc.). */
export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

/** Convenience constructor for the failure branch of `ServiceResult`. */
export function serviceError(error: string, status: number): { ok: false; error: string; status: number } {
  return { ok: false, error, status };
}

/** Converts a `ServiceResult` into the `NextResponse` an API route handler returns. */
export function serviceResultToResponse<T>(result: ServiceResult<T>, successStatus = 200): Response {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data, { status: successStatus });
}

/** Parses a JSON request body, returning a 400 response to short-circuit on if it isn't valid JSON. */
export async function parseJsonBody(request: Request): Promise<{ body: unknown } | { errorResponse: Response }> {
  const body = await request.json().catch(() => null);
  if (body === null) {
    return { errorResponse: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }
  return { body };
}

/** Wraps a route handler so an unexpected throw (e.g. MONGODB_URI missing) becomes a clean JSON 500 instead of an unhandled error page. */
export async function handleApiRoute(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
