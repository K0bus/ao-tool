import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { hashPassword, verifyPassword } from '~/server/utils/auth'

const schema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe est trop long'),
})

export default defineEventHandler(async (event) => {
  const sessionUser = requireAuth(event)
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      message: body.error.errors[0]?.message ?? 'Données invalides',
    })
  }

  const { currentPassword, newPassword } = body.data

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { passwordHash: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Utilisateur non trouvé',
    })
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: 'Le mot de passe actuel est incorrect',
    })
  }

  const newPasswordHash = await hashPassword(newPassword)

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: newPasswordHash },
  })

  return { data: { message: 'Mot de passe mis à jour avec succès' } }
})
