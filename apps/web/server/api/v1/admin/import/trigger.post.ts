import { z } from 'zod'
import { requireAdmin } from '~/server/utils/guards'
import { prisma } from '~/server/utils/prisma'
import { getImportQueue } from '@albion-tool/queue'

const schema = z.object({
  type: z.enum(['FULL', 'PARTIAL_ITEMS', 'PARTIAL_RECIPES', 'ICONS_SYNC', 'REINDEX']).default('FULL'),
})

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event)

  const body = await readValidatedBody(event, (b) => schema.safeParse(b))
  if (!body.success) throw createError({ statusCode: 422, statusMessage: 'Invalid input' })

  const activeJob = await prisma.importJob.findFirst({
    where: { status: { in: ['RUNNING', 'PENDING'] } },
    select: { id: true, status: true },
  })

  if (activeJob) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: `An import job is already ${activeJob.status.toLowerCase()}`,
    })
  }

  const job = await prisma.importJob.create({
    data: {
      type: body.data.type,
      status: 'PENDING',
      triggeredById: admin.id,
    },
  })

  await getImportQueue().add(
    'import',
    { jobId: job.id, type: body.data.type, triggeredById: admin.id },
    { jobId: job.id },
  )

  return {
    data: { jobId: job.id, message: `Import job ${body.data.type} queued` },
  }
})
