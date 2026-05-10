import { cached } from '~/server/utils/cache'
import { albionFetch } from '~/server/utils/albionApi'
import type { Alliance } from '@albion-tool/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing alliance id' })

  return cached(`pvp:alliance:${id}`, async () => {
    const data = await albionFetch<Alliance>(`/alliances/${id}`)
    return { data }
  }, 180)
})
