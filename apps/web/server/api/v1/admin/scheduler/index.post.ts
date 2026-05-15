import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/guards'
import { schedulerService } from '@albion-tool/queue'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string(),
  label: z.string(),
  cron: z.string(),
  target: z.string(),
  options: z.record(z.any()).optional(),
  enabled: z.boolean().default(true),
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  
  const payload = createSchema.parse(body)

  const schedule = await prisma.jobSchedule.create({
    data: payload
  })

  // Sync with BullMQ
  await schedulerService.upsertSchedule(schedule.name)

  return { data: schedule }
})
