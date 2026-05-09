<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">System overview</p>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Total Items</p>
        <p class="text-2xl font-bold text-white">
          <span v-if="statsLoading" class="text-gray-600 animate-pulse">—</span>
          <span v-else>{{ stats?.totalItems?.toLocaleString() ?? '—' }}</span>
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Craftable</p>
        <p class="text-2xl font-bold text-white">
          <span v-if="statsLoading" class="text-gray-600 animate-pulse">—</span>
          <span v-else>{{ stats?.craftableItems?.toLocaleString() ?? '—' }}</span>
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Users</p>
        <p class="text-2xl font-bold text-white">
          <span v-if="statsLoading" class="text-gray-600 animate-pulse">—</span>
          <span v-else>{{ stats?.totalUsers?.toLocaleString() ?? '—' }}</span>
        </p>
      </div>
      <div class="card p-4">
        <p class="text-xs text-gray-500 mb-1">Last Import</p>
        <p class="text-sm font-semibold text-white">
          <span v-if="statsLoading" class="text-gray-600 animate-pulse text-2xl">—</span>
          <span v-else-if="stats?.lastImport" class="text-green-400">
            {{ formatRelative(stats.lastImport.completedAt) }}
          </span>
          <span v-else class="text-gray-600 text-base">Never</span>
        </p>
        <p v-if="stats?.lastImport?.sourceCommit" class="text-xs text-gray-600 font-mono mt-0.5">
          {{ stats.lastImport.sourceCommit }}
        </p>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="mb-8">
      <h2 class="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h2>
      <div class="flex flex-wrap gap-3">
        <button class="btn-primary text-sm" :disabled="importing" @click="triggerImport">
          {{ importing ? 'Starting...' : '↻ Full Data Import' }}
        </button>
        <button class="btn-secondary text-sm" :disabled="syncing" @click="triggerMarketSync">
          {{ syncing ? 'Starting...' : '📊 Market Price Sync' }}
        </button>
        <NuxtLink to="/admin/data/imports" class="btn-secondary text-sm">
          Import History
        </NuxtLink>
        <NuxtLink to="/admin/users" class="btn-secondary text-sm">
          Manage Users
        </NuxtLink>
      </div>
      <p v-if="importMessage" class="text-xs mt-2" :class="importError ? 'text-red-400' : 'text-green-400'">
        {{ importMessage }}
      </p>
    </div>

    <!-- Recent imports -->
    <div>
      <h2 class="text-sm font-semibold text-gray-400 mb-3">Recent Imports</h2>
      <div v-if="jobsLoading" class="card p-4 animate-pulse space-y-2">
        <div v-for="i in 3" :key="i" class="h-8 bg-surface-700 rounded" />
      </div>
      <div v-else-if="recentJobs.length === 0" class="card p-6 text-center text-sm text-gray-600">
        No import jobs yet — run your first import
      </div>
      <div v-else class="card divide-y divide-surface-700">
        <div
          v-for="job in recentJobs"
          :key="job.id"
          class="flex items-center gap-4 px-4 py-3 text-sm"
        >
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
            :class="statusClass(job.status)"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(job.status)" />
            {{ job.status }}
          </span>
          <span class="text-gray-400">{{ job.type }}</span>
          <span v-if="job.itemsProcessed > 0" class="text-xs text-gray-600">
            {{ job.itemsProcessed.toLocaleString() }} items
          </span>
          <span class="ml-auto text-gray-600 text-xs shrink-0">
            {{ formatDate(job.createdAt) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Stats {
  totalItems: number
  craftableItems: number
  totalUsers: number
  lastImport: { completedAt: string; sourceCommit: string | null } | null
}

interface ImportJob {
  id: string; type: string; status: string
  itemsProcessed: number; createdAt: string
}

const stats = ref<Stats | null>(null)
const statsLoading = ref(true)
const recentJobs = ref<ImportJob[]>([])
const jobsLoading = ref(true)
const importing = ref(false)
const syncing = ref(false)
const importMessage = ref<string | null>(null)
const importError = ref(false)

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await $fetch<{ data: Stats }>('/api/v1/admin/stats')
    stats.value = res.data
  } finally {
    statsLoading.value = false
  }
}

async function loadJobs() {
  jobsLoading.value = true
  try {
    const res = await $fetch<{ data: ImportJob[] }>('/api/v1/admin/import/jobs')
    recentJobs.value = res.data.slice(0, 5)
  } finally {
    jobsLoading.value = false
  }
}

async function triggerImport() {
  importing.value = true
  importMessage.value = null
  importError.value = false
  try {
    const res = await $fetch<{ data: { message: string } }>('/api/v1/admin/import/trigger', {
      method: 'POST', body: { type: 'FULL' },
    })
    importMessage.value = res.data.message
    await loadJobs()
  } catch (err: any) {
    importError.value = true
    importMessage.value = err?.data?.message ?? 'Failed to trigger import'
  } finally {
    importing.value = false
  }
}

async function triggerMarketSync() {
  syncing.value = true
  importMessage.value = null
  importError.value = false
  try {
    const res = await $fetch<{ data: { message: string } }>('/api/v1/admin/market/sync', {
      method: 'POST', body: { type: 'FULL' },
    })
    importMessage.value = res.data.message
  } catch (err: any) {
    importError.value = true
    importMessage.value = err?.data?.message ?? 'Failed to trigger market sync'
  } finally {
    syncing.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Just now'
}

function statusClass(s: string) {
  return { SUCCESS: 'bg-green-500/10 text-green-400', RUNNING: 'bg-yellow-500/10 text-yellow-400', FAILED: 'bg-red-500/10 text-red-400', PENDING: 'bg-gray-600/30 text-gray-400', PARTIAL_SUCCESS: 'bg-orange-500/10 text-orange-400' }[s] ?? 'bg-gray-700 text-gray-400'
}
function statusDot(s: string) {
  return { SUCCESS: 'bg-green-400', RUNNING: 'bg-yellow-400 animate-pulse', FAILED: 'bg-red-400', PENDING: 'bg-gray-500', PARTIAL_SUCCESS: 'bg-orange-400' }[s] ?? 'bg-gray-500'
}

onMounted(() => { loadStats(); loadJobs() })
</script>
