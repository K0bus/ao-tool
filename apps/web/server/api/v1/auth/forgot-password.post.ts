import { z } from 'zod'
import { randomBytes } from 'node:crypto'
import { prisma } from '~/server/utils/prisma'

const schema = z.object({
  email: z.string().email(),
})

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 heure

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid input' })
  }

  // Réponse identique qu'il y ait un compte ou non (évite l'énumération)
  const genericResponse = { data: { message: 'If an account exists, a reset email has been sent' } }

  const user = await prisma.user.findUnique({
    where: { email: body.data.email.toLowerCase() },
    select: { id: true, email: true, status: true },
  })

  if (!user || user.status === 'SUSPENDED') return genericResponse

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + TOKEN_EXPIRY_MS)

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: token, resetPasswordExpires: expires },
  })

  // TODO Phase 5: Envoyer l'email via SMTP avec le token
  // await sendResetPasswordEmail(user.email, token)
  console.log(`[DEV] Reset token for ${user.email}: ${token}`)

  return genericResponse
})
