import { prisma, type ItemType } from '@albion-tool/database'
import { fetchAoData, fetchLatestCommit, normalizeItem } from '@albion-tool/ao-parser'
import type { NormalizedItem } from '@albion-tool/ao-parser'
import type { ImportJobProgress, ImportJobResult, ImportJobType } from '@albion-tool/queue'

const BATCH_SIZE = 500

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
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

    const [{ items: rawItems, localizations }, sourceCommit] = await Promise.all([
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

    const normalized: NormalizedItem[] = []
    for (const raw of rawItems) {
      try {
        normalized.push(...normalizeItem(raw, localizations))
      } catch {
        itemsFailed++
      }
    }

    await logInfo(`Normalized ${normalized.length} items (${rawItems.length} base items + variants)`)

    // ── Phase 3: Item upsert ────────────────────────────────────────────────
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
              weight: item.weight,
              maxStackSize: item.maxStackSize,
              canBeOvercharged: item.canBeOvercharged,
              isCraftable: item.isCraftable,
              isRefinable: item.isRefinable,
              stats: statsJson,
              craftSpells: spellsJson,
              iconUrl: item.iconUrl,
              dataHash: item.dataHash,
              importedAt: new Date(),
            },
            update: {
              tier: item.tier,
              enchantmentLevel: item.enchantmentLevel,
              itemType: item.itemType as ItemType,
              shopCategory: item.shopCategory,
              shopSubcategory: item.shopSubcategory,
              shopSubcategory2: item.shopSubcategory2,
              weight: item.weight,
              maxStackSize: item.maxStackSize,
              canBeOvercharged: item.canBeOvercharged,
              isCraftable: item.isCraftable,
              isRefinable: item.isRefinable,
              stats: statsJson,
              craftSpells: spellsJson,
              iconUrl: item.iconUrl,
              dataHash: item.dataHash,
              importedAt: new Date(),
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

    // ── Phase 6: Crafting stations ──────────────────────────────────────────
    // On collecte toutes les stations référencées dans les recettes et on les crée
    // avant d'importer les recettes (sinon FK constraint → toutes les recettes échouent).
    const allStationIds = new Set<string>()
    for (const item of normalized) {
      if (item.craftingRecipe?.craftingStationId) allStationIds.add(item.craftingRecipe.craftingStationId)
      if (item.refiningRecipe?.craftingStationId) allStationIds.add(item.refiningRecipe.craftingStationId)
    }

    await logInfo(`Upserting ${allStationIds.size} crafting stations...`)
    for (const stationId of allStationIds) {
      await prisma.craftingStation.upsert({
        where: { id: stationId },
        create: {
          id: stationId,
          name: stationNameFromId(stationId),
          type: stationTypeFromId(stationId),
        },
        update: {},
      }).catch(() => {})
    }

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
