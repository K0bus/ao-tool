import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
  migrate: {
    async adapter(env) {
      const { default: pg } = await import('pg')
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new pg.Pool({ connectionString: env.DATABASE_URL as string })
      return new PrismaPg(pool)
    },
  },
})
