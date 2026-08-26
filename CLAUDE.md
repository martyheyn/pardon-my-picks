# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server
- `npm run build` / `npm run preview` — production build / preview it locally
- `npm run check` — svelte-kit sync + svelte-check (TypeScript typecheck)
- `npm run lint` — prettier --check + eslint
- `npm run format` — prettier --write
- `npm run test:unit` — vitest (single test file `src/index.test.ts`, not real coverage)
- `npm run test:integration` — playwright e2e (`tests/test.ts` — still asserts the scaffold's "Welcome to SvelteKit" heading and will fail against the real app; do not treat it as a working regression check without fixing it first)
- `npm test` — runs both of the above
- `postinstall` runs `prisma generate` automatically

No CI runs lint/typecheck/tests on PRs. The only GitHub Actions workflow (`.github/workflows/mark-games.yml`) is a cron job that runs `scripts/mark-games.js`, unrelated to build validation.

## Architecture

SvelteKit 2 (Svelte 5) app, deployed on Vercel (`adapter-auto` + `@vercel/analytics`), Postgres via Prisma. It's a companion site for a sports-betting-picks show ("PMT"): staff make official picks, users make their own picks and can "tail" (agree) or "fade" (bet against) staff picks, and results/leaderboards are tracked weekly by NFL year/week.

### Data model (`prisma/schema.prisma`)

- `Pick` — a spread/total bet on an NFL game (`game_id`, `homeTeam`/`awayTeam` as `NFLTeam` enum, `pickTeam`, `pickTotalType`, scores, `winner`/`push` flags, `completed`/`isLive`/`marked`). `barstoolEmployee`/`pmtPersona` distinguish official show picks from regular user picks.
- `User` — `role` defaults to `"user"`; `role === "admin"` gates the admin routes.
- `Session` — custom token-split session (`id.secret`), SHA-256-hashed secret, constant-time compare, one active session per user.
- `Fade` / `Tail` — a user's tail/fade of a specific `Pick`, each tracking its own `winner`/`push`.

### Auth

Fully hand-rolled, no Lucia/Auth.js — see `src/lib/server/auth.ts` for session create/validate and `oslo`'s Argon2id for password hashing (a server-side `PEPPER` env var is appended before hashing in `login`/`register`). `hooks.server.ts` reads the `session` cookie on every request into `event.locals.user`/`session` (typed in `app.d.ts`). There's no centralized route guard — each protected `+page.server.ts` checks `if (!user)` / `if (user.role !== 'admin')` itself. Maintenance mode and `[year]/[week]` param validation are enforced globally in the root `+layout.server.ts`.

### Routing (`src/routes/`)

Standard SvelteKit file-based routing. Two conventions worth knowing before touching routes:

- **`[admin]` is a dynamic param segment, not a `(group)`** — it matches any URL segment; access is enforced purely by the `role !== 'admin'` check inside each nested `+page.server.ts`, not by SvelteKit's routing itself. Contains `picks/` (create official PMT picks, pulls odds from The Odds API) and `results/` (attach ESPN/YouTube highlight links to completed games).
- **`[year]/[week]`** is the public weekly picks page (e.g. `/2025/7`); `fadePick`/`tailPick` form actions let logged-in users react to a pick.
- `api/*/+server.ts` endpoints are GET-only data fetchers (odds, live scores, etc.); mutations go through form `actions` in `+page.server.ts` files (`addPicks`, `deletePick`, `fadePick`, `tailPick`, `addLinks`, `updateUserData`, `uploadPic`, leaderboard pagination), not through `api/`.
- Other routes: `pickem/` (regular users make their 2 weekly picks), `leaderboard/` (raw `prisma.$queryRaw` stats), `archive/` (historical picks by year), `stats/`, `user/[username]/` (profile, avatar upload to S3), `login/`/`register/`/`reset-password/` (superforms + zod + sveltekit-rate-limiter).

### External integrations

- **The Odds API** (`ODDS_API_KEY`) — primary odds/live-scores source, used across `api/odds`, `[admin]/picks`, `pickem`, and `lib/utils/live-scores.ts`.
- **ESPN partner API** — used only by `scripts/mark-games.js`.
- **S3** (`@aws-sdk/client-s3`) — user avatar uploads, served via a CloudFront distro (`PUBLIC_AWS_CLOUDFRONT_DISTRO`).

### `scripts/mark-games.js`

A standalone script (own dependency install, connects to Postgres directly via `pg`, bypassing Prisma) that marks games complete, pulls final scores from ESPN, determines spread/total winners, and propagates results to `Tail`/`Fade` records. Run on a schedule by `.github/workflows/mark-games.yml` around NFL game windows. **`WEEK`/`YEAR`/`GAMES_START`/`GAMES_END` are hardcoded constants in the script** and must be updated manually each week — if picks/results aren't grading correctly, check this first.

### `src/lib/`

- `server/` — server-only: `auth.ts`, `prisma.ts` (HMR-safe Prisma singleton). `email-send.ts` exists but is fully commented out / dead code — email sending is not currently wired up.
- `utils/` — `matching-format.ts` (team name ↔ mascot enum mapping), `live-scores.ts` (Odds API live scores), `sidenav-tree.ts` (nav config, derives week links from `PUBLIC_CURRENT_WEEK`/`PUBLIC_CURRENT_YEAR`), `types.ts` (shared types: `Pick`, `Odds`, `Scores`, etc.).
- `components/` — shared Svelte components (`modal`, `alert`, `tooltip`, `race`, `special-bet`, `structure/sidenav`, `structure/topnav`).

### Env vars

No `.env.example` in the repo. Required vars (see `.env`, gitignored): `DATABASE_URL`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_DATABASE`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `PUBLIC_AWS_CLOUDFRONT_DISTRO`, `ODDS_API_KEY`, `CURRENT_WEEK`, `CURRENT_YEAR`, `PUBLIC_CURRENT_WEEK`, `PUBLIC_CURRENT_YEAR`, `GAMES_START_DATE`, `GAMES_END_DATE`, `MAINTENANCE_MODE`, `PEPPER`. Note `app.d.ts`'s ambient `$env` type declarations don't cover all of these (e.g. `DATABASE_URL`, `DB_*`, `CURRENT_YEAR`, `PEPPER` are missing) — expect type errors if you reference an undeclared one directly.
