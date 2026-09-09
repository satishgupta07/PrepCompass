import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectToDatabase } from "@/lib/db";
import { UserModel, type UserDocument } from "@/models/User";

/**
 * A precomputed hash of a fixed, never-used password, compared against for
 * an unregistered email so `authorize()` pays the same bcrypt cost whether
 * or not the account exists — otherwise a nonexistent email returns
 * near-instantly while a real one always pays the full compare, letting an
 * attacker enumerate registered emails purely by response time.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("prep-compass-timing-safe-dummy", 10);

/**
 * The full Auth.js config, DB-backed — used by Server Actions, Server
 * Components, and `src/app/api/auth/[...nextauth]/route.ts`. `proxy.ts`
 * deliberately imports `@/auth.config` instead of this file, since that's
 * the subset safe to run on every matched request.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        await connectToDatabase();
        const user = await UserModel.findOne({ email }).lean<UserDocument | null>();

        // Always compare against a real bcrypt hash, even when there's no
        // user, so this takes the same time either way (see DUMMY_PASSWORD_HASH).
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
        if (!user || !valid) return null;

        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
