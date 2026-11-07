# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server
- `npm run build` / `npm run preview` — production build / preview it locally
- `npm run check` — svelte-kit sync + svelte-check (TypeScript typecheck)
- `npm run lint` — prettier --check + eslint
- `npm run format` — prettier --write
- `npm run test:unit` — vitest over `src/**/*.test.ts` and `scripts/**/*.test.js` (helpers, live scores, team-name matching, NFL week, game-link matching, host stats, X bot rules and OAuth signing)
- `npm run test:integration` — playwright e2e (`tests/test.ts` — still asserts the scaffold's "Welcome to SvelteKit" heading and will fail against the real app; do not treat it as a working regression check without fixing it first)
- `npm test` — runs both of the above
- `postinstall` runs `prisma generate` automatically

No CI runs lint/typecheck/tests on PRs. The two GitHub Actions workflows don't validate builds: `.github/workflows/mark-games.yml` grades finished games on a schedule (see `scripts/mark-games.js` below), and `.github/workflows/x-bot.yml` asks the site to post to X (see "X bot" below).

## Architecture

SvelteKit 2 (Svelte 5) app, deployed on Vercel (`adapter-vercel` + `@vercel/analytics`), Postgres via Prisma. It's a companion site for a sports-betting-picks show ("PMT"): staff make official picks, users make their own picks and can "tail" (agree) or "fade" (bet against) staff picks, and results/leaderboards are tracked weekly by NFL year/week.

### Data model (`prisma/schema.prisma`)

- `Pick` — a spread/total bet on an NFL game (`game_id`, `homeTeam`/`awayTeam` as `NFLTeam` enum, `pickTeam`, `pickTotalType`, scores, `winner`/`push` flags, `completed`/`isLive`/`marked`). `barstoolEmployee`/`pmtPersona` distinguish official show picks from regular user picks.
- `User` — `role` defaults to `"user"`; `role === "admin"` gates the admin routes.
- `Session` — custom token-split session (`id.secret`), SHA-256-hashed secret, constant-time compare, one active session per user.
- `Fade` / `Tail` — a user's tail/fade of a specific `Pick`, each tracking its own `winner`/`push`.
- `BotPost` — one row per X bot post, unique on `(type, year, week)`. It's how the bot never posts the same thing twice (see "X bot" below).

There's no `prisma/migrations` folder and local dev points at the production database, so don't `prisma db push` — preview a schema change with `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` (read-only) and apply just the SQL you need.

### Auth

Fully hand-rolled, no Lucia/Auth.js — see `src/lib/server/auth.ts` for session create/validate and `oslo`'s Argon2id for password hashing (a server-side `PEPPER` env var is appended before hashing in `login`/`register`). `hooks.server.ts` reads the `session` cookie on every request into `event.locals.user`/`session` (typed in `app.d.ts`). There's no centralized route guard — each protected `+page.server.ts` checks `if (!user)` / `if (user.role !== 'admin')` itself. Maintenance mode and `[year]/[week]` param validation are enforced globally in the root `+layout.server.ts`. `login`/`register` accept `?redirectTo=` and send the user there afterwards — same-site paths only, checked by `safeRedirectPath` in `utils/helpers.ts`.

### Routing (`src/routes/`)

Standard SvelteKit file-based routing. Conventions worth knowing before touching routes:

- **`[admin]` is a dynamic param segment, not a `(group)`** — it matches any URL segment; access is enforced purely by the `role !== 'admin'` check inside each nested `+page.server.ts`, not by SvelteKit's routing itself. Contains `picks/` (create official PMT picks, pulls odds from The Odds API) and `results/` (the manual fallback for Box Score/Highlights links — `mark-games.js` fills them in, and this lists kicked-off games from the last 14 days still missing either one, with whatever's already there filled in).
- **`[host]` is a root-level catch-all for host pages** (`/hank`, `/pft`) — it matches any single unknown segment. Static routes still win, so a new top-level page is fine as a plain folder, but a mistyped one-segment link now lands on `[host]/+error.svelte` ("Nobody here by that name", with links to every host) instead of `/404`. Slugs come from whoever has picks that season (`resolveHosts` in `lib/config/hosts.ts`), aliases 301 to the canonical slug, past seasons are `?year=2025`, and `[host]/card.png` serves the host's share card (its `?v=` hash makes it safe to cache forever).
- **`[year]/[week]`** is the public weekly picks page (e.g. `/2025/7`); `fadePick`/`tailPick` form actions let logged-in users react to a pick. Each host's section has `id=<host slug>`, so `/2026/9#pft` jumps to their picks.
- **The root layout only renders page content in the browser** (`{#if $screenWidth}` in `+layout.svelte`). `<svelte:head>` tags are server-rendered, but the body isn't — curl and crawlers without JS see an empty page, and a browser's own `#anchor` jump on a fresh load fires before the target exists (the week page redoes it in `onMount`). For per-page link previews, return `meta: PageMeta` from a load; the layout falls back to the site-wide tags.
- `api/*/+server.ts` endpoints are GET-only data fetchers (odds, live scores, etc.); mutations go through form `actions` in `+page.server.ts` files (`addPicks`, `deletePick`, `fadePick`, `tailPick`, `addLinks`, `updateUserData`, `uploadPic`, leaderboard pagination), not through `api/`.
- `bot/` is the X bot: `bot/run` (POST), `bot/check` (POST — tests the X keys without posting) and `bot/[card].png` (preview), both behind the `BOT_SECRET` bearer token outside local dev. They live outside `api/` because `bot/run` posts and writes.
- Other routes: `pickem/` (regular users make their 2 weekly picks), `leaderboard/` (raw `prisma.$queryRaw` stats), `archive/` (historical picks by year), `stats/`, `user/[username]/` (profile, avatar upload to S3), `login/`/`register/`/`reset-password/` (superforms + zod + sveltekit-rate-limiter).

