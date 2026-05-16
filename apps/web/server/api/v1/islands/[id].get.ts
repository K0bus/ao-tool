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
      buildings: {
        include: {
          building: true,
          resources: {
            include: {
              item: {
                include: {
                  localizations: { where: { locale: 'FR-FR' }, take: 1 }
                }
              }
            }
          },
          laborers: true
        }
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
      buildings: island.buildings.map(b => ({
        ...b,
        buildingName: b.building?.name, 
        buildingIcon: b.building?.uiBuildMenuTexture 
          ? `/game_assets/${b.building.uiBuildMenuTexture.toLowerCase()}.png` 
          : b.building?.iconUrl, 
        tier: b.building?.tier,
        resources: b.resources.map(r => ({
          ...r,
          itemName: r.item?.localizations[0]?.name ?? r.itemId
        }))
      }))
    } 
  }
})
