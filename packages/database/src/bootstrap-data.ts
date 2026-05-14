import type { Prisma } from '@prisma/client'

export const DEFAULT_LOCATIONS = [
  { id: 'Caerleon', name: 'Caerleon', type: 'ROYAL_CITY' as const },
  { id: 'Bridgewatch', name: 'Bridgewatch', type: 'ROYAL_CITY' as const },
  { id: 'FortSterling', name: 'Fort Sterling', type: 'ROYAL_CITY' as const },
  { id: 'Lymhurst', name: 'Lymhurst', type: 'ROYAL_CITY' as const },
  { id: 'Martlock', name: 'Martlock', type: 'ROYAL_CITY' as const },
  { id: 'Thetford', name: 'Thetford', type: 'ROYAL_CITY' as const },
  { id: 'Brecilien', name: 'Brecilien', type: 'ROYAL_CITY' as const },
  { id: 'BlackMarket', name: 'Black Market', type: 'OTHER' as const },
] as const

export const DEFAULT_RETURN_RATES = [
  { tier: 2, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0 },
  { tier: 3, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0 },
  { tier: 4, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 4, enchantmentLevel: 1, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 4, enchantmentLevel: 2, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 4, enchantmentLevel: 3, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 5, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 5, enchantmentLevel: 1, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 5, enchantmentLevel: 2, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 5, enchantmentLevel: 3, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 6, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 6, enchantmentLevel: 1, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 6, enchantmentLevel: 2, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 6, enchantmentLevel: 3, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 7, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 7, enchantmentLevel: 1, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 7, enchantmentLevel: 2, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 7, enchantmentLevel: 3, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 8, enchantmentLevel: 0, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 8, enchantmentLevel: 1, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 8, enchantmentLevel: 2, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
  { tier: 8, enchantmentLevel: 3, baseReturnRate: 0.15, focusReturnRate: 0.478, cityBonusRate: 0.25 },
] as const

export const DEFAULT_SYSTEM_CONFIGS = [
  {
    key: 'features',
    value: {
      market_prices: false,
      profitability_calculator: false,
      black_market: false,
      guild_tools: false,
      public_api: false,
      premium_subscription: false,
    },
    description: 'Feature flags globaux',
  },
  {
    key: 'search',
    value: {
      default_locale: 'EN-US',
      items_per_page: 48,
    },
    description: 'Configuration de la recherche',
  },
] as const

type BootstrapTx = Prisma.TransactionClient

export async function ensureBootstrapData(tx: BootstrapTx) {
  for (const loc of DEFAULT_LOCATIONS) {
    await tx.location.upsert({
      where: { id: loc.id },
      update: {},
      create: loc,
    })
  }

  for (const rr of DEFAULT_RETURN_RATES) {
    await tx.returnRate.upsert({
      where: { tier_enchantmentLevel: { tier: rr.tier, enchantmentLevel: rr.enchantmentLevel } },
      update: rr,
      create: rr,
    })
  }

  for (const config of DEFAULT_SYSTEM_CONFIGS) {
    await tx.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    })
  }
}
