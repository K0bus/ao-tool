import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/guards'
import { schedulerService } from '@albion-tool/queue'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const schedules = await prisma.jobSchedule.findMany({
    orderBy: { label: 'asc' }
  })

  // Add next run time from BullMQ
  const schedulesWithNextRun = await Promise.all(
    schedules.map(async (s) => {
      const nextRunAt = await schedulerService.getNextRunTime(s.name)
      return {
        ...s,
        nextRunAt
      }
    })
  )

  return { data: schedulesWithNextRun }
})
