import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const baby = await prisma.item.findUnique({ where: { uniqueName: 'T4_FARM_GOAT_BABY' } })
  const grown = await prisma.item.findUnique({ where: { uniqueName: 'T4_FARM_GOAT_GROWN' } })
  const seed = await prisma.item.findUnique({ where: { uniqueName: 'T1_FARM_CARROT_SEED' } })

  console.log('Baby Goat:', JSON.stringify(baby, null, 2))
  console.log('Grown Goat:', JSON.stringify(grown, null, 2))
  console.log('Carrot Seed:', JSON.stringify(seed, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
