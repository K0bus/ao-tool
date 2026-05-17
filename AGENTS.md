# Repository Guidelines

## Project Structure & Module Organization

This is a pnpm workspace monorepo managed with Turbo. The Nuxt 3 full-stack app lives in `apps/web`, with Vue pages/components under `pages/` and `components/`, server routes under `server/api/v1/`, and shared server helpers under `server/utils/`. Core packages are in `packages/`: `database` contains the Prisma schema and client, `queue` defines BullMQ queues and job types, `types` holds shared TypeScript contracts, `ao-parser` normalizes Albion data, and `market-engine` handles market price syncing. Operational scripts and workers live in `scripts/`; Docker assets live in `docker/`.

## Build, Test, and Development Commands

Use Node `>=22` and pnpm `>=9`.

```bash
pnpm install          # install workspace dependencies
docker-compose up -d # start PostgreSQL and Redis
pnpm db:migrate      # apply Prisma migrations
pnpm db:generate     # regenerate Prisma client after schema changes
pnpm dev             # run the Nuxt web app
pnpm build           # build all packages/apps via Turbo
pnpm typecheck       # run TypeScript/Nuxt type checks
pnpm test            # run Vitest tests
pnpm test:coverage   # run Vitest with V8 coverage
pnpm import:market   # trigger market price sync
```

`pnpm lint` is the standard lint entrypoint, but ensure ESLint dependencies are installed for the target workspace before relying on it.

## Database Schema & Migrations Guidelines

- **NEVER** edit or mutate the SQL database schema directly in the database (e.g., using direct client connections or raw SQL) without going through Prisma migrations.
- **ALWAYS** perform database schema changes through Prisma by editing `packages/database/prisma/schema.prisma`.
- **ALWAYS** generate a migration file by running `npx prisma migrate dev --name <migration_name>` inside the `packages/database` package, and commit the newly created migration folder.
- **ALWAYS** run `pnpm db:generate` to regenerate the Prisma client after schema/migration updates.

## Coding Style & Naming Conventions

Use TypeScript and follow existing file-local style: two-space indentation, single quotes, no semicolons, and explicit types at package/API boundaries. Vue components use PascalCase filenames, composables use `useX.ts`, and Nitro routes follow Nuxt conventions such as `index.get.ts`, `[id].get.ts`, and `sync.post.ts`. Prefer existing aliases and package APIs over cross-package deep imports.

## Testing Guidelines

Vitest is configured for Node tests in `packages/**/__tests__/**/*.test.ts` and `scripts/**/__tests__/**/*.test.ts`. Keep fixtures close to the package under test, as in `packages/ao-parser/src/__tests__/fixtures.ts`. Add focused tests for normalizers, parsers, pricing logic, and scripts with nontrivial branching. Coverage currently targets `packages/ao-parser/src/**`.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit style: `feat: ...`, `fix: ...`, `refactor: ...`, with optional scopes such as `feat(web): ...`. Keep commits small and behavior-focused. Pull requests should include a clear summary, testing performed (`pnpm typecheck`, `pnpm test`, screenshots for UI changes), linked issues when available, and migration/import notes for Prisma or data pipeline changes.

## Security & Configuration Tips

Do not commit secrets. Configure runtime values through `.env`; database and Redis are expected by Prisma, Nuxt server routes, sessions, and BullMQ workers. Admin APIs must use `requireAdmin()` from `server/utils/guards.ts`.
