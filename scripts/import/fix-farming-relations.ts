import { prisma } from '@albion-tool/database'
import { fetchAoData, normalizeItem } from '@albion-tool/ao-parser'

async function main() {
  console.log('Fetching ao-bin-dumps data...')
  const { items: rawItems, localizations, loot: lootMap } = await fetchAoData()
  
  const itemIndex = new Map(rawItems.map((item) => [item['@uniquename'], item]))
  
  console.log('Normalizing and updating farming relations...')
  let updatedCount = 0
  
  for (const raw of rawItems) {
    const normalizedList = normalizeItem(raw, localizations, itemIndex, lootMap)
    for (const item of normalizedList) {
      if (item.harvestResultItemId || item.productResultItemId) {
        console.log(`Updating ${item.uniqueName}: harvestResultItemId=${item.harvestResultItemId}, productResultItemId=${item.productResultItemId}`)
        await prisma.item.update({
          where: { uniqueName: item.uniqueName },
          data: {
            harvestResultItemId: item.harvestResultItemId || null,
            productResultItemId: item.productResultItemId || null,
            // Ensure the dataHash in database is updated
            dataHash: item.dataHash
          }
        }).catch((err) => {
          console.error(`Failed to update ${item.uniqueName}:`, err.message)
        })
        updatedCount++
      }
    }
  }
  
  console.log(`Done! Updated ${updatedCount} items.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
