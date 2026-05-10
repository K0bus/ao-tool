import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { Guild } from '@albion-tool/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing guild id' })

  return cached(`pvp:guild:${id}`, async () => {
    const [info, data] = await Promise.all([
      albionFetch<Guild>(`/guilds/${id}`),
      albionFetch<{ killFame?: number; deathFame?: number }>(`/guilds/${id}/data`).catch(() => ({})),
    ])
    return {
      data: {
        ...info,
        killFame: (data as Record<string, number>).killFame,
        deathFame: (data as Record<string, number>).deathFame,
      },
    }
  }, 120)
})
