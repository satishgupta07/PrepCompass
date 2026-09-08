// Small inline SVG icon set used across the app (dropdown affordances,
// external problem links, action buttons, ...). Each icon is a plain
// `viewBox="0 0 20 20"` glyph that accepts a `className` for sizing/color —
// color comes from `currentColor`/`fill="currentColor"` so icons inherit
// text color (and Tailwind tokens) from their parent rather than hardcoding
// any hex value.
type IconProps = { className?: string };

/** Downward chevron, used for dropdown/expand affordances. */
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "Opens in a new tab" glyph, paired with outbound links. */
export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M8 5H5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-3M12 4h4v4M15.5 4.5 9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Stylized "LC" bracket mark linking out to a problem's LeetCode page. */
export function LeetCodeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M13 4 7 10l6 6M4 10h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** GitHub "octocat" mark (filled path), used for repo/source links. */
export function GithubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 1.5a8.5 8.5 0 0 0-2.687 16.56c.425.08.581-.184.581-.409 0-.202-.008-.867-.011-1.572-2.365.514-2.865-1.005-2.865-1.005-.387-.984-.944-1.246-.944-1.246-.772-.528.058-.517.058-.517.854.06 1.304.877 1.304.877.759 1.3 1.992.925 2.478.707.076-.55.297-.925.54-1.138-1.888-.215-3.873-.944-3.873-4.204 0-.928.332-1.686.876-2.28-.088-.215-.38-1.079.083-2.249 0 0 .714-.229 2.34.874a8.13 8.13 0 0 1 4.257 0c1.625-1.103 2.338-.874 2.338-.874.464 1.17.172 2.034.084 2.249.545.594.875 1.352.875 2.28 0 3.268-1.989 3.987-3.883 4.197.305.263.577.78.577 1.573 0 1.136-.01 2.052-.01 2.331 0 .227.152.492.579.409A8.5 8.5 0 0 0 10 1.5Z"
      />
    </svg>
  );
}

/** Play-button-in-rectangle mark for linked video explanations. */
export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <rect x="2.5" y="5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 8v4l3.5-2-3.5-2Z" fill="currentColor" />
    </svg>
  );
}

/** Pencil glyph for "edit" actions. */
export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M13.5 3.5 16 6l-8.5 8.5L5 15l.5-2.5L13.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Trash can glyph for "delete" actions. */
export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M4.5 6h11M8 6V4.5h4V6M6 6l.6 9.4a1 1 0 0 0 1 .6h4.8a1 1 0 0 0 1-.6L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Plus glyph for "add new" actions. */
export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
