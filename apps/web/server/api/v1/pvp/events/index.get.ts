import { z } from 'zod'
import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { KillEvent } from '@albion-tool/types'

const schema = z.object({
  limit: z.coerce.number().int().min(1).max(51).default(51),
  offset: z.coerce.number().int().min(0).default(0),
  guildId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const result = await getValidatedQuery(event, (q) => schema.safeParse(q))
  if (!result.success) throw createError({ statusCode: 422, statusMessage: 'Invalid query' })

  const { limit, offset, guildId } = result.data
  const key = `pvp:events:${limit}:${offset}:${guildId ?? 'all'}`

  return cached(key, async () => {
    const path = guildId
      ? `/guilds/${guildId}/kills?limit=${limit}&offset=${offset}`
      : `/events?limit=${limit}&offset=${offset}`
    const data = await albionFetch<KillEvent[]>(path)
    return { data }
  }, 30)
})
