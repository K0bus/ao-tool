import Redis from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis }

function createRedisClient() {
  const config = useRuntimeConfig()
  const client = new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 2000),
  })

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })

  return client
}

export const redis = globalForRedis.redis || createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}
