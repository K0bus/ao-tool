import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: path.join(__dirname, '../../../.env') })

import bcrypt from 'bcryptjs'
import { ensureBootstrapData } from './bootstrap-data'
const { hash } = bcrypt
let prismaClient: Awaited<ReturnType<typeof import('./index')>>['prisma'] | null = null

async function main() {
  const { prisma } = await import('./index')
  prismaClient = prisma
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@albion-tool.com'
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme'

  const passwordHash = await hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  await prisma.$transaction(async (tx) => {
    await ensureBootstrapData(tx)
  })

  console.log('Seed completed successfully.')
}

main()
  .catch(console.error)
  .finally(async () => {
    if (prismaClient) {
      await prismaClient.$disconnect()
    }
  })
