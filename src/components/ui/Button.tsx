import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

// Color/hover treatment per visual variant, layered on top of the shared
// base classes below. Uses palette tokens from globals.css, never raw hex.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  ghost: "bg-transparent text-muted hover:bg-surface-hover hover:text-foreground",
  danger: "bg-transparent text-hard hover:bg-hard/10",
};

/**
 * Standard app button. Wraps a native `<button>`, applying shared sizing/
 * spacing plus a color `variant` (default `"primary"`). All other native
 * button props (onClick, type, disabled, ...) pass through untouched, and
 * `className` is appended so callers can extend/override styling.
 */
export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
