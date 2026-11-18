# Feature: Lab Reservations System

## Objective

Production-quality lab reservation app (API + web) with hexagonal architecture organized by feature.

## Scope and constraints

- Monorepo (pnpm workspaces): `apps/api`, `apps/web`, `packages/shared` (Zod schemas + shared types).
- API: Node + TypeScript + Express, Zod, Prisma + SQLite (Postgres-ready), JWT in httpOnly cookie, bcrypt.
- Web: React + Vite + TypeScript, TanStack Query (optimistic updates + toasts).
- Modules: `src/modules/{reservations,labs,auth}/{domain,application,infrastructure,http}`; domain is framework-free.
- Business rules:
  1. No overlapping reservations for the same lab (inferred from spec commit example).
  2. Duration: min 30 min, max 2 h, in 30-min slots.
  3. Only within opening hours (Mon–Sat, 07:00–21:00).
  4. Created at least 1 h in advance; no past dates; max 14 days ahead.
- Code: SOLID, small functions, no `any`, no dead code, no magic numbers (centralized rule constants).
- Errors: domain errors mapped to HTTP status + Spanish user message.
- Tooling: ESLint + Prettier, strict tsconfig, Conventional Commits, `.env.example`.
- Security: input validation everywhere, server-side authorization, auth rate limit, helmet, restricted CORS, no secrets.
- Tests: Vitest (domain + use cases with in-memory repos), Supertest (API), Playwright (E2E example).
- UI: 150–250 ms ease-out motion, `prefers-reduced-motion`, loading/empty/error/success states, WCAG AA, keyboard nav, responsive to 360px.
- Docs: README (<5 setup commands, diagram, demo credentials), ROADMAP.md, ARCHITECTURE.md.
- Git: atomic Conventional Commits per logical unit, no AI attribution, stop for user review after each slice.

## TDD

- Mode: off (no project/session TDD configuration). Source: none. Runner: Vitest. Ordinary functional checks per task.

## Delivery

- Strategy: auto-chain, `feature-branch-chain`. One branch per slice, each based on the previous slice
  branch (`feat/slice-1-setup` → `feat/slice-2-domain` → `feat/slice-3-persistence` → `feat/slice-4-http`
  → `feat/slice-5-web` → `feat/slice-6-e2e-docs`). Each pushed to `origin`; PR base = previous slice branch.
- 2026-11-18: user said "I trust in you, go ahead with the rest of the application" → slices S2–S6 run
  back-to-back without a stop between slices; native review consent is still relayed to the user.

## Design contract (shared by all slices)

### Time and calendar

- All instants stored and transported as UTC ISO-8601 strings / `Date`.
- Business rules evaluated in a configured business time zone (`BUSINESS_TIME_ZONE`, default
  `America/Bogota`, assumption — user location unknown) using the built-in `Intl` API (no date libs in domain).
- Domain never calls `new Date()` for "now": a `Clock` port is injected.

### Rule constants (single source: `apps/api/src/modules/reservations/domain/reservation-rules.ts`)

`SLOT_MINUTES = 30`, `MIN_DURATION_MINUTES = 30`, `MAX_DURATION_MINUTES = 120`, `OPENING_HOUR = 7`,
`CLOSING_HOUR = 21`, `OPEN_WEEKDAYS = Mon–Sat`, `MIN_LEAD_TIME_MINUTES = 60`, `MAX_ADVANCE_DAYS = 14`.
Shared copies of the client-relevant values live in `@labs/shared` (web uses them for UI hints); the API
domain is authoritative.

### Entities and value objects

- `User { id, email, name, role: 'student' | 'admin', passwordHash }` (auth module).
- `Lab { id, name, location, capacity, isActive }` (labs module).
- `TimeSlot` VO `{ start, end }`: start < end, both aligned to 30-min boundaries, duration 30–120 min.
- `Reservation { id, labId, userId, slot: TimeSlot, status: 'active' | 'cancelled', createdAt }`.

### Rules (domain, pure)

1. No overlap: an active reservation for the same lab whose slot intersects (`a.start < b.end && b.start < a.end`).
   Back-to-back slots are allowed.
2. Duration 30–120 min, start/end aligned to 30-min slots.
3. Inside opening hours Mon–Sat; start ≥ 07:00 and end ≤ 21:00 local; same local day.
4. start ≥ now + 60 min; start not in the past; start ≤ now + 14 days.

- Cancel: owner or admin only; only `active`; only before the slot starts.
- Lab must exist and be active to be booked.

### Domain errors (each has a stable `code`)

`INVALID_TIME_SLOT`, `SLOT_NOT_ALIGNED`, `INVALID_DURATION`, `OUTSIDE_OPENING_HOURS`, `CLOSED_DAY`,
`INSUFFICIENT_LEAD_TIME`, `PAST_DATE`, `TOO_FAR_IN_ADVANCE`, `RESERVATION_OVERLAP`, `LAB_NOT_FOUND`,
`LAB_INACTIVE`, `RESERVATION_NOT_FOUND`, `RESERVATION_ALREADY_CANCELLED`, `RESERVATION_ALREADY_STARTED`,
`FORBIDDEN`, `INVALID_CREDENTIALS`, `EMAIL_ALREADY_REGISTERED`, `UNAUTHENTICATED`.
HTTP layer (S4) maps code → status + Spanish message in one table.

### Ports (application layer)

