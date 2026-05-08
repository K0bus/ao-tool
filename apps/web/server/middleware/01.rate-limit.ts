import { redis } from '~/server/utils/redis'

const RATE_LIMIT_WINDOW = 60 // secondes
const RATE_LIMIT_MAX = 120 // requêtes par window

// Fenêtre plus stricte pour les routes auth
const AUTH_ROUTES = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/forgot-password']
const AUTH_RATE_LIMIT_MAX = 10

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  // Ne rate-limiter que les routes API
  if (!url.pathname.startsWith('/api/')) return

  const ip = getRequestIP(event) ?? 'unknown'
  const isAuthRoute = AUTH_ROUTES.some((r) => url.pathname.startsWith(r))

  const key = `rl:${isAuthRoute ? 'auth' : 'api'}:${ip}`
  const max = isAuthRoute ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX

  const count = await redis.incr(key).catch(() => 0)
  if (count === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW).catch(() => {})
  }

  if (count > max) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.',
    })
  }
})
