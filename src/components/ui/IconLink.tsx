import type { ReactNode } from "react";

/**
 * Renders an icon (`children`, typically one of `src/components/ui/icons.tsx`)
 * as an external link. If `href` is missing (e.g. a problem has no LeetCode/
 * YouTube link set), renders the icon as a disabled-looking, non-interactive
 * placeholder instead of an anchor.
 */
export function IconLink({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: ReactNode;
}) {
  if (!href) {
    return (
      <span className="text-muted/40" aria-hidden="true">
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="text-muted transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}
