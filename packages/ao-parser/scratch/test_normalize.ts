import { normalizeItem } from '../src/normalizers/item'
import { fetchAoData } from '../src/fetcher'

async function test() {
  const { items, localizations } = await fetchAoData()
  const babyGoat = items.find(i => i['@uniquename'] === 'T4_FARM_GOAT_BABY')
  const grownGoat = items.find(i => i['@uniquename'] === 'T4_FARM_GOAT_GROWN')
  const carrotSeed = items.find(i => i['@uniquename'] === 'T1_FARM_CARROT_SEED')

  if (babyGoat) {
    console.log('Baby Goat Normalized:', JSON.stringify(normalizeItem(babyGoat, localizations), null, 2))
  }
  if (grownGoat) {
    console.log('Grown Goat Normalized:', JSON.stringify(normalizeItem(grownGoat, localizations), null, 2))
  }
  if (carrotSeed) {
    console.log('Carrot Seed Normalized:', JSON.stringify(normalizeItem(carrotSeed, localizations), null, 2))
  }
}

test()
