import { prisma } from '@albion-tool/database'
import { schedulerService } from '@albion-tool/queue'

async function seed() {
  const schedules = [
    {
      name: 'albion-import-full',
      label: 'Albion Import (Full)',
      cron: '0 3 * * *', // Every day at 3 AM
      target: 'albion-import',
      options: { type: 'FULL' },
      enabled: true
    },
    {
      name: 'albion-market-sync',
      label: 'Market Price Sync',
      cron: '0 * * * *', // Every hour
      target: 'albion-market',
      options: {},
      enabled: true
    }
  ]

  for (const s of schedules) {
    await prisma.jobSchedule.upsert({
      where: { name: s.name },
      update: {},
      create: s
    })
    console.log(`Seeded schedule: ${s.name}`)
    await schedulerService.upsertSchedule(s.name)
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect())
