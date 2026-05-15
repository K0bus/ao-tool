import { prisma } from '@albion-tool/database'
import { getSchedulerQueue } from './queues'

export const schedulerService = {
  /**
   * Syncs all enabled schedules from the database to BullMQ repeatable jobs.
   */
  async syncSchedules() {
    const queue = getSchedulerQueue()
    
    // 1. Get all existing repeatable jobs
    const repeatableJobs = await queue.getRepeatableJobs()
    
    // 2. Get all enabled schedules from DB
    const schedules = await prisma.jobSchedule.findMany({
      where: { enabled: true }
    })
    
    // 3. Remove jobs that are no longer in DB or are disabled or have different cron
    for (const job of repeatableJobs) {
      const schedule = schedules.find((s: any) => s.name === job.name)
      if (!schedule || schedule.cron !== job.pattern) {
        await queue.removeRepeatableByKey(job.key)
      }
    }
    
    // 4. Add/Update jobs from DB
    for (const schedule of schedules) {
      // Check if already exists with same cron to avoid redundant adds
      const exists = repeatableJobs.some(j => j.name === schedule.name && j.pattern === schedule.cron)
      if (!exists) {
        await queue.add(schedule.name, {
          target: schedule.target,
          options: schedule.options
        }, {
          repeat: {
            pattern: schedule.cron,
            jobId: schedule.name
          },
          jobId: `repeat-${schedule.name}`
        })
      }
    }
  },

  /**
   * Upsert a specific schedule in BullMQ.
   */
  async upsertSchedule(scheduleName: string) {
    const queue = getSchedulerQueue()
    const schedule = await prisma.jobSchedule.findUnique({
      where: { name: scheduleName }
    })

    if (!schedule) return

    // Remove existing repeatable jobs for this name
    const repeatableJobs = await queue.getRepeatableJobs()
    const existingJobs = repeatableJobs.filter(j => j.name === schedule.name)
    for (const job of existingJobs) {
      await queue.removeRepeatableByKey(job.key)
    }

    // Add if enabled
    if (schedule.enabled) {
      await queue.add(schedule.name, {
        target: schedule.target,
        options: schedule.options
      }, {
        repeat: {
          pattern: schedule.cron,
          jobId: schedule.name
        },
        jobId: `repeat-${schedule.name}`
      })
    }
  },

  /**
   * Remove a schedule from BullMQ.
   */
  async removeSchedule(scheduleName: string) {
    const queue = getSchedulerQueue()
    const repeatableJobs = await queue.getRepeatableJobs()
    const existingJobs = repeatableJobs.filter(j => j.name === scheduleName)
    for (const job of existingJobs) {
      await queue.removeRepeatableByKey(job.key)
    }
  },

  /**
   * Get the next run time for a schedule.
   */
  async getNextRunTime(name: string): Promise<Date | null> {
    const queue = getSchedulerQueue()
    const repeatableJobs = await queue.getRepeatableJobs()
    const job = repeatableJobs.find(j => j.name === name)
    return job && job.next ? new Date(job.next) : null
  }
}
