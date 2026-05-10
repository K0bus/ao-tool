import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { KillEvent } from '@albion-tool/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing event id' })

  return cached(`pvp:event:${id}`, async () => {
    const data = await albionFetch<KillEvent>(`/events/${id}`)
    return { data }
  }, 300)
})
