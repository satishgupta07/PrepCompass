import type { NextAuthConfig } from "next-auth";
// Type-only import — erased at compile time, so this doesn't pull the
// mongoose-importing module into the edge-safe proxy bundle.
import type { Role } from "@/models/User";

/**
 * The subset of the Auth.js config safe to evaluate on every matched
 * request (see `proxy.ts`) — no MongoDB/bcrypt import here, only cookie/JWT
 * shaping. `src/auth.ts` spreads this and adds the actual Credentials
 * provider (which does touch the DB) for use in Server Actions, Server
 * Components, and the `/api/auth/*` route handler.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Gates every request `proxy.ts` matches: unauthenticated visitors are
    // redirected to `pages.signIn` unless they're already headed to the
    // public register/login pages.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage = ["/login", "/register"].some((path) =>
        request.nextUrl.pathname.startsWith(path),
      );
      if (isPublicPage) return true;
      return isLoggedIn;
    },
    // Copies the id/role onto the JWT the first time it's minted (when
    // `user` — the object `authorize()` returned — is present, i.e. right
    // after sign-in); subsequent requests just carry the token forward.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    // Surfaces id/role/name on `session.user` so Server Components/Actions
    // can read `session.user.role` without a separate DB lookup.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name ?? null;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
