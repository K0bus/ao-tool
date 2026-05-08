import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { hashPassword, invalidateUserSessions } from '~/server/utils/auth'

const schema = z.object({
  token: z.string().min(32),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: body.error.errors[0]?.message ?? 'Invalid input',
    })
  }

  const { token, password } = body.data

  const user = await prisma.user.findUnique({
    where: { resetPasswordToken: token },
    select: { id: true, resetPasswordExpires: true, status: true },
  })

  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired reset token',
    })
  }

  if (user.status === 'SUSPENDED') {
    throw createError({ statusCode: 403, statusMessage: 'Account suspended' })
  }

  const passwordHash = await hashPassword(password)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  })

  // Invalider toutes les sessions actives (changement de password = déconnexion partout)
  await invalidateUserSessions(user.id)

  return { data: { message: 'Password reset successfully. You can now sign in.' } }
})
