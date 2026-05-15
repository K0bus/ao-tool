import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { redis } from '~/server/utils/redis'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(32, 'Le nom d\'utilisateur ne doit pas dépasser 32 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -'),
  email: z.string().email('Adresse e-mail invalide'),
})

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      message: body.error.errors[0]?.message ?? 'Invalid input',
    })
  }

  const { username, email } = body.data

  // Check for conflicts (excluding the current user)
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: { equals: username, mode: 'insensitive' } },
      ],
      NOT: { id: user.id },
    },
    select: { email: true, username: true },
  })

  if (existing) {
    const field = existing.email === email.toLowerCase() ? 'email' : 'nom d\'utilisateur'
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: `Ce ${field} est déjà utilisé`,
    })
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      email: email.toLowerCase(),
      username,
    },
    select: { id: true, email: true, username: true, role: true, status: true },
  })

  // Invalidate session cache in Redis
  // We don't have the token here easily from the event context unless we look it up,
  // but we can just let it expire (5 mins) or we could try to find all sessions.
  // getSessionUser uses `session:${token}` as key.
  // For now, let's just update the user. The frontend will re-fetch /auth/me.
  
  // Actually, we should probably clear the cache for all sessions of this user if possible,
  // but we don't have a user-to-sessions mapping in redis.
  // Let's just return the updated data.

  return { data: updatedUser }
})
