/**
 * Server Actions backing the /login and /register pages. Unlike the other
 * `src/actions/*` files, there's no separate `src/lib/services/auth.ts` —
 * the validation + MongoDB work here is small enough, and entirely specific
 * to this one UI surface (there's no REST equivalent), to keep it in one
 * place rather than force the "shared service, two transports" split that
 * exists for patterns/problems.
 */
"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { RegisterSchema, LoginSchema } from "@/lib/validation";

export type ActionResult = { error?: string };

/**
 * `signIn` throws Next's internal `NEXT_REDIRECT` control-flow error on
 * success (it redirects to `redirectTo` itself) — that must propagate
 * un-caught. Only an actual `AuthError` (bad credentials) becomes a
 * user-facing message.
 */
async function signInWithCredentials(email: string, password: string): Promise<ActionResult> {
  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
  return {};
}

/**
 * Creates a new account (always `role: "user"` — see CLAUDE.md/plan: admin
 * is a manual promotion, never self-service) and signs the caller straight
 * in.
 */
export async function registerAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  await connectToDatabase();

  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await UserModel.create({ name, email, passwordHash, role: "user" });
  } catch (error) {
    // The findOne check above is best-effort — two concurrent registrations
    // for the same email can both pass it before either commits, so the
    // unique index on `email` is the real guard. Translate its duplicate-key
    // error into the same user-facing message instead of letting it surface
    // as an unhandled 500.
    if ((error as { code?: number }).code === 11000) {
      return { error: "An account with this email already exists" };
    }
    throw error;
  }

  return signInWithCredentials(email, password);
}

/** Signs an existing user in. */
export async function loginAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  return signInWithCredentials(parsed.data.email, parsed.data.password);
}

/** Ends the session and sends the browser back to /login. */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
