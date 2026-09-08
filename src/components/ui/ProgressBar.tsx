/**
 * Thin horizontal progress bar. `percent` is clamped to [0, 100] so callers
 * can pass slightly out-of-range values (e.g. from a solved/total ratio)
 * without producing an overflowing or negative-width fill.
 */
export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-border sm:w-36">
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
