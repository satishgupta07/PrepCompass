# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A personal LeetCode tracker organized pattern-by-pattern (Two Pointers,
Sliding Window, Binary Search, ...) instead of one flat list. Next.js 16
App Router + MongoDB/Mongoose. No auth — single-user personal tool. Beyond
the core tracker there's a 5-day spaced-revision Reminders page and a
GitHub-style Activity graph with streaks, plus a REST API alongside the UI.

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run build         # production build — also type-checks
npm run start         # run the production build
npm run lint          # ESLint
npx tsc --noEmit       # type-check only, faster than a full build
npm run seed           # seed pattern taxonomy + starter problems (idempotent, safe to re-run)
```

There is no test suite. Verification is `npx tsc --noEmit` + `npm run lint`
+ `npm run build`, all clean, plus a manual browser check — see SETUP.md's
"Testing" section for the exact walkthrough (including how to exercise the
5-day reminder and the activity graph without waiting days for it).

Without `MONGODB_URI` set in `.env.local`, the app runs against
`src/lib/mock-data.json` instead of a real database (see below) — reads
work, but every write (UI or API) throws.

## Architecture

### Two collections, three concerns

`Pattern` (`src/models/Pattern.ts`) and `Problem` (`src/models/Problem.ts`)
are the core data. `DayActivity` (`src/models/DayActivity.ts`) is a
separate collection keyed by `date` ("YYYY-MM-DD") with a `count`, feeding
the Activity graph and streaks — it's populated as a side effect of solving
or revising a problem, never edited directly.

Every model pairs a Mongoose schema with a `*DTO` type and a `toXDTO()`
converter. Server Components fetch and convert; Client Components only ever
receive the plain serializable DTOs — a Mongoose document's ObjectId/Date
fields aren't serializable across that boundary as-is.

### One service layer, two transports

`src/lib/services/patterns.ts` and `src/lib/services/problems.ts` hold all
the Zod validation and MongoDB logic. Two thin layers call into them:

- `src/actions/*.ts` — Server Actions (`"use server"`), used by the UI.
  Parse `FormData`, call a service function, `revalidatePath`.
- `src/app/api/**/route.ts` — REST endpoints, used by anything outside this
  Next.js app (a script, a browser extension). Parse a JSON body, call the
  **same** service function, return `NextResponse.json`.

Neither transport re-implements validation or DB calls — that's the point
of the split. The one place this deliberately *doesn't* unify: "update
problem details" has genuinely different semantics per surface, so each
gets its own service function instead of being forced into one shape —
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

### Data loading: cached vs. uncached

`src/lib/load-data.ts` exports `loadAppData` (wrapped in React's `cache()`)
for Server Components — the root layout's `Header` and a page can both call
it within the same request and only hit the DB once — and
`loadAppDataUncached` (the same function, unwrapped) for Route Handlers.
`cache()`'s per-request dedup is tied to the React Server Component render
lifecycle; a Route Handler isn't part of that render, so reusing the cached
version there risks a stale value leaking across unrelated requests. Route
Handlers always import `loadAppDataUncached`.

When `MONGODB_URI` isn't set, `loadAppData`/`loadAppDataUncached` return
`src/lib/mock-data.json` instead of querying Mongo (`isMock: true`, surfaced
as a banner on the tracker page). This is a UI-preview convenience only —
the REST API's own service functions (`listPatterns`, `listProblemsService`,
etc.) always query Mongo directly and throw if it isn't configured, since
an external API caller should get a clear error, not fake data.

### Spaced revision and streaks

`Problem.solvedAt` is set the moment the checkbox is first checked (cleared
if unchecked) and is never touched again after that. `src/lib/reminders.ts`
computes what's due: `(lastRevisedDate ?? solvedAt) + 5 days`, most overdue
first — see `REVISION_INTERVAL_DAYS`. Every solve or "last revised date"
edit calls `recordActivity(dateKey)` (`src/lib/activity.ts`), which
increments that day's `DayActivity.count` — **increment-only, never
decremented**, mirroring a commit graph rather than a live counter (so
unchecking a problem doesn't retroactively erase a day's activity).
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

### Seeding

`scripts/seed.ts` is idempotent: patterns upsert by `slug`, problems upsert
by `{ pattern, title }`. Re-running it after editing the curated list picks
up new entries without duplicating or touching a problem's `solved`/`notes`/
`lastRevisedDate` (those are `$setOnInsert`-only, i.e. user-owned once they
exist). It loads `.env.local` itself (`tsx` has no built-in env loading) —
see `loadEnvLocal()` at the top of the file.

### Styling

Tailwind v4, hand-rolled components (no UI library), dark-only. Palette is
defined once as CSS variables in `src/app/globals.css` under `@theme
inline` — `background`, `surface`, `accent`, `easy`/`medium`/`hard`, etc. —
and referenced everywhere else as Tailwind classes (`bg-surface`,
`text-hard`). Don't hardcode hex colors in components; add a new token to
`globals.css` instead if the palette needs to grow.
