import type { DefaultSession } from "next-auth";
import type { Role } from "@/models/User";

/**
 * Augments Auth.js's built-in types with the `id`/`role` fields our
 * `jwt`/`session` callbacks (src/auth.config.ts) add on top of the default
 * shape.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
