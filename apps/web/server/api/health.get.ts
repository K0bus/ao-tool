import { prisma } from '~/server/utils/prisma'
import { redis } from '~/server/utils/redis'

export default defineEventHandler(async () => {
  const checks = {
    db: false,
    redis: false,
  }

  const [dbCheck, redisCheck] = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ])

  checks.db = dbCheck.status === 'fulfilled'
  checks.redis = redisCheck.status === 'fulfilled'

  const healthy = checks.db && checks.redis
  const status = healthy ? 'ok' : 'degraded'

  setResponseStatus(event, healthy ? 200 : 503)

  return {
    status,
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }
})
