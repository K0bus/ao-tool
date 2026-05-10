import { decodeGuestBuild } from '~/server/utils/buildShare'

export default defineEventHandler(async (event) => {
  const encoded = getRouterParam(event, 'encoded')
  if (!encoded) throw createError({ statusCode: 400, statusMessage: 'Missing encoded build' })

  const payload = decodeGuestBuild(encoded)
  if (!payload) throw createError({ statusCode: 400, statusMessage: 'Invalid or corrupted build share link' })

  return { data: payload }
})
