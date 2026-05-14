import Redis from 'ioredis'
import { inspect } from 'node:util'

const globalForRedis = global as unknown as { redis: Redis }

function createRedisClient() {
  const config = useRuntimeConfig()
  const connection =
    config.redisUrl && config.redisUrl !== 'redis://localhost:6379'
      ? config.redisUrl
      : {
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword || undefined,
        }

  const client = new Redis(connection, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  })

  client.on('error', (err) => {
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : inspect(err, { depth: 3, breakLength: Infinity })
    console.error('[Redis] Connection error:', message)
  })

  return client
}

export const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}
