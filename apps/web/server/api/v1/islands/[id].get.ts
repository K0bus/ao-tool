import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/guards'
import { islandEngine } from '@albion-tool/market-engine'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })

  const island = await prisma.island.findUnique({
    where: { id },
    include: {
      plots: {
        include: {
          item: {
            include: {
              localizations: { where: { locale: 'FR-FR' }, take: 1 }
            }
          },
          laborers: true
        },
        orderBy: { position: 'asc' }
      },
      location: true
    }
  })

  if (!island || island.userId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Island not found' })
  }

  const profitability = await islandEngine.calculateIslandProfitability(id)

  return { 
    data: { 
      ...island, 
      profitability,
      plots: island.plots.map(p => ({
        ...p,
        itemName: p.item?.localizations[0]?.name ?? p.plantedItemId
      }))
    } 
  }
})
