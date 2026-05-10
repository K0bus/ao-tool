import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { GuildMember } from '@albion-tool/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing guild id' })

  return cached(`pvp:guild:${id}:members`, async () => {
    const data = await albionFetch<GuildMember[]>(`/guilds/${id}/members`)
    return { data }
  }, 180)
})
