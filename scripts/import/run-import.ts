import { prisma, type ItemType } from '@albion-tool/database'
import { fetchAoData, fetchLatestCommit, normalizeItem, normalizeBuilding, fetchSpells } from '@albion-tool/ao-parser'
import type { NormalizedCraftSpell, NormalizedItem, NormalizedSpell, NormalizedBuilding } from '@albion-tool/ao-parser'
import type { ImportJobProgress, ImportJobResult, ImportJobType } from '@albion-tool/queue'

const BATCH_SIZE = 500

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

function inferItemSpellLinks(
  itemId: string,
  craftSpells: NormalizedCraftSpell[],
  spellKindById: Map<string, NormalizedSpell['spellKind']>,
) {
  let nextActiveSlot = 1

  return craftSpells
    .filter((cs) => cs.uniqueName)
    .map((cs) => {
      const explicitSlot = cs.slots ? parseInt(cs.slots, 10) : null
      const spellKind = spellKindById.get(cs.uniqueName)

      let slotNumber: number | null = null
      if (explicitSlot !== null && !isNaN(explicitSlot)) {
        slotNumber = explicitSlot
      } else if (spellKind === 'passive') {
        slotNumber = null
      } else if (nextActiveSlot <= 3) {
        slotNumber = nextActiveSlot++
      }

      return {
        itemId,
        spellId: cs.uniqueName,
        slotNumber,
        tag: cs.tag,
      }
    })
    .filter((link) => link.slotNumber === null || !isNaN(link.slotNumber))
}

