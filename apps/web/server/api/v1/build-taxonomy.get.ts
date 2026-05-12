import { prisma } from '~/server/utils/prisma'
import {
  getDefaultBuildTaxonomy,
  normalizeFamilyOptions,
  type BuildTaxonomyResponse,
} from '~/utils/buildTaxonomy'

export default defineEventHandler(async () => {
  const defaults = getDefaultBuildTaxonomy()

  const [weaponItems, offhandItems, consumables, mounts] = await Promise.all([
    prisma.item.findMany({
      where: {
        itemType: 'WEAPON',
        shopSubcategory: { not: null },
      },
      distinct: ['shopSubcategory'],
      select: { shopSubcategory: true },
    }),
    prisma.item.findMany({
      where: {
        itemType: 'OFF_HAND',
        shopSubcategory: { not: null },
      },
      distinct: ['shopSubcategory'],
      select: { shopSubcategory: true },
    }),
    prisma.item.findMany({
      where: {
        itemType: 'CONSUMABLE',
        shopSubcategory: { not: null },
      },
      distinct: ['shopSubcategory'],
      select: { shopSubcategory: true },
    }),
    prisma.item.findMany({
      where: {
        itemType: 'MOUNT',
        shopSubcategory: { not: null },
      },
      distinct: ['shopSubcategory'],
      select: { shopSubcategory: true },
    }),
  ])

  const taxonomy: BuildTaxonomyResponse = {
    slots: {
      ...defaults.slots,
      weapon: {
        ...defaults.slots.weapon,
        families: normalizeFamilyOptions(
          [
            ...defaults.slots.weapon.families.map((family) => family.value),
            ...weaponItems.map((item) => item.shopSubcategory ?? ''),
          ],
          Object.fromEntries(defaults.slots.weapon.families.map((family) => [family.value, family.label])),
        ),
      },
      offhand: {
        ...defaults.slots.offhand,
        families: normalizeFamilyOptions(
          [
            ...defaults.slots.offhand.families.map((family) => family.value),
            ...offhandItems.map((item) => item.shopSubcategory ?? ''),
          ],
          Object.fromEntries(defaults.slots.offhand.families.map((family) => [family.value, family.label])),
        ),
      },
      food: {
        ...defaults.slots.food,
        families: normalizeFamilyOptions(
          [
            ...defaults.slots.food.families.map((family) => family.value),
            ...consumables.map((item) => item.shopSubcategory ?? ''),
          ],
          Object.fromEntries(defaults.slots.food.families.map((family) => [family.value, family.label])),
        ),
      },
      potion: {
        ...defaults.slots.potion,
        families: normalizeFamilyOptions(
          [
            ...defaults.slots.potion.families.map((family) => family.value),
            ...consumables.map((item) => item.shopSubcategory ?? ''),
          ],
          Object.fromEntries(defaults.slots.potion.families.map((family) => [family.value, family.label])),
        ),
      },
      mount: {
        ...defaults.slots.mount,
        families: normalizeFamilyOptions(
          [
            ...defaults.slots.mount.families.map((family) => family.value),
            ...mounts.map((item) => item.shopSubcategory ?? ''),
          ],
          Object.fromEntries(defaults.slots.mount.families.map((family) => [family.value, family.label])),
        ),
      },
    },
  }

  return { data: taxonomy }
})
