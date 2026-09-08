/** App-wide footer: tagline plus an auto-updating copyright year. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted sm:flex-row">
        <span>PrepCompass — track your DSA patterns, one problem at a time.</span>
        <span>© {year}</span>
      </div>
    </footer>
  );
}
