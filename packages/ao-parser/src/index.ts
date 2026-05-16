export { fetchAoData, fetchLatestCommit, fetchSpells } from './fetcher'
export type { AoRawData } from './fetcher'
export { normalizeItem } from './normalizers/item'
export { normalizeBuilding } from './normalizers/building'
export { normalizeSpell } from './normalizers/spell'
export type {
  NormalizedItem,
  NormalizedRecipe,
  NormalizedIngredient,
  NormalizedCraftSpell,
  NormalizedSpell,
  NormalizedItemSpellLink,
  ItemStats,
  RawBaseItem,
  NormalizedBuilding,
  RawBuilding,
} from './types'
