# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development server (Nuxt SSR)
pnpm dev

# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Lint
pnpm lint

# Run tests
pnpm test

# Prisma
pnpm db:generate    # Regenerate Prisma client after schema changes
pnpm db:studio      # Open Prisma Studio GUI
pnpm db:seed        # Seed initial data

# Data import scripts
pnpm import:full           # Full Albion Online data import
```

## Architecture Overview

**Monorepo** managed with pnpm workspaces + Turbo.

```
apps/
  web/               — Nuxt 3 full-stack app (SSR + API)
packages/
  database/          — Prisma 7 schema + client (PostgreSQL)
  queue/             — BullMQ job queue definitions (Redis)
  types/             — Shared TypeScript interfaces
  ao-parser/         — Albion Online raw data fetcher & normalizer
scripts/             — One-off admin tools (import workers, DB scripts)
docker/              — Dockerfile(s) for app + worker containers
```

### Infrastructure

- **PostgreSQL 16** — primary database
- **Redis 7** — session cache + BullMQ job queue

### Web App (`apps/web`)

Nuxt 3 with full-stack rendering. Server routes live in `server/api/v1/`.

**Auth flow**: httpOnly cookie → session token → Redis cache (5 min TTL) → DB lookup. Sessions expire after 30 days. Passwords hashed with bcryptjs cost 12.

**Server utilities** (`server/utils/`):
- `auth.ts` — session creation, password hashing, token verification
- `guards.ts` — `requireAuth()`, `requireAdmin()`, `requireModerator()` — throw 401/403
- `prisma.ts` — singleton PrismaClient
- `redis.ts` — singleton Redis client
- `cache.ts` — Redis-backed cache helpers

**Middleware order** (server):
1. `00.auth.ts` — populates `event.context.user`
2. `01.rate-limit.ts` — rate limiting

**Client middleware**: `middleware/auth.global.ts` — route protection and redirects.

**State**: Pinia store via `composables/useAuth.ts`.

### Database (`packages/database`)

Key models and relationships:
- **Item** — core entity: uniqueName, tier (1–8), enchantment (0–4), ItemType enum, crafting/refining flags, icon paths, variants
- **ItemLocalization** — multi-language names/descriptions per item
- **CraftingRecipe / RefiningRecipe** — ingredients, silver cost, focus, fame; linked to CraftingStation
- **CityItemBonus / ReturnRate** — city-specific bonuses and return rates per tier/enchantment
- **Location** — cities typed by LocationType enum
- **Category** — hierarchical (parent-child self-relation)
- **User / Session** — auth; UserRole (ADMIN, MODERATOR, USER), UserStatus enum
- **ImportJob / ImportLog** — async import tracking with progress phases
- **SystemConfig** — key-value settings table
- **AuditLog** — user action history with before/after JSON snapshots

### Background Jobs (`packages/queue`)

BullMQ queue named `import`. Job types: `FULL`, `PARTIAL_ITEMS`, `PARTIAL_RECIPES`, `ICONS_SYNC`, `REINDEX`. Progress is reported in phases: `fetching → normalizing → importing → localizations → variants → recipes → done`.

### API Structure

All REST endpoints under `/api/v1/`:
- `auth/` — login, register, logout, me, forgot-password, reset-password
- `items/` — list (paginated cursor-based), `[id]` detail, `[id]/recipe/tree`
- `admin/` — import trigger/status, stats, system config, user management (admin-only)

## Key Conventions

- **Cursor-based pagination** for items list — use `cursor` + `limit` params, returns `meta.nextCursor`.
- **Dark mode** is the default; Tailwind `dark:` classes are always active (class strategy on `<html>`).
- Admin routes require `requireAdmin()` guard; moderator routes use `requireModerator()`.
- Environment is configured via `.env` (copy from `.env.example`). Runtime config is in `nuxt.config.ts` under `runtimeConfig`.
- After any Prisma schema change, run `pnpm db:generate` before running the dev server.
