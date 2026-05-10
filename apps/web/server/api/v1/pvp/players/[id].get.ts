import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { Player, KillEvent } from '@albion-tool/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing player id' })

  return cached(`pvp:player:${id}`, async () => {
    const [player, recentKills, recentDeaths] = await Promise.all([
      albionFetch<Player>(`/players/${id}`),
      albionFetch<KillEvent[]>(`/players/${id}/kills`).catch(() => []),
      albionFetch<KillEvent[]>(`/players/${id}/deaths`).catch(() => []),
    ])
    return {
      data: {
        ...player,
        recentKills,
        recentDeaths,
      },
    }
  }, 60)
})
