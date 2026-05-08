import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { hashPassword } from '~/server/utils/auth'

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username must be at most 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, _ and -'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => schema.safeParse(b))

  if (!body.success) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Validation Error',
      message: body.error.errors[0]?.message ?? 'Invalid input',
    })
  }

  const { username, email, password } = body.data

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email.toLowerCase() },
        { username: { equals: username, mode: 'insensitive' } },
      ],
    },
    select: { email: true, username: true },
  })

  if (existing) {
    const field = existing.email === email.toLowerCase() ? 'email' : 'username'
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: `This ${field} is already taken`,
    })
  }

  const passwordHash = await hashPassword(password)

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  return { data: { message: 'Account created successfully' } }
})
