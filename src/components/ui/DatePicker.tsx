"use client";

import { useEffect, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/field-classes";
import { CalendarIcon } from "@/components/ui/icons";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function toDateKey(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sun-Sat week rows for `month` (0-11) of `year`, padded with `null` outside the month so every row has 7 cells. */
function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatDisplayDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00.000Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Hand-rolled calendar dropdown for picking a "YYYY-MM-DD" date — used for
 * the edit panel's "last revised date" instead of the browser's native
 * `<input type="date">`, whose picker UI can't be restyled to match the
 * app's theme (and looks different per browser/OS). Behaves like a normal
 * form field: a hidden input carries `name`'s value, so the rest of the
 * form/Server Action pipeline (FormData → `updateProblemDetailsForm`)
 * doesn't need to know this isn't a native input.
 */
export function DatePicker({
  id,
  name,
  defaultValue,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const initialDate = defaultValue ? new Date(`${defaultValue}T00:00:00.000Z`) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getUTCMonth());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape — same interaction pattern as
  // src/components/ui/Modal.tsx's Escape handling, just for a popover
  // instead of a full-screen dialog.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function goToMonth(delta: number) {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth());
  }

  function selectDay(dateKey: string) {
    setValue(dateKey);
    setOpen(false);
  }

  const weeks = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const today = todayKey();

  return (
    <div ref={containerRef} className="relative">
      {/* Controlled + readOnly: this is never directly typed into, only ever
          set programmatically by selectDay/clear below. */}
      <input type="hidden" name={name} value={value} readOnly />
      <button
        type="button"
        id={id}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`${inputClasses} flex items-center justify-between gap-2 text-left`}
      >
        <span className={value ? "text-foreground" : "text-muted/70"}>
          {value ? formatDisplayDate(value) : "No date selected"}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1.5 w-64 rounded-md border border-border bg-surface p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Previous month"
              className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-foreground">{monthLabel}</span>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Next month"
              className="rounded-md px-2 py-1 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-muted">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="py-1">
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {weeks.flatMap((week, weekIndex) =>
              week.map((dateKey, dayIndex) => {
                if (!dateKey) return <span key={`${weekIndex}-${dayIndex}`} />;
                const isSelected = dateKey === value;
                const isToday = dateKey === today;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => selectDay(dateKey)}
                    className={`rounded-md py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-accent font-medium text-accent-foreground"
                        : isToday
                          ? "font-medium text-accent hover:bg-surface-hover"
                          : "text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {Number(dateKey.slice(8, 10))}
                  </button>
                );
              }),
            )}
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => selectDay(today)}
              className="text-xs font-medium text-accent hover:underline"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("");
                setOpen(false);
              }}
              className="text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
