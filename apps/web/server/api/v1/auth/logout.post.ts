import { getSessionToken, deleteSession, clearSessionCookie } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = getSessionToken(event)

  if (token) {
    await deleteSession(token)
  }

  clearSessionCookie(event)

  return { data: { message: 'Logged out successfully' } }
})
