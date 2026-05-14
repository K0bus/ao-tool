import Redis from 'ioredis'
import { inspect } from 'node:util'

const globalForRedis = global as unknown as { redis: Redis }

function createRedisClient() {
  const config = useRuntimeConfig()
  const options = {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 2000),
  }
  const client =
    config.redisUrl && config.redisUrl !== 'redis://localhost:6379'
      ? new Redis(config.redisUrl, options)
      : new Redis({
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword || undefined,
          ...options,
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
