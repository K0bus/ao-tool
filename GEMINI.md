# Albion Tool — Project Context & Instructions

This document provides foundational context and instructions for the **Albion Tool** project, an advanced data platform for Albion Online focused on economy, crafting, and market analysis.

## Project Overview

Albion Tool is a monorepo built with a modern, scalable architecture designed for high-volume game data processing and real-time market tracking.

- **Primary Technologies:** Nuxt 3, Vue 3, TypeScript, Tailwind CSS, Prisma 7, PostgreSQL, Redis, BullMQ, Docker.
- **Architecture:** Monorepo managed by `pnpm` and `turbo`.
- **Core Domains:**
    - **Item & Data Engine:** Parses and normalizes game data from `ao-bin-dumps`.
    - **Pricing Engine:** (Planned) Integrates with Albion Online Data Project for market prices.
    - **Crafting Engine:** Recursive dependency tracking and profitability simulation.
    - **Admin System:** Comprehensive data management, job monitoring, and user moderation.

## Workspace Structure

- `apps/web/`: The main Nuxt 3 application (Frontend + Nitro API).
- `packages/database/`: Prisma schema and database configuration (PostgreSQL).
- `packages/ao-parser/`: Logic for fetching and normalizing game data from external sources.
- `packages/market-engine/`: Core logic for fetching market prices, tracking history, and calculating profitability.
- `packages/queue/`: Background task management using BullMQ and Redis.
- `packages/types/`: Shared TypeScript interfaces and enums used across the workspace.
- `scripts/`: Utility scripts for full data imports, icon synchronization, and background workers.
- `docker/`: Dockerfiles and configuration for PostgreSQL, Redis, Nginx, and workers.

## Tech Stack & Conventions

### Frontend & API (`apps/web`)
- **Framework:** Nuxt 3 (Nitro server engine).
- **Styling:** Tailwind CSS (Dark Mode by default).
- **State Management:** Pinia.
- **Validation:** Zod.
- **Icons:** Custom SVG components in `components/`.

### Database (`packages/database`)
- **ORM:** Prisma 7.
- **Database:** PostgreSQL.
- **Conventions:** 
    - Use CUID for model IDs.
    - Extensive use of Enums for Albion-specific classifications (e.g., `ItemType`, `UserRole`).
    - Audit logging for administrative actions.

### Background Processing (`packages/queue`)
- **Engine:** BullMQ.
- **Storage:** Redis.
- **Jobs:** Handled by a dedicated worker process in `scripts/worker/`.
- **Market Sync:** Rate limited to 180 req/min (aligned with Albion Data Project API).

### Data Parsing (`packages/ao-parser`)
- Fetches raw JSON from `ao-bin-dumps`.
- Normalizes complex game data into a flat, searchable structure suitable for the database.

### Pricing Engine (`packages/market-engine`)
- Integrates with Albion Online Data Project.
- Batching: 200 items per request.
- Historical tracking: Stores significant price changes in `MarketPriceHistory`.

## Building and Running

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

### Commands
- **Install Dependencies:** `pnpm install`
- **Infrastructure (Postgres/Redis/Minio):** `docker-compose up -d`
- **Run Web (Dev):** `npm run dev` (Runs `turbo run dev --filter=web`)
- **Database Migrations:** `npm run db:migrate` (Runs `turbo run db:migrate`)
- **Database Studio:** `npm run db:studio`
- **Run Tests:** `npm test` (Uses Vitest)
- **Full Data Import:** `npm run import:full` (Requires environment variables)
- **Market Price Sync:** `npm run import:market` (Triggers a full price update)
- **Sync Icons:** `npm run import:icons`

## Development Conventions

- **Type Safety:** Strict TypeScript everywhere. Bypassing the type system (e.g., `any`, `as`) is discouraged.
- **Clean Architecture:** Domain logic should be kept out of UI components. Prefer composables and services.
- **Modularity:** New functionality should be evaluated for placement in a shared package if it's likely to be reused by workers or other apps.
- **Security:** Use Prisma's `auditLogs` for sensitive operations. Ensure auth middleware is properly applied to admin routes.
- **Performance:** Optimize heavy database queries using search indexes (see `scripts/db/`).

## Project Roadmaps (Phases)
1. **Phase 1 (Complete):** Core Database Engine, Parser refactor, Item normalization, Crafting foundations.
2. **Phase 2 (In Progress):** Pricing Engine, Live prices, Historical data, Market dashboards.
3. **Phase 3:** Advanced Economy Tools (Flip tools, transport optimization, analytics).
4. **Phase 4:** SaaS Expansion (Subscriptions, Public API).