`ReservationRepository` (save, findById, findActiveOverlapping(labId, slot), findByUser, findActiveByLabBetween),
`LabRepository` (findAll, findById), `UserRepository` (findByEmail, findById, save), `Clock`, `IdGenerator`,
`PasswordHasher`, `TokenService`. In-memory adapters for tests live in each module's `infrastructure/in-memory`.

### Use cases

Reservations: `CreateReservation`, `CancelReservation`, `ListMyReservations`, `GetLabAvailability(labId, date)`
(returns 30-min slots of that local day with free/taken/past flags). Labs: `ListLabs`, `GetLab`.
Auth: `RegisterUser`, `AuthenticateUser`, `GetCurrentUser`.

### HTTP API (S4)

`POST /api/auth/register|login|logout`, `GET /api/auth/me`, `GET /api/labs`, `GET /api/labs/:labId`,
`GET /api/labs/:labId/availability?date=YYYY-MM-DD`, `GET /api/reservations/me`, `POST /api/reservations`,
`POST /api/reservations/:id/cancel`. JWT in httpOnly, `SameSite=Strict`, `Secure` in production cookie.
Request/response schemas from `@labs/shared`.

## Slices

- [x] S1 Repo setup + tooling (route: delegated direct — writer trigger, 10+ non-trivial files)
- [x] S2 Domain + use cases + unit tests (slice-order details inferred: original spec text truncated)
- [ ] S3 Persistence (Prisma) + infrastructure adapters
- [ ] S4 HTTP API + integration tests
- [ ] S5 Features (web UI)
- [ ] S6 Seed + E2E example + docs (README, ROADMAP, ARCHITECTURE)

## S1 tasks

- [x] S1.1 pnpm workspace root (package.json, pnpm-workspace.yaml, .gitignore, .editorconfig, .nvmrc, .env.example)
- [x] S1.2 Strict TypeScript base config
- [x] S1.3 ESLint (flat, typescript-eslint strict) + Prettier
- [x] S1.4 Commitlint + husky commit-msg hook
- [x] S1.5 `packages/shared` scaffold
- [x] S1.6 `apps/api` scaffold (Express, helmet, CORS, /health, Vitest + Supertest)
- [x] S1.7 `apps/web` scaffold (React + Vite + Vitest)

## S2 tasks (route: delegated direct — writer trigger)

- [x] S2.0 S1 follow-ups: handle listen errors, stronger denied-origin CORS test, `CORS_ORIGIN` URL validation
- [x] S2.1 Reservation rule constants + `TimeSlot` value object + domain errors
- [x] S2.2 Reservation entity + booking policy (rules 1–4) + cancel rules
- [x] S2.3 Labs domain + use cases (`ListLabs`, `GetLab`)
- [x] S2.4 Reservation use cases + in-memory repositories
- [x] S2.5 Auth domain + use cases (ports for hasher/token)
- [x] S2.6 Shared Zod schemas + rule constants in `@labs/shared`

## S3 tasks (route: delegated direct — writer trigger)

- [ ] S3.0 S2 review follow-ups: self-registration always student (R1-001); availability marks slots outside the
      booking window as `unavailable`; invalid Date guard; doc/test nits
- [ ] S3.1 Atomic overlap check + save (port method) and unique-email race handling
- [ ] S3.2 Prisma schema + migration (SQLite, Postgres-ready) + client setup
- [ ] S3.3 Prisma repositories (users, labs, reservations) + integration tests on a test DB
- [ ] S3.4 Real adapters: bcrypt hasher, JWT token service, system clock, UUID id generator; env validation

## Checks

`pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Progress / evidence

- S1 commits: 2ed9495 (S1.1), 4b428dc (S1.2), be1166b (S1.3), 6ae973d (S1.4), 9c9d034 (S1.5), 741c214 (S1.6), 3feaa18 (S1.7).
- S1 checks (writer): install --frozen-lockfile, lint, format:check, typecheck, test (shared 2, api 7, web 1), build all exit 0; commitlint hook rejects bad message. Parent spot check: test + lint pass.
- S1 decisions: TypeScript pinned ~6.0.3 (typescript-eslint support); @labs/shared built to dist via tsc; esbuild build script denied in pnpm-workspace.yaml; .gitattributes eol=lf.
- S1 RDD: assessed medium (executable .husky/commit-msg); user granted; reliability lens APPROVED and acknowledged (authority burned). Reviewed boundary advances to 3feaa18. Advisory follow-ups (non-blocking): CORS denied-origin test assertion weak (apps/api/src/app.test.ts); CORS_ORIGIN env validation loose (apps/api/src/config/env.ts); server listen errors not handled (apps/api/src/server.ts, WARNING); workspace tests depend on shared dist build.

- S2 commits: 07122df, 65749a5, 96ecfeb (S2.0), 9db6fbd (S2.1), af88ea9 + 5e00505 (S2.2), 8a1681d (S2.3),
  80ddd07 (S2.4), 831c085 (S2.5), 5d9b429 (S2.6), b7b012d (import-boundary lint rule).
- S2 checks (writer): install, lint, format:check, typecheck, test (shared 20, api 108, web 1), build all exit 0.
  Parent spot check: test pass, no attribution lines.
- S2 RDD: high (auth). User granted. 4-lens review APPROVED and acknowledged; boundary → b7b012d.
  Advisory follow-ups folded into S3.0/S3.1 (role escalation via register input, availability free-but-unbookable,
  overlap check-then-save race, duplicate-email race, invalid Date RangeError, misleading doc, test magic millis,
  redundant CORS assertion) and S4 (compile-time check that API error codes ⊆ shared ERROR_CODES).

## Next step

S3 delegated writer on `feat/slice-3-persistence`.
