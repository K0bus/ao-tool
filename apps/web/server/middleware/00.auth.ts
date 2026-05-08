import { getSessionToken, getSessionUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const token = getSessionToken(event)
  if (!token) return

  const user = await getSessionUser(token)
  if (user) {
    event.context.user = user
  }
})
