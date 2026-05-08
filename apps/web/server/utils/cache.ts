import { redis } from './redis'

const DEFAULT_TTL = 1800 // 30 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key).catch(() => null)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttl = DEFAULT_TTL
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value)).catch(() => {})
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Non-critique : si Redis est down, on continue sans cache
  }
}

// Helper pour les routes : tente le cache, sinon exécute le fn et met en cache
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = DEFAULT_TTL
): Promise<T> {
  const hit = await cacheGet<T>(key)
  if (hit !== null) return hit

  const result = await fn()
  await cacheSet(key, result, ttl)
  return result
}
