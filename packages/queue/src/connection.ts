import Redis from 'ioredis'
import { inspect } from 'node:util'

// BullMQ exige maxRetriesPerRequest: null — obligatoire
function createConnection(): Redis {
  const connection =
    process.env.REDIS_URL && process.env.REDIS_URL !== 'redis://localhost:6379'
      ? process.env.REDIS_URL
      : {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
        }

  const redis = new Redis(connection, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    lazyConnect: true,
  })

  redis.on('error', (err) => {
    const message =
      err instanceof Error
        ? `${err.name}: ${err.message}`
        : inspect(err, { depth: 3, breakLength: Infinity })
    console.error('[Redis Queue] Connection error:', message)
  })

  return redis
}

// Connexions séparées : BullMQ en a besoin (une pour la queue, une pour le worker)
const connections: Redis[] = []

export function getConnection(): Redis {
  const conn = createConnection()
  connections.push(conn)
  return conn
}

export async function closeAllConnections(): Promise<void> {
  await Promise.all(connections.map((c) => c.quit().catch(() => {})))
}