// Déduit un nom lisible depuis l'ID de station (ex: ARMORSMITH_LEVEL1_BUILDING → "Armorsmith")
function stationNameFromId(id: string): string {
  const base = id
    .replace(/_LEVEL\d+_BUILDING$/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return base || id
}

function catId(cat: string, sub?: string): string {
  return sub ? `cat_${cat}_${sub}` : `cat_${cat}`
}

function catSlug(cat: string, sub?: string): string {
  return sub ? `${cat}-${sub}` : cat
}

function toTitleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function stationTypeFromId(id: string): string {
  const upper = id.toUpperCase()
  if (upper.startsWith('SMELTER')) return 'REFINING'
  if (upper.startsWith('TANNER')) return 'REFINING'
  if (upper.startsWith('WEAVER')) return 'REFINING'
  if (upper.startsWith('LUMBERMILL')) return 'REFINING'
  if (upper.startsWith('STONEMASON')) return 'REFINING'
  return 'CRAFTING'
}

export async function runImport(
  jobId: string,
  type: ImportJobType,
  onProgress?: (p: ImportJobProgress) => void | Promise<void>,
): Promise<ImportJobResult> {
  const startedAt = Date.now()

  const report = (phase: ImportJobProgress['phase'], processed: number, total: number) =>
    onProgress?.({ phase, processed, total, percent: total > 0 ? Math.round((processed / total) * 100) : 0 })

  const logInfo = (msg: string, context?: object) =>
    prisma.importLog.create({ data: { jobId, level: 'INFO', message: msg, context } }).catch(() => {})

  const logError = (msg: string, context?: object) =>
    prisma.importLog.create({ data: { jobId, level: 'ERROR', message: msg, context } }).catch(() => {})

  let itemsProcessed = 0, itemsCreated = 0, itemsUpdated = 0, itemsSkipped = 0, itemsFailed = 0

  try {
    // ── Phase 1: Fetch ───────────────────────────────────────────────────────
    await report('fetching', 0, 0)
    await logInfo('Fetching ao-bin-dumps data (items.json)...')

    const [{ items: rawItems, buildings: rawBuildings, localizations }, sourceCommit] = await Promise.all([
      fetchAoData(),
      fetchLatestCommit(),
    ])

    await prisma.importJob.update({
      where: { id: jobId },
      data: { sourceCommit, sourceUrl: 'https://github.com/ao-data/ao-bin-dumps' },
    })

    await logInfo(`Fetched ${rawItems.length} base items (commit: ${sourceCommit})`)

    // ── Phase 2: Normalize ──────────────────────────────────────────────────
    // normalizeItem retourne un tableau : [base, @1, @2, @3, ...]
    // On aplatit tous les items (variants enchantés inclus) en un seul tableau.
    await report('normalizing', 0, rawItems.length)

    const itemIndex = new Map(rawItems.map((item) => [item['@uniquename'], item]))
    const normalized: NormalizedItem[] = []
    for (const raw of rawItems) {
      try {
        normalized.push(...normalizeItem(raw, localizations, itemIndex))
      } catch {
        itemsFailed++
      }
    }

    await logInfo(`Normalized ${normalized.length} items (${rawItems.length} base items + variants)`)

    // ── Phase 3: Categories ─────────────────────────────────────────────────
    await report('categories', 0, 0)
    await logInfo('Importing shop categories...')

    const enUs = localizations['EN-US'] ?? {}
    const resolveCatName = (cat: string) =>
      enUs[`@MARKETPLACEGUI_ROLLOUT_SHOPCATEGORY_${cat.toUpperCase()}`] ?? toTitleCase(cat)
    const resolveSubName = (sub: string) =>
      enUs[`@MARKETPLACEGUI_ROLLOUT_SHOPSUBCATEGORY_${sub.toUpperCase()}`] ?? toTitleCase(sub)

    const parentCats = new Map<string, { slug: string; nameEn: string; rawCat: string }>()
    const childCats = new Map<string, { slug: string; parentId: string; nameEn: string; rawSub: string }>()

    for (const item of normalized) {
      if (!item.shopCategory) continue
      const cat = item.shopCategory
      const sub = item.shopSubcategory

      const pId = catId(cat)
      if (!parentCats.has(pId)) {
        parentCats.set(pId, { slug: catSlug(cat), nameEn: resolveCatName(cat), rawCat: cat })
      }
      if (sub) {
        const cId = catId(cat, sub)
        if (!childCats.has(cId)) {
          childCats.set(cId, { slug: catSlug(cat, sub), parentId: pId, nameEn: resolveSubName(sub), rawSub: sub })
        }
      }
    }

    for (const [id, { slug, nameEn }] of parentCats) {
      await prisma.category.upsert({
        where: { id },
        create: { id, slug, nameEn },
        update: { nameEn },
      }).catch(() => {})
    }
    for (const [id, { slug, parentId, nameEn }] of childCats) {
      await prisma.category.upsert({
        where: { id },
        create: { id, slug, nameEn, parentId },
        update: { nameEn, parentId },
      }).catch(() => {})
    }

    // ── Localizations pour chaque catégorie ────────────────────────────────
    const locEntries = Object.entries(localizations).filter(([l]) => l !== 'ForceTranslationByKey')
    for (const [locale, table] of locEntries) {
      const rows: { categoryId: string; locale: string; name: string }[] = []

      for (const [id, { rawCat }] of parentCats) {
        const name = table[`@MARKETPLACEGUI_ROLLOUT_SHOPCATEGORY_${rawCat.toUpperCase()}`]
        if (name) rows.push({ categoryId: id, locale, name })
      }
      for (const [id, { rawSub }] of childCats) {
        const name = table[`@MARKETPLACEGUI_ROLLOUT_SHOPSUBCATEGORY_${rawSub.toUpperCase()}`]
        if (name) rows.push({ categoryId: id, locale, name })
      }

      if (rows.length > 0) {
        await prisma.$transaction(
          rows.map((r) =>
            prisma.categoryLocalization.upsert({
              where: { categoryId_locale: { categoryId: r.categoryId, locale: r.locale } },
              create: r,
              update: { name: r.name },
            })
          )
        ).catch(() => {})
      }
    }

    await logInfo(`Imported ${parentCats.size} parent categories and ${childCats.size} subcategories`)
    await report('categories', parentCats.size + childCats.size, parentCats.size + childCats.size)

    // ── Phase 4: Item upsert ─────────────────────────────────────────────────
    const batches = chunk(normalized, BATCH_SIZE)
    for (const batch of batches) {
      for (const item of batch) {
        itemsProcessed++
        try {
          const existing = await prisma.item.findUnique({
            where: { uniqueName: item.uniqueName },
            select: { dataHash: true },
          })

          if (existing?.dataHash === item.dataHash) {
            itemsSkipped++
            continue
          }

          const isCreate = !existing
          const statsJson = Object.keys(item.stats).length > 0 ? item.stats : undefined
          const spellsJson = item.craftSpells.length > 0 ? item.craftSpells : undefined
          const itemCategoryId = item.shopCategory
            ? catId(item.shopCategory, item.shopSubcategory)
            : undefined

          await prisma.item.upsert({
            where: { uniqueName: item.uniqueName },
            create: {
              id: item.uniqueName,
              uniqueName: item.uniqueName,
              tier: item.tier,
              enchantmentLevel: item.enchantmentLevel,
              itemType: item.itemType as ItemType,
              shopCategory: item.shopCategory,
              shopSubcategory: item.shopSubcategory,
              shopSubcategory2: item.shopSubcategory2,
              categoryId: itemCategoryId,
              weight: item.weight,
              maxStackSize: item.maxStackSize,
              maxQuality: item.maxQuality,
              canBeOvercharged: item.canBeOvercharged,
              isCraftable: item.isCraftable,
              isRefinable: item.isRefinable,
              stats: statsJson as any,
              craftSpells: spellsJson as any,
              iconUrl: item.iconUrl,
              dataHash: item.dataHash,
              importedAt: new Date(),
              growTime: item.growTime,
              harvestLootList: item.harvestLootList,
              harvestSeedChance: item.harvestSeedChance,
              grownItemUniqueName: item.grownItemUniqueName,
              offspringChance: item.offspringChance,
              productLootList: item.productLootList,
              productProductionTime: item.productProductionTime,
              favoriteFoodItemId: item.favoriteFoodItemId,
              nutritionMax: item.nutritionMax,
            },
            update: {
              tier: item.tier,
              enchantmentLevel: item.enchantmentLevel,
              itemType: item.itemType as ItemType,
              shopCategory: item.shopCategory,
              shopSubcategory: item.shopSubcategory,
              shopSubcategory2: item.shopSubcategory2,
              categoryId: itemCategoryId,
              weight: item.weight,
              maxStackSize: item.maxStackSize,
              maxQuality: item.maxQuality,
              canBeOvercharged: item.canBeOvercharged,
              isCraftable: item.isCraftable,
              isRefinable: item.isRefinable,
              stats: statsJson as any,
              craftSpells: spellsJson as any,
              iconUrl: item.iconUrl,
              dataHash: item.dataHash,
              importedAt: new Date(),
              growTime: item.growTime,
              harvestLootList: item.harvestLootList,
              harvestSeedChance: item.harvestSeedChance,
              grownItemUniqueName: item.grownItemUniqueName,
              offspringChance: item.offspringChance,
              productLootList: item.productLootList,
              productProductionTime: item.productProductionTime,
              favoriteFoodItemId: item.favoriteFoodItemId,
              nutritionMax: item.nutritionMax,
            },
          })

          isCreate ? itemsCreated++ : itemsUpdated++
        } catch (err) {
          itemsFailed++
          await logError(`Failed to import item ${item.uniqueName}`, { error: String(err) })
        }
      }

      await report('importing', itemsProcessed, normalized.length)
    }

    // ── Phase 4: Localizations ──────────────────────────────────────────────
    await logInfo('Importing localizations...')
    let locDone = 0
    for (const item of normalized) {
      locDone++
      if (item.localizations.length === 0) continue
      try {
        await prisma.$transaction(
          item.localizations.map((loc) =>
            prisma.itemLocalization.upsert({
              where: { itemId_locale: { itemId: item.uniqueName, locale: loc.locale } },
              create: { itemId: item.uniqueName, locale: loc.locale, name: loc.name, description: loc.description },
              update: { name: loc.name, description: loc.description },
            })
          )
        )
      } catch { /* non-critical */ }
      if (locDone % 500 === 0) await report('localizations', locDone, normalized.length)
    }
    await report('localizations', locDone, normalized.length)

    // ── Phase 5: Enchantment variant links ──────────────────────────────────
    await logInfo('Resolving enchantment variants...')
    let varDone = 0
    for (const item of normalized) {
      varDone++
      if (!item.baseItemUniqueName) continue
      try {
        const base = await prisma.item.findUnique({
          where: { uniqueName: item.baseItemUniqueName },
          select: { id: true },
        })
        if (base) {
          await prisma.item.update({
            where: { uniqueName: item.uniqueName },
            data: { baseItemId: base.id },
          })
        }
      } catch { /* non-critical */ }
    }
    await report('variants', varDone, normalized.length)

    await report('buildings', 0, rawBuildings.length)
    await logInfo(`Importing ${rawBuildings.length} buildings...`)

    const normalizedBuildings = rawBuildings.map((b) => normalizeBuilding(b, b.category, localizations))

    for (const b of normalizedBuildings) {
      await prisma.craftingStation.upsert({
        where: { id: b.uniqueName },
        create: {
          id: b.uniqueName,
          name: b.name,
          type: b.type,
          tier: b.tier,
          description: b.description,
          capability: b.capability,
          iconUrl: b.iconUrl,
          nutritionStorage: b.nutritionStorage,
          favoriteDishItemId: b.favoriteDishItemId,
          favoriteDishBonus: b.favoriteDishBonus,
        },
        update: {
          name: b.name,
          type: b.type,
          tier: b.tier,
          description: b.description,
          capability: b.capability,
          iconUrl: b.iconUrl,
          nutritionStorage: b.nutritionStorage,
          favoriteDishItemId: b.favoriteDishItemId,
          favoriteDishBonus: b.favoriteDishBonus,
        },
      })
    }

    // Pass 2: Update relations and requirements (now that all buildings exist)
    const allBuildingIds = new Set(normalizedBuildings.map((b) => b.uniqueName))
    for (const b of normalizedBuildings) {
      if (b.nextTierBuildingId && allBuildingIds.has(b.nextTierBuildingId)) {
        await prisma.craftingStation.update({
          where: { id: b.uniqueName },
          data: {
            nextTierBuildingId: b.nextTierBuildingId,
          },
        }).catch(() => {})
      }

      if (b.requirements.length > 0) {
        await prisma.buildingRequirement.deleteMany({ where: { buildingId: b.uniqueName } })
        await prisma.buildingRequirement.createMany({
          data: b.requirements.map((r) => ({
            buildingId: b.uniqueName,
            itemId: r.uniqueName,
            count: r.count,
          })),
        })
      }
    }
    await report('buildings', rawBuildings.length, rawBuildings.length)

    // ── Phase 7: Crafting recipes ───────────────────────────────────────────
    // On utilise delete + create dans une transaction pour garantir que les ingrédients
    // sont toujours à jour (un simple upsert du metadata ne touche pas aux ingrédients).
    const craftable = normalized.filter((i) => i.craftingRecipe)
    await logInfo(`Importing ${craftable.length} crafting recipes...`)
    let recipeDone = 0
    for (const item of craftable) {
      recipeDone++
      try {
        await prisma.$transaction(async (tx) => {
          await tx.craftingRecipe.deleteMany({ where: { resultItemId: item.uniqueName } })
          await tx.craftingRecipe.create({
            data: {
              resultItemId: item.uniqueName,
              craftingStationId: item.craftingRecipe!.craftingStationId,
              resultCount: item.craftingRecipe!.resultCount,
              craftingFame: item.craftingRecipe!.craftingFame,
              silverCost: item.craftingRecipe!.silverCost,
              ingredients: {
                create: item.craftingRecipe!.ingredients
                  .filter((ing) => ing.uniqueName)
                  .map((ing) => ({
                    itemId: ing.uniqueName,
                    quantity: ing.quantity,
                    maxReturnRate: ing.maxReturnRate,
                  })),
              },
            },
          })
        })
      } catch (err) {
        await logError(`Failed to import crafting recipe for ${item.uniqueName}`, { error: String(err) })
      }

      if (recipeDone % 100 === 0) await report('recipes', recipeDone, craftable.length)
    }
    await report('recipes', recipeDone, craftable.length)

    // ── Phase 8: Refining recipes ───────────────────────────────────────────
    const refinable = normalized.filter((i) => i.refiningRecipe)
    await logInfo(`Importing ${refinable.length} refining recipes...`)
    let refiningDone = 0
    for (const item of refinable) {
      refiningDone++
      try {
        await prisma.$transaction(async (tx) => {
          await tx.refiningRecipe.deleteMany({ where: { resultItemId: item.uniqueName } })
          await tx.refiningRecipe.create({
            data: {
              resultItemId: item.uniqueName,
              craftingStationId: item.refiningRecipe!.craftingStationId,
              resultCount: item.refiningRecipe!.resultCount,
              ingredients: {
                create: item.refiningRecipe!.ingredients
                  .filter((ing) => ing.uniqueName)
                  .map((ing) => ({
                    itemId: ing.uniqueName,
                    quantity: ing.quantity,
                    maxReturnRate: ing.maxReturnRate,
                  })),
              },
            },
          })
        })
      } catch (err) {
        await logError(`Failed to import refining recipe for ${item.uniqueName}`, { error: String(err) })
      }

      if (refiningDone % 100 === 0) await report('refining', refiningDone, refinable.length)
    }
    await report('refining', refiningDone, refinable.length)

    // ── Phase 9: Spells ─────────────────────────────────────────────────────
    await report('spells', 0, 0)
    await logInfo('Fetching and importing spells...')

    let spellsCreated = 0, spellsUpdated = 0
    let normalizedSpells: NormalizedSpell[] = []
    try {
      normalizedSpells = await fetchSpells(localizations)
      await report('spells', 0, normalizedSpells.length)
      const spellBatches = chunk(normalizedSpells, BATCH_SIZE)

      for (const batch of spellBatches) {
        for (const spell of batch) {
          try {
            const existing = await prisma.spell.findUnique({
              where: { id: spell.uniqueName },
              select: { id: true },
            })

            await prisma.spell.upsert({
              where: { id: spell.uniqueName },
              create: {
                id: spell.uniqueName,
                spellKind: spell.spellKind,
                icon: spell.icon,
                category: spell.category,
                uiType: spell.uiType,
                cooldown: spell.cooldown,
                energyCost: spell.energyCost,
                castTime: spell.castTime,
                channelDuration: spell.channelDuration,
                range: spell.range,
                nameLocaTag: spell.nameLocaTag,
                descriptionLocaTag: spell.descriptionLocaTag,
                rawData: spell.rawData,
              },
              update: {
                spellKind: spell.spellKind,
                icon: spell.icon,
                category: spell.category,
                uiType: spell.uiType,
                cooldown: spell.cooldown,
                energyCost: spell.energyCost,
                castTime: spell.castTime,
                channelDuration: spell.channelDuration,
                range: spell.range,
                nameLocaTag: spell.nameLocaTag,
                descriptionLocaTag: spell.descriptionLocaTag,
                rawData: spell.rawData,
              },
            })

            existing ? spellsUpdated++ : spellsCreated++

            // Localisations des spells (non-critique)
            if (spell.localizations.length > 0) {
              await prisma.$transaction(
                spell.localizations.map((loc) =>
                  prisma.spellLocalization.upsert({
                    where: { spellId_locale: { spellId: spell.uniqueName, locale: loc.locale } },
                    create: { spellId: spell.uniqueName, locale: loc.locale, name: loc.name, description: loc.description },
                    update: { name: loc.name, description: loc.description },
                  })
                )
              ).catch(() => {})
            }
          } catch (err) {
            await logError(`Failed to import spell ${spell.uniqueName}`, { error: String(err) })
          }
        }
        await report('spells', spellsCreated + spellsUpdated, normalizedSpells.length)
      }

      await logInfo(`Imported spells: ${spellsCreated} created, ${spellsUpdated} updated`)
    } catch (err) {
      await logError('Spell import failed', { error: String(err) })
    }
    await report('spells', normalizedSpells.length, normalizedSpells.length)

    // ── Phase 10: Item → Spell links ────────────────────────────────────────
    await report('item_spells', 0, normalized.length)
    await logInfo('Linking items to their spells (craftingspelllist)...')

    const spellKindById = new Map(normalizedSpells.map((spell) => [spell.uniqueName, spell.spellKind]))
    let linksDone = 0
    for (const item of normalized) {
      linksDone++
      if (item.craftSpells.length === 0) continue

      try {
        // Supprimer les anciens liens pour cet item puis recréer
        await prisma.itemSpell.deleteMany({ where: { itemId: item.uniqueName } })

        const links = inferItemSpellLinks(item.uniqueName, item.craftSpells, spellKindById)

        if (links.length > 0) {
          // createMany + skipDuplicates en cas de doublon @uniquename dans craftSpells
          await prisma.itemSpell.createMany({ data: links, skipDuplicates: true }).catch(() => {})
        }
      } catch { /* non-critique */ }

      if (linksDone % 500 === 0) await report('item_spells', linksDone, normalized.length)
    }
    await report('item_spells', linksDone, normalized.length)
    await logInfo(`Item-spell links done for ${linksDone} items`)

    // ── Done ────────────────────────────────────────────────────────────────
    const durationMs = Date.now() - startedAt
    const result: ImportJobResult = {
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      itemsSkipped,
      itemsFailed,
      durationMs,
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: itemsFailed > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
        completedAt: new Date(),
        ...result,
      },
    })

    await report('done', normalized.length, normalized.length)
    return result
  } catch (err) {
    const durationMs = Date.now() - startedAt

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        durationMs,
        errorMessage: String(err),
        itemsProcessed,
        itemsFailed,
      },
    })

    throw err
  }
}
