// App Router loading UI: shown automatically while the root page (or any
// route without its own loading.tsx) suspends on data. Purely a static
// skeleton — a title bar, a stats-bar placeholder, and 5 row placeholders
// mimicking the tracker page layout — no data or props involved.
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
      <div className="h-8 w-40 animate-pulse rounded-md bg-surface" />
      <div className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
