/**
 * Role/identity guards used at the top of the mutating Server Actions
 * (src/actions/patterns.ts, src/actions/problems.ts) — the UI-facing
 * counterpart to `src/lib/api-auth.ts`'s `requireApiAuth` for the REST API.
 * `proxy.ts` already keeps signed-out visitors off every page, so these
 * exist to enforce the admin/user split on top of that, and to hand back
 * the acting user's id for per-user writes.
 */
import "server-only";
import { auth } from "@/auth";

/** Returns the signed-in user's id, or an `ActionResult`-shaped error if there isn't one. */
export async function requireUserId(): Promise<{ userId: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };
  return { userId: session.user.id };
}

/**
 * Like `requireUserId`, but also hands back whether the caller is an admin
 * — for the rare action (`updateProblemDetails`) that needs both pieces of
 * the session and would otherwise call `auth()` twice.
 */
export async function requireSession(): Promise<
  { userId: string; isAdmin: boolean } | { error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not signed in" };
  return { userId: session.user.id, isAdmin: session.user.role === "admin" };
}

/** Returns `null` if the signed-in user is an admin, or an `ActionResult`-shaped error otherwise. */
export async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await auth();
  if (session?.user?.role !== "admin") return { error: "Admins only" };
  return null;
}
