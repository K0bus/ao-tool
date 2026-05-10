import { z } from 'zod'
import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { KillEvent } from '@albion-tool/types'

const schema = z.object({
  range: z.enum(['day', 'week', 'month', 'lastWeek', 'lastMonth']).default('week'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing guild id' })

  const result = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Invalid query' })

  const { range, limit } = result.data
  const key = `pvp:guild:${id}:top:${range}:${limit}`

  return cached(key, async () => {
    const data = await albionFetch<KillEvent[]>(`/guilds/${id}/top?range=${range}&limit=${limit}`)
    return { data }
  }, 120)
})
