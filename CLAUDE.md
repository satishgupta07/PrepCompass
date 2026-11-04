# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A personal LeetCode tracker organized pattern-by-pattern (Two Pointers,
Sliding Window, Binary Search, ...) instead of one flat list. Next.js 16
App Router + MongoDB/Mongoose + Auth.js (next-auth v5). Multi-user: the
pattern/problem catalog is shared, but each account tracks its own solved/
notes/revision/activity state — see "Accounts, roles, and auth" below.
Beyond the core tracker there's a 5-day spaced-revision Reminders page and a
GitHub-style Activity graph with streaks, plus a REST API alongside the UI.

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build         # production build — also type-checks
npm run start         # run the production build
npm run lint          # ESLint
npx tsc --noEmit       # type-check only, faster than a full build
npm run make-admin -- <email>  # promote an already-registered account to admin (see below)
```

There is no test suite and no seed script. Verification is `npx tsc
--noEmit` + `npm run lint` + `npm run build`, all clean, plus a manual
browser check (register/log in, add a pattern/problem as admin, toggle
solved, mark revised, check the Activity graph updates).

`MONGODB_URI` is required — there is no mock-data fallback. Every page
requires a signed-in session (enforced by `proxy.ts`), and every Server
Action/API route talks to Mongo directly.

## Architecture

### Six models, catalog vs. per-user

`Pattern` (`src/models/Pattern.ts`) and `Problem` (`src/models/Problem.ts`)
are the shared catalog — the same for every account, admin-managed. Per-user
state lives in three separate collections instead of on `Problem` itself:
`ProblemProgress` (`solved`/`notes`/`lastRevisedDate`/`solvedAt` for one
`{ userId, problem }` pair), `DayActivity` (one increment-only `count` per
`{ userId, date }`, feeding the Activity graph's shading and streak math),
and `ActivityEvent` (an append-only per-action log per `{ userId, date }`,
feeding the day-detail view — see "Spaced revision and streaks" below for
how the three activity-related pieces fit together). `User`
(`src/models/User.ts`) holds accounts (`email`, `passwordHash`, `role`).

`Problem.toProblemDTO(doc, progress)` merges a catalog `Problem` doc with
the current user's (optional) `ProblemProgress` DTO into the single
`ProblemDTO` shape every consumer (grouping, stats, reminders, the UI)
expects — `progress` is `null`/`undefined` for a problem this user has
never touched, defaulting to unsolved/no-notes/no-history. The REST API has
no session concept, so its service functions always pass `null` and get a
progress-less, catalog-only view (see "One service layer, two transports").

Every model pairs a Mongoose schema with a `*DTO` type and a `toXDTO()`
converter. Server Components fetch and convert; Client Components only ever
receive the plain serializable DTOs — a Mongoose document's ObjectId/Date
fields aren't serializable across that boundary as-is.

### Accounts, roles, and auth

Auth.js (next-auth v5), credentials provider, JWT session strategy. The
config is split across two files so the edge-safe subset can be evaluated
without pulling in MongoDB/bcrypt:

- `src/auth.config.ts` — cookie/JWT shaping, the `authorized` callback, and
  the `jwt`/`session` callbacks that copy `id`/`role`/`name` onto the
  token/session. No DB import.
- `src/auth.ts` — spreads `authConfig` and adds the actual `Credentials`
  provider (looks up `User` by email, `bcrypt.compare`s the password,
  timing-safe via a dummy hash for a nonexistent email). Exports `auth`/
  `signIn`/`signOut`, used by Server Components/Actions and
  `src/app/api/auth/[...nextauth]/route.ts`.

`proxy.ts` (Next.js 16's rename of `middleware.ts`) imports `auth.config`
directly (not `@/auth`) and gates every non-`/api/*` request through the
`authorized` callback, redirecting signed-out visitors to `/login` unless
they're already headed to `/login`/`/register`. `/api/*` is excluded from
the matcher entirely — the REST API has its own, separate `API_KEY` story
(`src/lib/api-auth.ts`), and gating it behind a session cookie would break
every non-browser caller before the route handler ever ran.

On top of that page-level gate, `src/lib/auth-guard.ts` provides the
Server-Action-level checks: `requireUserId`/`requireSession` (hand back the
acting user's id, and optionally `isAdmin`, for per-user writes) and
`requireAdmin` (gates add/delete pattern, add/delete problem, and editing a
problem's shared reference links — see `Role` in `src/models/User.ts`).
There's no self-service promotion to admin; every new registration
(`src/actions/auth.ts`'s `registerAction`) is `role: "user"` — see "Admin
provisioning" below for how an account becomes an admin.

### Admin provisioning

`scripts/make-admin.ts` (`npm run make-admin -- <email>`) is the only way
to create an admin — it promotes an already-registered account by setting
`role: "admin"` directly in Mongo; there's no auto-admin or env-var
allowlist. Like any standalone script here, it loads `.env.local` itself
(`tsx` has no built-in env loading) via `loadEnvLocal()` at the top of the
file, and must do so — via dynamic `import()` of `@/lib/db`, not a static
import — before that module reads `MONGODB_URI` at import time.

### One service layer, two transports

`src/lib/services/patterns.ts` and `src/lib/services/problems.ts` hold all
the Zod validation and MongoDB logic. Two thin layers call into them:

- `src/actions/*.ts` — Server Actions (`"use server"`), used by the UI.
  Parse `FormData`, call a service function, `revalidatePath`.
- `src/app/api/**/route.ts` — REST endpoints, used by anything outside this
  Next.js app (a script, a browser extension). Parse a JSON body, call the
  **same** service function, return `NextResponse.json`.

Neither transport re-implements validation or DB calls — that's the point
of the split. The functions themselves split along the catalog/per-user
line described above: the REST-facing ones (`listProblemsService`,
`getProblemService`, `createProblemService`, `patchProblemService`,
`deleteProblemService`) only ever touch the shared catalog and return
`toProblemDTO(doc, null)`; the UI-only ones (`setProblemSolved`,
`markProblemRevisedToday`, `updateProblemDetailsForm`) take a `userId` and
read/write that user's `ProblemProgress` row. The one place this
deliberately *doesn't* unify: "update problem details" has genuinely
different semantics per surface, so each gets its own service function
instead of being forced into one shape —
`updateProblemDetailsForm` (full-replace: the edit panel always submits
every field, and an empty/absent link means "clear it") vs
`patchProblemService` (true partial PATCH: an omitted key leaves a field
untouched, an explicit `null` clears it). Don't try to merge these.

The REST API has no auth by default. If `API_KEY` is set, `POST`/`PATCH`/
`DELETE` requests must present it (`x-api-key` or `Authorization: Bearer`,
checked in `src/lib/api-auth.ts`); `GET` is always open. This exists
because routes under `/api/*` are a stable, guessable public contract —
unlike Server Actions, whose action IDs are encrypted and rotate on every
deploy.

### Data loading

`src/lib/load-data.ts` exports one function, `loadAppData`, wrapped in
React's `cache()` — the root layout's `Header` and a page can both call it
within the same request and only hit the DB once. It resolves the current
session itself via `auth()` and throws if there isn't one (`proxy.ts`
already keeps signed-out visitors off every page that calls it, so a
missing session here means something is calling it from a route `proxy.ts`
doesn't cover), then fetches the shared catalog plus that user's
`ProblemProgress`/`DayActivity`/`ActivityEvent` rows concurrently.

`cache()`'s per-request dedup is tied to the React Server Component render
lifecycle, so `loadAppData` is only ever called from Server Components
(pages, `Header`) — never from a Route Handler. The REST API's service
functions (`listPatterns`, `listProblemsService`, etc.) query Mongo directly
instead and always throw if `MONGODB_URI` isn't configured, since an
external API caller should get a clear error rather than any kind of
fallback.

### Spaced revision and streaks

`ProblemProgress.solvedAt` is set the moment the checkbox is first checked
for that user (cleared if unchecked) and is never touched again after that.
`src/lib/reminders.ts` computes what's due: `(lastRevisedDate ?? solvedAt) +
5 days`, most overdue first — see `REVISION_INTERVAL_DAYS`. Every solve or "last revised date"
edit calls `recordActivity(userId, dateKey, event)` (`src/lib/activity.ts`),
which both increments that day's `DayActivity.count` — **increment-only,
never decremented**, mirroring a commit graph rather than a live counter
(so unchecking a problem doesn't retroactively erase a day's activity) —
and appends an immutable row to `ActivityEvent` (`src/models/ActivityEvent.ts`),
one per action, with the problem's title/pattern snapshotted at write time.
`DayActivity` powers the graph's shading and the streak math;
`ActivityEvent` powers the day-detail view (click a day on the Activity
page to see everything solved/revised that day) — see
`src/lib/activity-log.ts`'s `groupActivityByDate`.
`src/lib/streak.ts` computes current/longest streak from the set of active
date keys; `src/lib/calendar.ts` builds the GitHub-style week grid
(`buildContributionWeeks`) and month labels (`getMonthMarkers`) the graph
renders from.

### Next.js 16 specifics (see AGENTS.md)

This version has real breaking changes from older training data — `params`
and `searchParams` are Promises (pages and Route Handlers alike), and
dynamic route handler context is typed as `{ params: Promise<{ id: string }> }`.
Every page and API route that touches the database sets
`export const dynamic = "force-dynamic"` — data depends on a runtime env
var (`MONGODB_URI`), so none of it should be attempted at build time.

### Styling

Tailwind v4, hand-rolled components (no UI library). Dark is the default
theme; `ThemeToggle` (`src/components/ui/ThemeToggle.tsx`) toggles a
`.light` class on `<html>`, persisted to `localStorage` and applied
pre-hydration by an inline script in `src/app/layout.tsx` (with
`suppressHydrationWarning` to silence the resulting server/client mismatch)
so there's no flash of the wrong theme on load. Palette is defined once as
CSS variables in `src/app/globals.css` — `:root` for dark, `:root.light` for
light — re-exposed under `@theme inline` as `background`, `surface`,
`accent`, `easy`/`medium`/`hard`, etc., and referenced everywhere else as
Tailwind classes (`bg-surface`, `text-hard`). Don't hardcode hex colors in
components; add a new token (both variants) to `globals.css` instead if the
palette needs to grow.

### Study notebooks, PDF download and progress

`content/study/*.html` are self-contained, hand-authored study notebooks
(HTML & CSS, JavaScript, React, System Design, Node.js) — don't reformat them; they carry
their own CSS/JS. They live in `content/`, not `public/`, so serverless hosts
bundle them into the functions that read them: `next.config.ts`'s
`outputFileTracingIncludes` lists those routes — keep it in sync with
`src/lib/study-files.ts` (the one place that knows the path). `src/lib/study.ts`
is the catalog (slug = file name). Routes, all gated by `proxy.ts` like every
non-API path: `/study` (index + progress), `/study/[slug]` (checklist beside the
notebook in an iframe), `/study/raw/[slug]` (the HTML itself) and
`/study/pdf/[slug]`.

**PDF.** `src/lib/study-pdf.ts` renders a notebook with `puppeteer-core` driving
a locally installed Chrome/Edge (set `CHROME_PATH` to override detection),
using the notebook's own `@media print` rules (for "one page at a time"
`.page` notebooks like System Design it first visits every page so their
diagrams/labs get drawn, and starts each page on a new sheet). A render is expensive, so it is
cached in the OS temp dir keyed by slug + file mtime, concurrent requests for
the same notebook share one render, and at most one browser runs at a time.
It still needs a real browser binary, so on serverless hosts (e.g. Vercel)
swap in `@sparticuz/chromium` or pre-generate the PDFs.

**Study progress.** Per-user, like `ProblemProgress`: `StudyProgress`
(`src/models/StudyProgress.ts`) is one row per `{ userId, notebook }` holding
`completed` — the ids of the notebook sheets marked studied. The page list is
parsed from each notebook's `<section class="sheet|page" id=… data-title|data-label>`
tags by `src/lib/study-pages.ts` (first sheet = cover, skipped; cached by file
mtime), so replacing a notebook updates the checklist automatically; keep that
markup shape and unique sheet ids in any new notebook. `setPageStudied`
(`src/lib/services/study.ts`) validates the id, uses `$addToSet`/`$pull`, and
retries once on a duplicate-key error from two racing first-time upserts.
`toggleStudyPage` (`src/actions/study.ts`) is the Server Action. Progress reads
on the pages go through `tryGet…` helpers that return `null` on a DB error or
3 s timeout, so `/study` still renders (without progress) if MongoDB is down.
Removing a sheet from a notebook leaves a stale id in `completed` — harmless,
counts are clamped to the current total.

### Resume (admin only)

`/resume` shows the owner's resume and `/resume/pdf` downloads it; both require
`role: "admin"` and answer 404 (not 403) to everyone else, and the header's
"Resume" link only renders for admins. There is deliberately **no editor and no
database model**: the content is the `RESUME` object in `src/lib/resume-data.ts`
(edit that file to change it). `src/lib/resume-html.ts` renders it to one
self-contained, ATS-friendly HTML string (single column, standard headings,
plain text, no letter-spacing, all values escaped) that the page shows in a
fully sandboxed `<iframe srcDoc>` and `src/lib/resume-pdf.ts` prints to a text
A4 PDF with the same headless Chrome/Edge lookup and render limit as
`study-pdf.ts` (which exports `findChrome`/`withRenderSlot` for this). Keep it to
one page: check by downloading after edits.
