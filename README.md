# PrepCompass

A personal LeetCode tracker organized pattern-by-pattern — Two Pointers,
Sliding Window, Binary Search, and so on — instead of one flat list.
Problems collapse into per-pattern accordions with a solved/total count and
progress bar; each problem carries a difficulty, a checkbox, a LeetCode
link, your own GitHub solution link, a YouTube reference link, approach
notes, and a last-revised date for spaced revision.

Beyond the core tracker:

- **Reminders** (`/reminders`) — problems solved (or last revised) 5+ days
  ago resurface here for another look, with a due-count badge in the nav.
- **Activity** (`/activity`) — a GitHub-style contribution graph plus
  current/longest streak, driven by every solve or revision you log.
- A **REST API** (`/api/*`) for anything outside this app — a script, a
  browser extension — to read/write the shared pattern/problem catalog.
  See "REST API" below.

## Accounts and roles

Register/sign in at `/register`/`/login`. The pattern/problem **catalog**
is shared by everyone, but `solved`, notes, last-revised date, and the
Activity graph/streaks are **per account** — everyone tracks their own
progress against the same problem list.

Two roles:

- **user** (default for every new registration) — can check problems
  solved, edit their own notes/last-revised date, and view Reminders/
  Activity for their own progress.
- **admin** — everything a user can do, plus: add/delete a pattern,
  add/delete a problem, and edit a problem's shared reference links
  (LeetCode/GitHub/YouTube).

There's no self-service promotion to admin — every new account starts as
`user`. Promote one by email once it's registered:

```bash
npm run make-admin -- someone@example.com
```

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
(hand-rolled components, no UI library), MongoDB + Mongoose, Zod, Auth.js
(next-auth v5) for accounts/sessions.

Mutations happen through two parallel surfaces sharing one service layer
(`src/lib/services/`): Next.js Server Actions (`src/actions/`) for the UI,
and Route Handlers (`src/app/api/`) for external callers. Neither
duplicates the Zod validation or MongoDB logic — each just adapts its own
transport (FormData + `revalidatePath` vs. JSON + `NextResponse`) around the
same underlying functions.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI and AUTH_SECRET
npm run dev
```

Generate an `AUTH_SECRET` with `npx auth secret` (or any random string) —
Auth.js uses it to sign session cookies.

`MONGODB_URI` is required — every page requires a signed-in session, and
every Server Action/API route talks to Mongo directly; there's no
mock-data fallback.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Start the production build |
| `npm run lint` | ESLint |
| `npm run make-admin -- <email>` | Promote an already-registered account to admin |

## REST API

All endpoints return JSON and operate on the **shared catalog only**
(patterns, and problems' title/difficulty/reference links) — the REST API
has no session/cookie concept, so it can't read or write any one person's
`solved`/notes/last-revised-date/activity. Those are UI-only, scoped to
whoever's signed in.

`GET` requests are open; `POST`/`PATCH`/`DELETE` requests require an API
key **only if** `API_KEY` is set in the environment (see `.env.example`) —
sent as `x-api-key: <value>` or `Authorization: Bearer <value>`. Unset
locally by default.

| Method & path | Purpose |
|---|---|
| `GET /api/patterns` | List all patterns |
| `POST /api/patterns` | Create a pattern — body `{ name, referenceLink? }` |
| `DELETE /api/patterns/:id` | Delete a pattern (fails if it still has problems) |
| `GET /api/problems` | List catalog problems — optional `?pattern=slug&difficulty=easy\|medium\|hard` |
| `POST /api/problems` | Create a problem — body `{ pattern, title, difficulty, leetcodeLink?, githubLink?, youtubeLink? }` |
| `GET /api/problems/:id` | Get one problem |
| `PATCH /api/problems/:id` | Partial update of the catalog's reference links only — body may include any of `{ leetcodeLink, githubLink, youtubeLink }`; omit a key to leave it untouched, send `null` to clear it |
| `DELETE /api/problems/:id` | Delete a problem |

`/api/reminders` and `/api/activity` were removed — both are inherently
per-user (whose streak? whose due list?) and the REST API has no user
identity to scope them by. Use the UI (`/reminders`, `/activity`) for those.

Example — add a problem via `curl`:

```bash
curl -X POST http://localhost:3000/api/problems \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"pattern":"arrays-hashing","title":"Two Sum","difficulty":"easy","leetcodeLink":"https://leetcode.com/problems/two-sum/"}'
```

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket and import it into Vercel.
2. In the Vercel project's Environment Variables settings, add `MONGODB_URI`
   (same value as `.env.local`, or a separate production Atlas cluster),
   `AUTH_SECRET`, and `API_KEY` if you want the REST API's write endpoints
   protected once it's publicly reachable.
3. In Atlas → Network Access, allow access from anywhere (`0.0.0.0/0`) — Vercel serverless functions don't have a fixed IP, so this is required unless you set up Atlas's [Vercel integration](https://www.mongodb.com/docs/atlas/manage-connections-aws-privatelink/) or a private network peering.
4. Deploy, register an account through the deployed app, then run
   `npm run make-admin -- you@example.com` (locally, pointed at the
   production `MONGODB_URI`) to make yourself an admin.

## Known gaps, deliberately not built yet

- **No CORS headers on the API.** A same-origin script or a browser
  extension with host permissions can call it; a web page on another origin
  can't without `Access-Control-Allow-Origin` being added later.
- **No additional tracker tabs yet** (System Design, JavaScript, React,
  Machine Coding) — the data model and UI are DSA/pattern-specific for now.
  Whether those share this schema or need their own model is a decision to
  make once their real shape is known, not before.
- **No automated test suite** — verification is type-check + lint + build
  + manual browser check.
- **No password reset / email verification.** Registration is
  email+password only, with no email sent anywhere — if you forget your
  password, an admin has to reset it by hand in Mongo (or you register a
  new account).
