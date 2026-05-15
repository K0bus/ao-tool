import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/guards'
import { schedulerService } from '@albion-tool/queue'
import { z } from 'zod'

const updateSchema = z.object({
  cron: z.string().optional(),
  enabled: z.boolean().optional(),
  label: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const payload = updateSchema.parse(body)

  const schedule = await prisma.jobSchedule.update({
    where: { id },
    data: payload
  })

  // Sync with BullMQ
  await schedulerService.upsertSchedule(schedule.name)

  return { data: schedule }
})