### External integrations

- **The Odds API** (`ODDS_API_KEY`) — primary odds/live-scores source, used across `api/odds`, `[admin]/picks`, `pickem`, and `lib/utils/live-scores.ts`.
- **ESPN partner API** — used by `scripts/mark-games.js`, and as the `[admin]/picks` fallback for games already kicked off.
- **YouTube Data API v3** (`YOUTUBE_API_KEY`, a GitHub Actions secret only — the app never calls it) — `scripts/mark-games.js` reads the NFL channel's uploads to find each game's highlights video.
- **X API** (pay-per-use, OAuth 1.0a user tokens for the bot account) — the X bot uploads a card with `POST /2/media/upload` and posts with `POST /2/tweets`. Signing is hand-rolled in `lib/server/x-bot/oauth.ts`.
- **S3** (`@aws-sdk/client-s3`) — user avatar uploads, served via a CloudFront distro (`PUBLIC_AWS_CLOUDFRONT_DISTRO`).

### `scripts/mark-games.js`

A standalone Node script (its own `scripts/package.json` with just `pg`; connects to Postgres directly, bypassing Prisma) that grades picks. Each run it finds ungraded picks that kicked off in the last 14 days, pulls those games from ESPN, grades the finished ones (rules in `scripts/grading.js`) and settles the `Tail`/`Fade` rows on them. Last, it puts Box Score and Highlights links on the official picks for finished games from the same 14 days (matching in `scripts/game-links.js`). Box scores are built from the ESPN game id. Highlights are the NFL YouTube channel's "<Team> vs <Team> Game Highlights" video, matched strictly (both teams + "Game Highlights", posted within 3 days after kickoff) and retried every run until it's posted. A link that's already set is never overwritten. Without `YOUTUBE_API_KEY` it skips highlights and still adds box scores; if the NFL renames its videos, highlights just stop matching and the log lists the games it's still waiting on. Nothing in it changes week to week. `.github/workflows/mark-games.yml` runs it hourly Sunday–Monday UTC and every 3 hours the rest of the week, with the `DB_*` and `YOUTUBE_API_KEY` GitHub Actions secrets; a failed run fails the workflow (links run after grading, so a YouTube error can't hold grading up). Older ungraded picks (or ones with no `gameDate`) are skipped and counted in the log — grade those by hand. To see what it would do: `node --env-file=.env scripts/mark-games.js --dry-run`.

### X bot

Posts the share cards to the show's X account: "who to fade" (`friday-fade` card) once a week's host picks are in, and the standings (`weekly-standings` card) once a week is graded. `.github/workflows/x-bot.yml` calls `POST https://www.pardonmypicks.com/bot/run` with `BOT_SECRET` after every grading run and hourly Tue–Sat UTC; the site does the rest, since rendering has to run inside SvelteKit (`read()` from `$app/server`).

- When to post and what to say: `lib/utils/x-bot.ts`, pure and tested. A fade post waits for 45 minutes with no new picks (the admin form saves every host in one submit), and gives up once every picked game has kicked off. Standings wait for the week's Tuesday and go stale on the next week's Friday. Nothing posts before 8am ET. The fade host comes from `weekFade` in `utils/host-stats.ts`, the same one the card marks. No @mentions — X only allows automated mentions of people who opted in.
- Never twice: a run claims the `BotPost` row before posting. If X turns a post down it's marked `failed` and retried (up to 3 tries). If X gives no clear answer (timeout, 5xx), the row stays `posting` and is never retried — check the account, then mark the row `posted` or delete it. A run with a `failed` or stuck post answers 500, so the Action goes red.
- Posting needs every switch on: not local dev, no `?dryRun=1`, `X_BOT_POSTING=on`, and all four `X_*` keys. Otherwise the run decides and draws, writes nothing, and reports `would-post`. Set the X keys and `X_BOT_POSTING` on Vercel's Production environment only, so preview deploys can't post.
- Before going live: Actions → "X bot" → Run workflow → `check`. It reports which account the keys post as (it fails unless that's `@pardon_my_pick`, set in `BOT_ACCOUNT_HANDLE` in `run.ts`) and uploads a card without posting it.
- Dry run locally: `npm run dev`, then `curl -X POST localhost:5173/bot/run` for the decisions and text, and `curl localhost:5173/bot/fade.png?week=9 -o fade.png` (or `standings.png`) for the cards.

### `src/lib/`

- `config/hosts.ts` — per-host slugs, aliases and X handles (the host list itself comes from the season's picks), plus `?year=` season parsing.
- `server/` — server-only: `x-bot/` (the X bot's run, X client and posting steps), `auth.ts`, `prisma.ts` (HMR-safe Prisma singleton), `host-stats.ts` (loads a season's host picks and resolves a host slug — host pages and cards both start here so their numbers match). `cards/` renders the PNG share cards with satori + resvg; fonts and images are imported and read with `read()` from `$app/server` so they ship inside the Vercel function. Bump `CARD_VERSION` in `cards/data.ts` when a card's design changes, or cached cards keep the old look. `email-send.ts` exists but is fully commented out / dead code — email sending is not currently wired up.
- `utils/` — `matching-format.ts` (team name ↔ mascot enum mapping), `live-scores.ts` (Odds API live scores), `sidenav-tree.ts` (nav config, week links up to the current week), `nfl-week.ts` (the current NFL week and its game dates, worked out from `CURRENT_YEAR` and today's date — week 1 starts the Wednesday after Labor Day, weeks run Wednesday–Tuesday and roll over at midnight ET, and it stops at week 21. Shared by server, browser and `scripts/seed-test-data.js`. Call it per request, never at module top level on the server, or a long-lived instance keeps last week's number), `types.ts` (shared types: `Pick`, `Odds`, `Scores`, `PageMeta`, etc.), `host-stats.ts` (pure season stats per host; standings rank by wins + ½ per push, same as the homepage race), `host-copy.ts` (wording shared by host pages, og tags and cards).
- `components/` — shared Svelte components (`modal`, `alert`, `tooltip`, `race`, `special-bet`, `structure/sidenav`, `structure/topnav`).

### Env vars

No `.env.example` in the repo. Required vars (see `.env`, gitignored): `DATABASE_URL`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_DATABASE`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `PUBLIC_AWS_CLOUDFRONT_DISTRO`, `ODDS_API_KEY`, `CURRENT_YEAR`, `PUBLIC_CURRENT_YEAR`, `MAINTENANCE_MODE`, `PEPPER`, `RATE_LIMIT_SECRET` (signs the login/register/reset-password rate-limiter cookie). The X bot adds `BOT_SECRET` (also a GitHub Actions secret), `X_API_KEY`, `X_API_KEY_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` and `X_BOT_POSTING` — read through `$env/dynamic/private`, so leaving them unset just keeps the bot in dry run. There are no week env vars — the current week comes from `utils/nfl-week.ts`, so the only seasonal change is bumping `CURRENT_YEAR`/`PUBLIC_CURRENT_YEAR` once a year. `$env/static/*` values are inlined at build time, so changing one on Vercel only takes effect after a redeploy. Note `app.d.ts`'s ambient `$env` type declarations don't cover all of these (e.g. `DATABASE_URL`, `DB_*`, `CURRENT_YEAR`, `PEPPER` are missing) — expect type errors if you reference an undeclared one directly.
