<template>
  <div>
    <div class="page-header flex items-center justify-between">
      <div>
        <h1 class="page-title">Import Jobs</h1>
        <p class="page-subtitle">Data synchronization history</p>
      </div>
      <button class="btn-primary text-sm" :disabled="triggering || !!activeJobId" @click="triggerImport">
        {{ triggering ? 'Queuing...' : activeJobId ? 'Import running...' : 'Run Full Import' }}
      </button>
    </div>

    <!-- Live progress card -->
    <div v-if="activeJobId && liveStatus" class="mb-5 card p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span class="text-sm font-medium text-yellow-300">
            Import {{ liveStatus.status === 'PENDING' ? 'queued' : 'running' }}
          </span>
          <span class="text-xs text-gray-500">{{ liveStatus.type }}</span>
        </div>
        <span v-if="liveStatus.progress" class="text-xs text-gray-400 font-mono">
          {{ liveStatus.progress.phase }}
        </span>
      </div>

      <!-- Progress bar -->
      <div class="h-2 bg-surface-800 rounded-full overflow-hidden">
        <div
          class="h-full bg-yellow-400 rounded-full transition-all duration-500"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>

      <div class="flex justify-between mt-2 text-xs">
        <div class="flex items-center gap-3 text-gray-500">
          <span>{{ liveStatus.progress ? `${liveStatus.progress.processed.toLocaleString()} / ${liveStatus.progress.total.toLocaleString()} items` : 'Waiting for worker...' }}</span>
          <span v-if="durationSeconds > 0" class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatDuration(durationSeconds) }}
          </span>
          <span v-if="estimatedRemainingSeconds !== null" class="text-blue-400/80">
            ~{{ formatDuration(estimatedRemainingSeconds) }} left
          </span>
        </div>
        <span class="text-gray-500 font-medium">{{ progressPercent }}%</span>
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
            <th class="text-right px-4 py-3 font-medium hidden md:table-cell">Results</th>
            <th class="text-right px-4 py-3 font-medium">Commit</th>
          </tr>
        </thead>
        <tbody v-if="loading" class="divide-y divide-surface-800">
          <tr v-for="i in 5" :key="i" class="animate-pulse">
            <td class="px-4 py-3"><div class="h-5 bg-surface-700 rounded w-20" /></td>
            <td class="px-4 py-3"><div class="h-4 bg-surface-800 rounded w-24" /></td>
            <td class="px-4 py-3 hidden sm:table-cell"><div class="h-4 bg-surface-800 rounded w-28 ml-auto" /></td>
            <td class="px-4 py-3 hidden md:table-cell"><div class="h-4 bg-surface-800 rounded w-16 ml-auto" /></td>
            <td class="px-4 py-3 hidden md:table-cell"><div class="h-4 bg-surface-800 rounded w-24 ml-auto" /></td>
            <td class="px-4 py-3"><div class="h-4 bg-surface-800 rounded w-16 ml-auto" /></td>
          </tr>
        </tbody>
        <tbody v-else class="divide-y divide-surface-800">
          <template v-for="job in jobs" :key="job.id">
            <tr
              class="hover:bg-surface-800/30 transition-colors cursor-pointer"
              @click="toggleJobExpand(job.id)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <svg
                    class="w-3 h-3 text-gray-500 transition-transform duration-200"
                    :class="{ 'rotate-90 text-primary-400': expandedJobs[job.id] }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusClass(job.status)"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(job.status)" />
                    {{ job.status.replace('_', ' ') }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-300">{{ job.type }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs text-right hidden sm:table-cell">
                {{ formatDate(job.startedAt ?? job.createdAt) }}
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs text-right hidden md:table-cell">
                {{ job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '—' }}
              </td>
              <td class="px-4 py-3 text-right hidden md:table-cell">
                <template v-if="job.itemsProcessed > 0">
                  <span class="text-green-400 text-xs">+{{ job.itemsCreated }}</span>
                  <span class="text-gray-600 text-xs mx-1">/</span>
                  <span class="text-blue-400 text-xs">~{{ job.itemsUpdated }}</span>
                  <span v-if="job.itemsFailed > 0" class="text-red-400 text-xs ml-1">✗{{ job.itemsFailed }}</span>
                </template>
                <span v-else class="text-gray-600 text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="job.sourceCommit" class="font-mono text-xs text-gray-500">
                  {{ job.sourceCommit.slice(0, 7) }}
                </span>
                <span v-else class="text-gray-700 text-xs">—</span>
              </td>
            </tr>

            <!-- Expanded Details Section -->
            <tr v-if="expandedJobs[job.id]" class="bg-surface-900/40">
              <td colspan="6" class="px-6 py-4 border-t border-b border-surface-800">
                <div class="space-y-4">
                  <!-- Header details -->
                  <div class="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400 border-b border-surface-800 pb-3">
                    <div>
                      <span>Job ID: <span class="font-mono text-gray-300 font-bold select-all">{{ job.id }}</span></span>
                      <span v-if="job.sourceCommit" class="ml-4">Commit: <span class="font-mono text-gray-300 select-all">{{ job.sourceCommit }}</span></span>
                    </div>
                    <div class="flex gap-4">
                      <span>Started: <span class="text-gray-300">{{ formatDate(job.startedAt ?? job.createdAt) }}</span></span>
                      <span v-if="job.completedAt">Ended: <span class="text-gray-300">{{ formatDate(job.completedAt) }}</span></span>
                    </div>
                  </div>

                  <!-- Error message block -->
                  <div v-if="job.errorMessage" class="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r">
                    <div class="flex items-center gap-2 text-xs font-bold text-red-400 mb-2">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Execution Exception
                    </div>
                    <pre class="text-xs text-red-200 font-mono whitespace-pre-wrap break-all bg-red-950/20 p-2 rounded border border-red-500/20 max-h-[150px] overflow-y-auto">{{ job.errorMessage }}</pre>
                  </div>

                  <!-- Job Statistics Grid -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-950/30 p-3 rounded border border-surface-800/50">
                    <div>
                      <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Processed</div>
                      <div class="text-sm font-bold text-gray-200 font-mono mt-0.5">{{ job.itemsProcessed.toLocaleString() }}</div>
                    </div>
                    <div>
                      <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Created / Updated</div>
                      <div class="text-sm font-bold mt-0.5 font-mono">
                        <span class="text-green-400">+{{ job.itemsCreated }}</span>
                        <span class="text-gray-600 mx-1">/</span>
                        <span class="text-blue-400">~{{ job.itemsUpdated }}</span>
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Skipped Items</div>
                      <div class="text-sm font-bold text-gray-400 font-mono mt-0.5">{{ (job.itemsProcessed - job.itemsCreated - job.itemsUpdated - job.itemsFailed) || 0 }}</div>
                    </div>
                    <div>
                      <div class="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Errors / Failed</div>
                      <div class="text-sm font-bold font-mono mt-0.5" :class="job.itemsFailed > 0 ? 'text-red-400' : 'text-gray-400'">{{ job.itemsFailed }}</div>
                    </div>
                  </div>

                  <!-- Logs Stream -->
                  <div>
                    <h4 class="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Detailed Import Logs
                    </h4>
                    
                    <div v-if="loadingLogs[job.id]" class="bg-surface-950 p-4 rounded border border-surface-800 flex items-center justify-center gap-2">
                      <svg class="w-4 h-4 text-primary-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span class="text-xs text-gray-500">Loading execution logs...</span>
                    </div>

                    <div v-else-if="!jobLogs[job.id] || jobLogs[job.id].length === 0" class="bg-surface-950 p-4 rounded border border-surface-800 text-xs text-gray-600 text-center italic">
                      No detailed logs recorded for this import run.
                    </div>

                    <div v-else class="bg-surface-950 font-mono text-[11px] p-4 rounded border border-surface-800 max-h-[300px] overflow-y-auto space-y-1.5 shadow-inner">
                      <div v-for="log in jobLogs[job.id]" :key="log.id" class="flex gap-2.5 leading-relaxed hover:bg-surface-900/50 py-0.5 px-1 rounded transition-colors">
                        <span class="text-gray-600 select-none font-semibold">{{ formatTime(log.createdAt) }}</span>
                        <span :class="logLevelClass(log.level)" class="px-1 py-0.2 rounded text-[9px] font-bold uppercase select-none h-fit">{{ log.level }}</span>
                        <span class="text-gray-300 whitespace-pre-wrap break-all">{{ log.message }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>

      <div v-if="!loading && jobs.length === 0" class="py-12 text-center text-gray-600 text-sm">
        No import jobs yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface ImportJobRow {
  id: string
  type: string
  status: string
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  itemsFailed: number
  sourceCommit: string | null
  durationMs: number | null
  startedAt: string | null
  createdAt: string
  completedAt?: string | null
  errorMessage?: string | null
}

interface ImportLog {
  id: string
  level: string
  message: string
  context: any
  createdAt: string
}

interface LiveStatus {
  id: string
  type: string
  status: string
  itemsProcessed: number
  startedAt: string | null
  progress: { phase: string; processed: number; total: number; percent: number } | null
}

const jobs = ref<ImportJobRow[]>([])
const loading = ref(false)
const triggering = ref(false)
const activeJobId = ref<string | null>(null)
const liveStatus = ref<LiveStatus | null>(null)
const now = ref(Date.now())

const expandedJobs = ref<Record<string, boolean>>({})
const jobLogs = ref<Record<string, ImportLog[]>>({})
const loadingLogs = ref<Record<string, boolean>>({})

async function toggleJobExpand(jobId: string) {
  expandedJobs.value[jobId] = !expandedJobs.value[jobId]
  if (expandedJobs.value[jobId] && !jobLogs.value[jobId]) {
    loadingLogs.value[jobId] = true
    try {
      const res = await $fetch<{ data: ImportLog[] }>(`/api/v1/admin/import/jobs/${jobId}/logs`)
      jobLogs.value[jobId] = res.data
    } catch {
      // ignore
    } finally {
      loadingLogs.value[jobId] = false
    }
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function logLevelClass(level: string) {
  return ({
    INFO: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    WARN: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    ERROR: 'bg-red-500/10 text-red-400 border border-red-500/20',
    DEBUG: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  } as Record<string, string>)[level] ?? 'bg-gray-500/10 text-gray-400'
}

useIntervalFn(() => {
  now.value = Date.now()
}, 1000)

const durationSeconds = computed(() => {
  if (!liveStatus.value?.startedAt) return 0
  const start = new Date(liveStatus.value.startedAt).getTime()
  return Math.max(0, Math.floor((now.value - start) / 1000))
})

const estimatedRemainingSeconds = computed(() => {
  const percent = progressPercent.value
  if (percent < 5 || percent >= 100) return null
  
  const elapsed = durationSeconds.value
  const totalEstimated = elapsed / (percent / 100)
  return Math.max(0, Math.floor(totalEstimated - elapsed))
})

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [
    h > 0 ? `${h}h` : '',
    m > 0 || h > 0 ? `${m}m` : '',
    `${s}s`,
  ].filter(Boolean).join(' ')
}

const progressPercent = computed(() => {
  if (!liveStatus.value?.progress) return 0
  const phaseWeights: Record<string, number> = {
    fetching: 1,
    normalizing: 2,
    categories: 2,
    importing: 45,
    localizations: 15,
    variants: 5,
    recipes: 10,
    refining: 10,
    spells: 5,
    item_spells: 4,
    done: 1,
  }
  const phases = Object.keys(phaseWeights)
  const currentPhase = liveStatus.value.progress.phase
  const phaseIndex = phases.indexOf(currentPhase)

  if (phaseIndex === -1) return 0

  const completedWeight = phases.slice(0, phaseIndex).reduce((acc, p) => acc + phaseWeights[p], 0)
  const totalWeight = Object.values(phaseWeights).reduce((a, b) => a + b, 0)
  const phaseProgress = (liveStatus.value.progress.percent / 100) * phaseWeights[currentPhase]

  return Math.min(100, Math.round(((completedWeight + phaseProgress) / totalWeight) * 100))
})

async function loadJobs() {
  loading.value = true
  try {
    const res = await $fetch<{ data: ImportJobRow[] }>('/api/v1/admin/import/jobs')
    jobs.value = res.data
    // Resume tracking if there's an active job we don't know about
    if (!activeJobId.value) {
      const running = res.data.find((j) => j.status === 'RUNNING' || j.status === 'PENDING')
      if (running) activeJobId.value = running.id
    }
  } finally {
    loading.value = false
  }
}

async function pollLiveStatus() {
  if (!activeJobId.value) return
  try {
    const res = await $fetch<{ data: LiveStatus }>(`/api/v1/admin/import/jobs/${activeJobId.value}/status`)
    liveStatus.value = res.data

    if (res.data.status !== 'RUNNING' && res.data.status !== 'PENDING') {
      activeJobId.value = null
      liveStatus.value = null
      await loadJobs()
    }
  } catch {
    // ignore transient errors
  }
}

async function triggerImport() {
  triggering.value = true
  try {
    const res = await $fetch<{ data: { jobId: string } }>('/api/v1/admin/import/trigger', {
      method: 'POST',
      body: { type: 'FULL' },
    })
    activeJobId.value = res.data.jobId
    await loadJobs()
  } catch (err: any) {
    alert(err?.data?.message ?? 'Failed to trigger import')
  } finally {
    triggering.value = false
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusClass(status: string) {
  return ({
    SUCCESS: 'bg-green-500/10 text-green-400',
    RUNNING: 'bg-yellow-500/10 text-yellow-400',
    FAILED: 'bg-red-500/10 text-red-400',
    PENDING: 'bg-gray-600/30 text-gray-400',
    PARTIAL_SUCCESS: 'bg-orange-500/10 text-orange-400',
  } as Record<string, string>)[status] ?? 'bg-gray-600/30 text-gray-400'
}

function statusDot(status: string) {
  return ({
    SUCCESS: 'bg-green-400',
    RUNNING: 'bg-yellow-400 animate-pulse',
    FAILED: 'bg-red-400',
    PENDING: 'bg-gray-500 animate-pulse',
    PARTIAL_SUCCESS: 'bg-orange-400',
  } as Record<string, string>)[status] ?? 'bg-gray-500'
}

onMounted(loadJobs)
useIntervalFn(pollLiveStatus, 2000)
</script>
