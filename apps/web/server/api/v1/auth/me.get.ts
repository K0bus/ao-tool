import { requireAuth } from '~/server/utils/guards'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  return { data: user }
})
