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
  browser extension — to read/write the same data. See "REST API" below.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
(hand-rolled components, no UI library), MongoDB + Mongoose, Zod. No auth
yet — this is a personal, single-user tool for now (see "Known gaps" below).

Mutations happen through two parallel surfaces sharing one service layer
(`src/lib/services/`): Next.js Server Actions (`src/actions/`) for the UI,
and Route Handlers (`src/app/api/`) for external callers. Neither
duplicates the Zod validation or MongoDB logic — each just adapts its own
transport (FormData + `revalidatePath` vs. JSON + `NextResponse`) around the
same underlying functions.

## Local setup

See [SETUP.md](SETUP.md) for a full step-by-step walkthrough (Atlas setup,
seeding, and a manual test pass for every feature). Short version:

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI
npm run seed
npm run dev
```

Without `MONGODB_URI` set, the app falls back to a bundled mock fixture
(`src/lib/mock-data.json`) so the UI can still be previewed — you'll see a
banner saying so, and any write (add/edit/delete/toggle, via the UI or the
API) will error since there's no real database to write to.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Start the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Seed pattern taxonomy + starter problems (idempotent) |

## REST API

All endpoints return JSON. `GET` requests are open; `POST`/`PATCH`/`DELETE`
requests require an API key **only if** `API_KEY` is set in the environment
(see `.env.example`) — sent as `x-api-key: <value>` or
`Authorization: Bearer <value>`. Unset locally by default.

| Method & path | Purpose |
|---|---|
| `GET /api/patterns` | List all patterns |
| `POST /api/patterns` | Create a pattern — body `{ name, referenceLink? }` |
| `DELETE /api/patterns/:id` | Delete a pattern (fails if it still has problems) |
| `GET /api/problems` | List problems — optional `?pattern=slug&difficulty=easy\|medium\|hard&solved=true\|false` |
| `POST /api/problems` | Create a problem — body `{ pattern, title, difficulty, leetcodeLink?, githubLink?, youtubeLink? }` |
| `GET /api/problems/:id` | Get one problem |
| `PATCH /api/problems/:id` | Partial update — body may include any of `{ solved, notes, lastRevisedDate, leetcodeLink, githubLink, youtubeLink }`; omit a key to leave it untouched, send `null` to clear it |
| `DELETE /api/problems/:id` | Delete a problem |
| `GET /api/reminders` | Problems due for revision, most overdue first |
| `GET /api/activity` | `{ dayActivities, currentStreak, longestStreak }` |

Example — add a problem via `curl`:

```bash
curl -X POST http://localhost:3000/api/problems \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"pattern":"arrays-hashing","title":"Two Sum","difficulty":"easy","leetcodeLink":"https://leetcode.com/problems/two-sum/"}'
```

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket and import it into Vercel.
2. In the Vercel project's Environment Variables settings, add `MONGODB_URI` (same value as `.env.local`, or a separate production Atlas cluster), and `API_KEY` if you want the REST API's write endpoints protected once it's publicly reachable.
3. In Atlas → Network Access, allow access from anywhere (`0.0.0.0/0`) — Vercel serverless functions don't have a fixed IP, so this is required unless you set up Atlas's [Vercel integration](https://www.mongodb.com/docs/atlas/manage-connections-aws-privatelink/) or a private network peering.
4. Deploy, then run `npm run seed` once against the production `MONGODB_URI` (locally, pointed at the prod cluster, or via a one-off script) to bootstrap the pattern taxonomy there too.

## Known gaps, deliberately not built yet

- **No authentication.** Anyone with the deployed URL can read, add, edit,
  and delete everything through the UI, and — if `API_KEY` isn't set —
  through the REST API too. Acceptable for a personal tool kept at an
  unlisted URL or run locally; not acceptable if the URL is ever shared.
  Auth is a deliberately deferred future phase.
- **No CORS headers on the API.** A same-origin script or a browser
  extension with host permissions can call it; a web page on another origin
  can't without `Access-Control-Allow-Origin` being added later.
- **No additional tracker tabs yet** (System Design, JavaScript, React,
  Machine Coding) — the data model and UI are DSA/pattern-specific for now.
  Whether those share this schema or need their own model is a decision to
  make once their real shape is known, not before.
- **No automated test suite** — verification is type-check + lint + build
  + manual browser check (see SETUP.md's "Testing" section).
