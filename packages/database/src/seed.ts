import { prisma } from './index'
import bcrypt from 'bcryptjs'
const { hash } = bcrypt

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@albion-tool.com'
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin'
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme'

  const passwordHash = await hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  // Locations
  const locations = [
    { id: 'Caerleon', name: 'Caerleon', type: 'ROYAL_CITY' as const },
    { id: 'Bridgewatch', name: 'Bridgewatch', type: 'ROYAL_CITY' as const },
    { id: 'FortSterling', name: 'Fort Sterling', type: 'ROYAL_CITY' as const },
    { id: 'Lymhurst', name: 'Lymhurst', type: 'ROYAL_CITY' as const },
    { id: 'Martlock', name: 'Martlock', type: 'ROYAL_CITY' as const },
    { id: 'Thetford', name: 'Thetford', type: 'ROYAL_CITY' as const },
    { id: 'Brecilien', name: 'Brecilien', type: 'ROYAL_CITY' as const },
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: {},
      create: loc,
    })
  }

  // Return rates par tier (valeurs officielles Albion)
  const returnRates = [
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
  ]

  for (const rr of returnRates) {
    await prisma.returnRate.upsert({
      where: { tier_enchantmentLevel: { tier: rr.tier, enchantmentLevel: rr.enchantmentLevel } },
      update: rr,
      create: rr,
    })
  }

  // Config système par défaut
  await prisma.systemConfig.upsert({
    where: { key: 'features' },
    update: {},
    create: {
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
  })

  await prisma.systemConfig.upsert({
    where: { key: 'search' },
    update: {},
    create: {
      key: 'search',
      value: {
        default_locale: 'EN-US',
        items_per_page: 48,
      },
      description: 'Configuration de la recherche',
    },
  })

  console.log('Seed completed successfully.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
