import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { redis } from '~/server/utils/redis'
import { getSessionToken } from '~/server/utils/auth'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
    .max(32, 'Le nom d\'utilisateur ne doit pas dépasser 32 caractères')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, _ et -'),
  email: z.string().email('Adresse e-mail invalide'),
  avatar: z.string().optional().nullable(),
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

  const { username, email, avatar } = body.data

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
      avatar,
    },
    select: { id: true, email: true, username: true, role: true, status: true, avatar: true },
  })

  // Invalidate session cache in Redis
  const token = getSessionToken(event)
  if (token) {
    await redis.del(`session:${token}`).catch(() => {})
  }

  return { data: updatedUser }
})
