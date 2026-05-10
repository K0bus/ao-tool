import { z } from 'zod'
import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'

const schema = z.object({
  q: z.string().min(1).max(100),
})

export default defineEventHandler(async (event) => {
  const result = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Invalid query' })

  const { q } = result.data
  const key = `pvp:search:${q.toLowerCase()}`

  return cached(key, async () => {
    const data = await albionFetch<{ guilds: unknown[]; players: unknown[] }>(`/search?q=${encodeURIComponent(q)}`)
    return { data }
  }, 60)
})
