import Redis from 'ioredis'

// BullMQ exige maxRetriesPerRequest: null — obligatoire
function createConnection(): Redis {
  return new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    lazyConnect: true,
  })
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
