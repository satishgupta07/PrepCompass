/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanism, new file
 * name/export — see node_modules/next/dist/docs/.../proxy.md). Gates every
 * matched request through `authConfig`'s `authorized` callback: redirects
 * to `/login` unless the visitor has a session or is already headed to
 * `/login`/`/register`. Uses the edge-safe `auth.config` (no MongoDB/bcrypt
 * import) rather than `@/auth`, even though Proxy now defaults to the
 * Node.js runtime — no need to touch the DB just to check a JWT cookie.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js's build-time proxy/middleware validation statically parses this
// file's AST looking for a plain `export const proxy = ...`/`export
// function proxy` — a destructured `export const { auth: proxy } = ...`
// isn't recognized (the declarator's `id` is an ObjectPattern, not a bare
// identifier), so `auth` is pulled out on its own line first.
export default NextAuth(authConfig).auth;

// Excludes all of `/api/*`, not just `/api/auth` — those routes are the
// REST API, which has its own, separate auth story (`src/lib/api-auth.ts`'s
// `API_KEY` check on mutating requests, GET always open) documented in
// CLAUDE.md as a stable contract for non-browser callers (scripts, a
// browser extension). Gating them behind a session cookie here would
// redirect every such caller to `/login` before the route handler — and
// `requireApiAuth` — ever runs.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
