import type { H3Event } from 'h3'
import type { SessionUser } from './auth'

export function requireAuth(event: H3Event): SessionUser {
  const user = event.context.user as SessionUser | undefined
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

export function requireAdmin(event: H3Event): SessionUser {
  const user = requireAuth(event)
  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

export function requireModerator(event: H3Event): SessionUser {
  const user = requireAuth(event)
  if (!['ADMIN', 'MODERATOR'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
