"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PRIMARY_CLASSES =
  "rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90";
const SECONDARY_CLASSES =
  "rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground";

/**
 * Register/Sign-in links for the logged-out header. A Client Component
 * (needs `usePathname()`, unlike the rest of the server-rendered `Header`)
 * so whichever page you're actually on gets the primary (accent pill)
 * treatment and the other one falls back to the plain secondary style —
 * rather than "Sign in" always looking primary regardless of where you are.
 */
export function AuthNavLinks() {
  const pathname = usePathname();
  const isRegisterActive = pathname === "/register";
  const isLoginActive = pathname === "/login";

  return (
    <>
      <Link href="/register" className={isRegisterActive ? PRIMARY_CLASSES : SECONDARY_CLASSES}>
        Register
      </Link>
      <Link href="/login" className={isLoginActive ? PRIMARY_CLASSES : SECONDARY_CLASSES}>
        Sign in
      </Link>
    </>
  );
}
