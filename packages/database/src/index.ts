import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

function createPrismaClient() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

/** True when the client matches the generated schema (Build feature, etc.). */
function prismaClientHasExpectedDelegates(client: PrismaClient): boolean {
  return typeof (client as PrismaClient & { build?: { findUnique: unknown } }).build?.findUnique === 'function'
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma
  // Dev HMR / prisma generate without restart can leave a stale singleton without newer delegates.
  if (process.env.NODE_ENV !== 'production' && cached && !prismaClientHasExpectedDelegates(cached)) {
    globalForPrisma.prisma = undefined
  }

  const client = globalForPrisma.prisma ?? createPrismaClient()

  if (!prismaClientHasExpectedDelegates(client)) {
    throw new Error(
      'Prisma Client is out of date (missing generated models). Run `pnpm db:generate` from the repo root, then restart the dev server.',
    )
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }

  return client
}

export const prisma = getPrisma()

export * from '@prisma/client'
export * from './bootstrap-data'
