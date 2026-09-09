"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

const THEME_CHANGE_EVENT = "prepcompass:theme-change";

/**
 * `useSyncExternalStore`, not `useState`+`useEffect` — the current theme
 * lives outside React (a class on `<html>`, set by the anti-flash inline
 * script in `src/app/layout.tsx` before hydration ever runs), and the
 * server has no way to know a visitor's saved theme at all.
 * `getServerSnapshot` returning `false` matches globals.css's dark default
 * for the server-rendered/pre-hydration markup, then React re-syncs to the
 * real `getSnapshot()` value right after hydrating — no flash, no
 * hydration-mismatch warning, no placeholder render needed.
 */
function subscribe(callback: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, callback);
}

function getSnapshot(): boolean {
  return document.documentElement.classList.contains("light");
}

function getServerSnapshot(): boolean {
  return false;
}

/** Light/dark switch — only ever toggles the `.light` class on `<html>` and mirrors the choice to `localStorage`. */
export function ThemeToggle() {
  const isLight = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    localStorage.setItem("theme", next ? "light" : "dark");
    // Nothing else observes the `.light` class directly, so nudge this
    // component's own `useSyncExternalStore` subscription to re-read it.
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      {isLight ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
    </button>
  );
}
