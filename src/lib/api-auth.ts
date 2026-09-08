/**
 * Auth guard for the REST API's mutating endpoints (`POST`/`PATCH`/`DELETE`
 * routes call `requireApiAuth`; `GET` is never gated).
 *
 * Optional lightweight gate: unlike Server Actions (whose action IDs are
 * encrypted and rotate on every deploy), routes under /api/* are a stable,
 * guessable public contract — anyone who finds the deployed URL can hit
 * them directly with curl. If API_KEY is set, mutating requests must
 * present it; if it's unset, the API is open (fine for local dev, not for
 * a shared deployment).
 */
import "server-only";
import { NextResponse } from "next/server";

/** Accepts the key via either `x-api-key` or an `Authorization: Bearer <key>` header. */
function isApiRequestAuthorized(request: Request): boolean {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) return true;

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const provided = request.headers.get("x-api-key") ?? bearer;
  return provided === requiredKey;
}

/** Returns a 401 response to short-circuit on, or `null` if the request is authorized. */
export function requireApiAuth(request: Request): Response | null {
  if (isApiRequestAuthorized(request)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
