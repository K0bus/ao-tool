import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// En Prisma 7, la CLI exige une URL dans le config.
// Pas de fallback ici pour forcer Prisma à utiliser DATABASE_URL de l'environnement.
const DATABASE_URL = process.env.DATABASE_URL

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: DATABASE_URL,
  },
  migrate: {
    async adapter(env) {
      const { default: pg } = await import('pg')
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
      return new PrismaPg(pool)
    },
  },
})
