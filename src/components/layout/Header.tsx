import type { ReactNode } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/actions/auth";
import type { Role } from "@/models/User";
import { loadAppData } from "@/lib/load-data";
import { getDueProblems } from "@/lib/reminders";
import { todayDateKey } from "@/lib/activity";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthNavLinks } from "@/components/layout/AuthNavLinks";
import { Logo } from "@/components/layout/Logo";

/**
 * App-wide top nav: brand link plus Tracker/Reminders/Activity links. An
 * async Server Component — it loads problem data itself (via the cached
 * `loadAppData`, so this doesn't cost an extra DB round trip when a page
 * also calls it in the same request) to compute how many problems are due
 * for revision today, shown as a badge count on the Reminders link.
 *
 * Renders on every page (root layout), including the public /login and
 * /register pages — those have no session yet, so this checks `auth()`
 * first and renders a slim logged-out header instead of touching
 * `loadAppData` (which requires a session; see src/lib/load-data.ts).
 *
 * Sticky + a translucent/blurred background so content scrolls underneath
 * it rather than the nav disappearing.
 */
export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        {session?.user ? (
          <LoggedInNav name={session.user.name ?? session.user.email!} role={session.user.role} />
        ) : (
          <LoggedOutNav />
        )}
      </div>
    </header>
  );
}

/** Shared pill-style nav link — active/hover state via a background tint rather than an underline. */
function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      {children}
    </Link>
  );
}

async function LoggedInNav({ name, role }: { name: string; role: Role }) {
  const { problems } = await loadAppData();
  const dueCount = getDueProblems(problems, todayDateKey()).length;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <nav className="flex flex-wrap items-center gap-1">
      <NavLink href="/">Tracker</NavLink>
      <NavLink href="/reminders">
        <span className="flex items-center gap-1.5">
          Reminders
          {dueCount > 0 && (
            <span className="rounded-full bg-hard px-1.5 py-0.5 text-xs font-medium text-background">
              {dueCount}
            </span>
          )}
        </span>
      </NavLink>
      <NavLink href="/activity">Activity</NavLink>

      <span className="mx-2 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

      <span className="flex items-center gap-2 pl-1 pr-1 text-sm text-muted">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
          aria-hidden="true"
        >
          {initial}
        </span>
        <span className="hidden max-w-40 truncate font-medium text-foreground sm:inline">{name}</span>
        <span className="hidden rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted md:inline">
          {role}
        </span>
      </span>

      <form action={logoutAction}>
        <button
          type="submit"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Sign out
        </button>
      </form>

      <ThemeToggle />
    </nav>
  );
}

function LoggedOutNav() {
  return (
    <nav className="flex items-center gap-2">
      <ThemeToggle />
      <AuthNavLinks />
    </nav>
  );
}
