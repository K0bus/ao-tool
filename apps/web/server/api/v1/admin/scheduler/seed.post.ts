import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/guards'
import { schedulerService } from '@albion-tool/queue'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const defaultSchedules = [
    {
      name: 'albion-import-full',
      label: 'Albion Import (Full)',
      cron: '0 3 * * *',
      target: 'albion-import',
      options: { type: 'FULL' },
      enabled: true
    },
    {
      name: 'albion-market-sync',
      label: 'Market Price Sync',
      cron: '0 * * * *',
      target: 'albion-market',
      options: {},
      enabled: true
    },
    {
      name: 'albion-import-partial',
      label: 'Albion Import (Partial)',
      cron: '0 4 * * *',
      target: 'albion-import',
      options: { type: 'PARTIAL_ITEMS' },
      enabled: false
    }
  ]

  const results = []
  for (const s of defaultSchedules) {
    const schedule = await prisma.jobSchedule.upsert({
      where: { name: s.name },
      update: {},
      create: s
    })
    await schedulerService.upsertSchedule(schedule.name)
    results.push(schedule)
  }

  return { data: results }
})
