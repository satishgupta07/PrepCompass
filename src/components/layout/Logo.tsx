/**
 * Brand mark: a two-tone compass-needle glyph — playing on "Compass" in
 * the name, the way a mountain-peak glyph plays on "Master" in some other
 * trackers' logos — paired with a bold, two-tone "PrepCompass" wordmark.
 * Same "split the wordmark into two colors" idea, built from this app's
 * own `accent`/`easy` theme tokens (globals.css) rather than copying
 * another product's exact palette.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 20 20" className="h-6 w-6 shrink-0" aria-hidden="true">
        <circle cx="10" cy="10" r="8.25" className="stroke-border" strokeWidth="1.25" fill="none" />
        <path d="M10 3.25 13 10 10 10Z" className="fill-accent" />
        <path d="M10 16.75 7 10 10 10Z" className="fill-easy" />
      </svg>
      <span className="text-lg font-bold leading-none tracking-tight">
        <span className="text-accent">Prep</span>
        <span className="text-easy">Compass</span>
      </span>
    </span>
  );
}
