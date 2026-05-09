<template>
  <div>
    <div class="page-header flex items-center justify-between">
      <div>
        <h1 class="page-title">Market Sync Jobs</h1>
        <p class="page-subtitle">Real-time price synchronization history</p>
      </div>
      <button class="btn-primary text-sm" :disabled="triggering || !!activeJobId" @click="triggerMarketSync">
        {{ triggering ? 'Queuing...' : activeJobId ? 'Sync running...' : 'Run Market Sync' }}
      </button>
    </div>

    <!-- Progress indicator -->
    <div v-if="activeJobId && activeJob" class="mb-5 card p-4 border-l-4 border-primary-500">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="text-sm font-medium text-primary-300">
            Market sync is {{ activeJob.status.toLowerCase() }}
          </span>
          <span class="text-xs text-gray-500">{{ activeJob.type }}</span>
        </div>
        <span class="text-xs text-gray-400 font-mono">
          {{ progressPercent }}%
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-2 bg-surface-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary-500 rounded-full transition-all duration-500"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <div class="flex justify-between mt-2 text-xs text-gray-500">
        <span>{{ activeJob.itemsUpdated.toLocaleString() }} / {{ activeJob.itemsRequested.toLocaleString() }} items updated</span>
        <span v-if="activeJob.itemsFailed > 0" class="text-red-400">{{ activeJob.itemsFailed }} failed</span>
      </div>
    </div>

    <!-- Jobs table -->
    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-surface-700 text-xs text-gray-500">
            <th class="text-left px-4 py-3 font-medium">Status</th>
            <th class="text-left px-4 py-3 font-medium">Type</th>
            <th class="text-right px-4 py-3 font-medium hidden sm:table-cell">Started</th>
            <th class="text-right px-4 py-3 font-medium hidden md:table-cell">Duration</th>
            <th class="text-right px-4 py-3 font-medium">Progress</th>
            <th class="text-left px-4 py-3 font-medium hidden lg:table-cell">Triggered By</th>
          </tr>
        </thead>
        <tbody v-if="loading" class="divide-y divide-surface-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><div class="h-5 bg-surface-700 rounded w-20" /></td>
            <td class="px-4 py-3"><div class="h-4 bg-surface-800 rounded w-24" /></td>
            <td class="px-4 py-3 hidden sm:table-cell"><div class="h-4 bg-surface-800 rounded w-28 ml-auto" /></td>
            <td class="px-4 py-3 hidden md:table-cell"><div class="h-4 bg-surface-800 rounded w-16 ml-auto" /></td>
            <td class="px-4 py-3"><div class="h-4 bg-surface-800 rounded w-32 ml-auto" /></td>
            <td class="px-4 py-3 hidden lg:table-cell"><div class="h-4 bg-surface-800 rounded w-24" /></td>
          </tr>
        </tbody>
        <tbody v-else class="divide-y divide-surface-800">
          <tr v-for="job in jobs" :key="job.id" class="hover:bg-surface-800/30 transition-colors">
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                :class="statusClass(job.status)"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(job.status)" />
                {{ job.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-300">
              <span class="px-1.5 py-0.5 rounded bg-surface-700 text-[10px] font-bold">{{ job.type }}</span>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs text-right hidden sm:table-cell">
              {{ formatDate(job.startedAt ?? job.createdAt) }}
            </td>
            <td class="px-4 py-3 text-gray-400 text-xs text-right hidden md:table-cell">
              {{ job.durationMs ? formatDuration(job.durationMs) : '—' }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              <div class="flex flex-col items-end">
                <span class="text-xs text-gray-300">{{ job.itemsUpdated.toLocaleString() }} / {{ job.itemsRequested.toLocaleString() }}</span>
                <div v-if="job.itemsFailed > 0" class="text-[10px] text-red-400">
                  {{ job.itemsFailed }} errors
                </div>
              </div>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
              {{ job.triggeredBy?.username ?? 'System' }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!loading && jobs.length === 0" class="py-12 text-center text-gray-600 text-sm">
        No market sync jobs yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface MarketSyncJob {
  id: string
  type: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  itemsRequested: number
  itemsUpdated: number
  itemsFailed: number
  durationMs: number | null
  startedAt: string | null
  createdAt: string
  triggeredBy: { username: string } | null
}

const jobs = ref<MarketSyncJob[]>([])
const loading = ref(false)
const triggering = ref(false)

const activeJob = computed(() => jobs.value.find(j => j.status === 'RUNNING' || j.status === 'PENDING'))
const activeJobId = computed(() => activeJob.value?.id ?? null)

const progressPercent = computed(() => {
  if (!activeJob.value || activeJob.value.itemsRequested === 0) return 0
  return Math.round(((activeJob.value.itemsUpdated + activeJob.value.itemsFailed) / activeJob.value.itemsRequested) * 100)
})

async function loadJobs() {
  if (activeJobId.value) return // Handled by polling
  loading.value = true
  try {
    const res = await $fetch<{ data: MarketSyncJob[] }>('/api/v1/admin/market/jobs')
    jobs.value = res.data
  } finally {
    loading.value = false
  }
}

async function refreshJobs() {
  try {
    const res = await $fetch<{ data: MarketSyncJob[] }>('/api/v1/admin/market/jobs')
    jobs.value = res.data
  } catch {
    // ignore
  }
}

async function triggerMarketSync() {
  triggering.value = true
  try {
    const res = await $fetch<{ data: { jobId: string } }>('/api/v1/admin/market/sync', {
      method: 'POST',
      body: { type: 'FULL' },
    })
    await refreshJobs()
  } catch (err: any) {
    alert(err?.data?.message ?? 'Failed to trigger market sync')
  } finally {
    triggering.value = false
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(ms: number) {
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const mins = Math.floor(ms / 60000)
  const secs = ((ms % 60000) / 1000).toFixed(0)
  return `${mins}m ${secs}s`
}

function statusClass(status: string) {
  return ({
    SUCCESS: 'bg-green-500/10 text-green-400',
    RUNNING: 'bg-primary-500/10 text-primary-400',
    FAILED: 'bg-red-500/10 text-red-400',
    PENDING: 'bg-gray-600/30 text-gray-400',
  } as Record<string, string>)[status] ?? 'bg-gray-600/30 text-gray-400'
}

function statusDot(status: string) {
  return ({
    SUCCESS: 'bg-green-400',
    RUNNING: 'bg-primary-400 animate-pulse',
    FAILED: 'bg-red-400',
    PENDING: 'bg-gray-500 animate-pulse',
  } as Record<string, string>)[status] ?? 'bg-gray-500'
}

onMounted(loadJobs)

// Poll only while a sync is active — stops automatically when done
const { pause: pausePolling, resume: resumePolling } = useIntervalFn(refreshJobs, 3000, { immediate: false })
watch(activeJobId, (id) => { id ? resumePolling() : pausePolling() }, { immediate: true })
</script>
