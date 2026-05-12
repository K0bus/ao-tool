import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import {
  verifyPassword,
  createSession,
  setSessionCookie,
} from '~/server/utils/auth'

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))

  if (!body.success) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid input' })
  }

  const { email, password } = body.data
  const login = email.trim()
  const loginLower = login.toLowerCase()

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: loginLower },
        { username: { equals: login, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      email: true,
      username: true,
      passwordHash: true,
      role: true,
      status: true,
    },
  })

  // Toujours vérifier le hash pour éviter les timing attacks
  const validPassword = user
    ? await verifyPassword(password, user.passwordHash)
    : false

  if (!user || !validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials',
      message: 'Email or password is incorrect',
    })
  }

  if (user.status === 'SUSPENDED') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Account suspended',
      message: 'Your account has been suspended',
    })
  }

  const session = await createSession(
    user.id,
    getHeader(event, 'user-agent'),
    getRequestIP(event)
  )

  setSessionCookie(event, session.token)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), lastLoginIp: getRequestIP(event) },
  })

  return {
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
    },
  }
})
