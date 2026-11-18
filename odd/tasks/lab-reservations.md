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
- Strategy: ask-on-risk. One branch per slice (`feat/slice-N-*`), user reviews after each slice.

## Slices
- [ ] S1 Repo setup + tooling (route: delegated direct — writer trigger, 10+ non-trivial files)
- [ ] S2 Domain + use cases + unit tests (slice-order details inferred: original spec text truncated)
- [ ] S3 Persistence (Prisma) + infrastructure adapters
- [ ] S4 HTTP API + integration tests
- [ ] S5 Features (web UI)
- [ ] S6 Seed + E2E example + docs (README, ROADMAP, ARCHITECTURE)

## S1 tasks
- [ ] S1.1 pnpm workspace root (package.json, pnpm-workspace.yaml, .gitignore, .editorconfig, .nvmrc, .env.example)
- [ ] S1.2 Strict TypeScript base config
- [ ] S1.3 ESLint (flat, typescript-eslint strict) + Prettier
- [ ] S1.4 Commitlint + husky commit-msg hook
- [ ] S1.5 `packages/shared` scaffold
- [ ] S1.6 `apps/api` scaffold (Express, helmet, CORS, /health, Vitest + Supertest)
- [ ] S1.7 `apps/web` scaffold (React + Vite + Vitest)

## Checks
`pnpm install`, `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Progress / evidence
- (none yet)

## Next step
S1 delegated writer.
