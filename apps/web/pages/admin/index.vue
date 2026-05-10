<template>
  <div class="page admin">
    <div class="page-header">
      <div class="breadcrumb">
        <NuxtLink to="/">Accueil</NuxtLink>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        <span>Administration</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">Supervision des workers, état de la base et des imports.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="ds-btn ghost sm" :disabled="syncing" @click="triggerMarketSync">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            {{ syncing ? 'Sync…' : 'Sync Marché' }}
          </button>
          <button class="ds-btn primary sm" :disabled="importing" @click="triggerImport">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {{ importing ? 'Lancement…' : 'Import complet' }}
          </button>
        </div>
      </div>
      <p v-if="importMessage" class="t-mono" style="font-size:12px;margin-top:8px" :style="{ color: importError ? 'var(--danger)' : 'var(--success)' }">{{ importMessage }}</p>
    </div>

    <!-- KPI row -->
    <div class="admin-kpi">
      <div class="panel kpi-card">
        <div class="kc-k">Items indexés</div>
        <div class="kc-v t-mono">
          <span v-if="statsLoading" class="skel" style="width:60px;height:24px;display:inline-block" />
          <span v-else>{{ stats?.totalItems?.toLocaleString('fr-FR') ?? '—' }}</span>
        </div>
        <div class="kc-d">Base complète</div>
      </div>
      <div class="panel kpi-card">
        <div class="kc-k">Craftables</div>
        <div class="kc-v t-mono">
          <span v-if="statsLoading" class="skel" style="width:60px;height:24px;display:inline-block" />
          <span v-else>{{ stats?.craftableItems?.toLocaleString('fr-FR') ?? '—' }}</span>
        </div>
        <div class="kc-d">Avec recette</div>
      </div>
      <div class="panel kpi-card">
        <div class="kc-k">Utilisateurs</div>
        <div class="kc-v t-mono">
          <span v-if="statsLoading" class="skel" style="width:40px;height:24px;display:inline-block" />
          <span v-else>{{ stats?.totalUsers?.toLocaleString('fr-FR') ?? '—' }}</span>
        </div>
        <div class="kc-d">Enregistrés</div>
      </div>
      <div class="panel kpi-card">
        <div class="kc-k">Dernier import</div>
        <div class="kc-v" style="font-size:15px">
          <span v-if="statsLoading" class="skel" style="width:70px;height:22px;display:inline-block" />
          <span v-else-if="stats?.lastImport" style="color:var(--success)">{{ formatRelative(stats.lastImport.completedAt) }}</span>
          <span v-else style="color:var(--text-3);font-size:13px">Jamais</span>
        </div>
        <div v-if="stats?.lastImport?.sourceCommit" class="kc-d t-mono">{{ stats.lastImport.sourceCommit.slice(0, 8) }}</div>
      </div>
      <div class="panel kpi-card">
        <div class="kc-k">Jobs en file</div>
        <div class="kc-v t-mono">
          <span v-if="jobsLoading" class="skel" style="width:40px;height:24px;display:inline-block" />
          <span v-else :style="{ color: activeJobsCount > 0 ? 'var(--gold)' : 'var(--text-2)' }">{{ activeJobsCount }}</span>
        </div>
        <div class="kc-d">{{ activeJobsCount > 0 ? 'En cours / en attente' : 'Aucun actif' }}</div>
      </div>
      <div class="panel kpi-card">
        <div class="kc-k">Dernier marché sync</div>
        <div class="kc-v" style="font-size:15px">
          <span v-if="marketJobsLoading" class="skel" style="width:70px;height:22px;display:inline-block" />
          <span v-else-if="lastMarketJob" :style="{ color: lastMarketJob.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)' }">
            {{ formatRelative(lastMarketJob.completedAt ?? lastMarketJob.createdAt) }}
          </span>
          <span v-else style="color:var(--text-3);font-size:13px">Jamais</span>
        </div>
        <div v-if="lastMarketJob" class="kc-d">{{ lastMarketJob.itemsUpdated.toLocaleString('fr-FR') }} prix mis à jour</div>
      </div>
    </div>

    <div class="admin-dual">
      <!-- Recent jobs (import + market) -->
      <div class="panel">
        <div class="panel-header">
          <h3>Jobs récents</h3>
          <span v-if="activeJobsCount > 0" class="status live">{{ activeJobsCount }} actif{{ activeJobsCount > 1 ? 's' : '' }}</span>
          <span v-else class="status">Inactif</span>
        </div>
        <div v-if="jobsLoading && marketJobsLoading" style="padding:16px;display:flex;flex-direction:column;gap:8px">
          <div v-for="i in 5" :key="i" class="skel" style="height:40px;border-radius:4px" />
        </div>
        <div v-else-if="allJobs.length === 0" style="padding:32px;text-align:center;color:var(--text-3);font-size:13px">
          Aucun job — lancez un import ou une sync marché.
        </div>
        <div v-else class="workers-list">
          <div v-for="job in allJobs" :key="job.id" :class="['worker-row', job.status === 'FAILED' && 'warn']">
            <span :class="['status-dot', dotClass(job.status)]" style="width:8px;height:8px;border-radius:50%;flex-shrink:0" />
            <div style="min-width:0">
              <div class="wr-name">{{ job.label }}</div>
              <div class="wr-desc">{{ job.kind === 'import' ? 'Import Albion' : 'Sync Marché' }}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div class="wr-prog-head">
                <span style="color:var(--text-2)">{{ statusLabel(job.status) }}</span>
                <span v-if="job.itemsProcessed" class="t-mono" style="color:var(--text-2)">{{ job.itemsProcessed.toLocaleString('fr-FR') }}</span>
              </div>
              <div v-if="job.status === 'RUNNING'" class="prog-bar">
                <div class="prog-fill prog-indeterminate" style="background:var(--gold)" />
              </div>
              <div v-else class="prog-bar">
                <div class="prog-fill" :style="{ width: job.status === 'SUCCESS' ? '100%' : '0%', background: job.status === 'FAILED' ? 'var(--danger)' : 'var(--gold)' }" />
              </div>
            </div>
            <div class="wr-last">{{ formatRelative(job.createdAt) }}</div>
          </div>
        </div>
      </div>

      <!-- Recent imports detail table -->
      <div class="panel">
        <div class="panel-header">
          <h3>Imports récents</h3>
        </div>
        <div v-if="jobsLoading" style="padding:16px;display:flex;flex-direction:column;gap:8px">
          <div v-for="i in 4" :key="i" class="skel" style="height:40px;border-radius:4px" />
        </div>
        <div v-else-if="recentJobs.length === 0" style="padding:32px;text-align:center;color:var(--text-3);font-size:13px">
          Aucun import — lancez le premier via le bouton ci-dessus.
        </div>
        <table v-else class="ds-table" style="margin:0">
          <thead>
            <tr>
              <th>Type</th>
              <th>Statut</th>
              <th>Items</th>
              <th>Durée</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="job in recentJobs" :key="job.id">
              <td class="t-mono" style="font-size:12px">{{ job.type }}</td>
              <td>
                <span :class="`tag ${tagForStatus(job.status)}`">{{ job.status }}</span>
              </td>
              <td class="t-mono">{{ job.itemsProcessed > 0 ? job.itemsProcessed.toLocaleString('fr-FR') : '—' }}</td>
              <td class="t-mono" style="font-size:11px;color:var(--text-3)">{{ job.durationMs ? formatDuration(job.durationMs) : '—' }}</td>
              <td class="t-mono" style="font-size:11px;color:var(--text-3)">{{ formatDate(job.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Log stream -->
    <div class="panel" style="margin-top:16px">
      <div class="panel-header">
        <h3>Journal système</h3>
        <div style="display:flex;gap:8px;align-items:center">
          <span v-if="!logsLoading && importLogs.length > 0" class="status live">{{ importLogs.length }} entrées</span>
          <button class="ds-btn ghost sm" @click="loadLogs">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            Rafraîchir
          </button>
          <NuxtLink to="/admin/users" class="ds-btn ghost sm">Utilisateurs</NuxtLink>
        </div>
      </div>
      <div class="log-stream">
        <div v-if="logsLoading" style="padding:16px;display:flex;flex-direction:column;gap:6px">
          <div v-for="i in 6" :key="i" class="skel" style="height:20px;border-radius:3px" />
        </div>
        <div v-else-if="importLogs.length === 0" style="padding:24px;text-align:center;color:var(--text-3);font-size:13px">
          Aucun log disponible.
        </div>
        <div v-for="line in importLogs" :key="line.id" class="log-line">
          <span class="t-mono t-dim" style="font-size:10px">{{ formatTime(line.createdAt) }}</span>
          <span :class="`log-lvl lvl-${line.level.toLowerCase()}`">{{ line.level }}</span>
          <span class="log-src">{{ line.job.type }}</span>
          <span class="log-msg">{{ line.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Stats {
  totalItems: number
  craftableItems: number
  totalUsers: number
  lastImport: { completedAt: string; sourceCommit: string | null } | null
}

interface ImportJob {
  id: string
  type: string
  status: string
  itemsProcessed: number
  itemsCreated: number
  itemsUpdated: number
  durationMs: number | null
  createdAt: string
  errorMessage?: string | null
}

interface MarketJob {
  id: string
  type: string
  status: string
  itemsRequested: number
  itemsUpdated: number
  itemsFailed: number
  durationMs: number | null
  completedAt: string | null
  createdAt: string
}

interface ImportLog {
  id: string
  level: string
  message: string
  createdAt: string
  job: { id: string; type: string }
}

const stats = ref<Stats | null>(null)
const statsLoading = ref(true)
const recentJobs = ref<ImportJob[]>([])
const jobsLoading = ref(true)
const marketJobs = ref<MarketJob[]>([])
const marketJobsLoading = ref(true)
const importLogs = ref<ImportLog[]>([])
const logsLoading = ref(true)
const importing = ref(false)
const syncing = ref(false)
const importMessage = ref<string | null>(null)
const importError = ref(false)

const lastMarketJob = computed(() => marketJobs.value[0] ?? null)

const activeJobsCount = computed(() => {
  const importActive = recentJobs.value.filter(j => j.status === 'RUNNING' || j.status === 'PENDING').length
  const marketActive = marketJobs.value.filter(j => j.status === 'RUNNING' || j.status === 'PENDING').length
  return importActive + marketActive
})

const allJobs = computed(() => {
  const imports = recentJobs.value.slice(0, 5).map(j => ({
    id: j.id,
    kind: 'import' as const,
    label: j.type,
    status: j.status,
    itemsProcessed: j.itemsProcessed,
    createdAt: j.createdAt,
  }))
  const markets = marketJobs.value.slice(0, 5).map(j => ({
    id: j.id,
    kind: 'market' as const,
    label: j.type,
    status: j.status,
    itemsProcessed: j.itemsUpdated,
    createdAt: j.createdAt,
  }))
  return [...imports, ...markets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
})

function dotClass(status: string): string {
  if (status === 'SUCCESS') return 'ok'
  if (status === 'FAILED') return 'error'
  if (status === 'RUNNING') return 'live'
  return 'idle'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    SUCCESS: 'Terminé',
    FAILED: 'Échec',
    RUNNING: 'En cours…',
    PENDING: 'En attente',
  }
  return map[status] ?? status
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await $fetch<{ data: Stats }>('/api/v1/admin/stats')
    stats.value = res.data
  } catch { /* stay null */ } finally {
    statsLoading.value = false
  }
}

async function loadJobs() {
  jobsLoading.value = true
  try {
    const res = await $fetch<{ data: ImportJob[] }>('/api/v1/admin/import/jobs')
    recentJobs.value = res.data.slice(0, 8)
  } catch { /* stay empty */ } finally {
    jobsLoading.value = false
  }
}

async function loadMarketJobs() {
  marketJobsLoading.value = true
  try {
    const res = await $fetch<{ data: MarketJob[] }>('/api/v1/admin/market/jobs')
    marketJobs.value = res.data
  } catch { /* stay empty */ } finally {
    marketJobsLoading.value = false
  }
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const res = await $fetch<{ data: ImportLog[] }>('/api/v1/admin/logs')
    importLogs.value = res.data
  } catch { /* stay empty */ } finally {
    logsLoading.value = false
  }
}

async function triggerImport() {
  importing.value = true; importMessage.value = null; importError.value = false
  try {
    const res = await $fetch<{ data: { message: string } }>('/api/v1/admin/import/trigger', { method: 'POST', body: { type: 'FULL' } })
    importMessage.value = res.data.message
    await loadJobs()
  } catch (err: any) {
    importError.value = true
    importMessage.value = err?.data?.message ?? "Erreur lors du déclenchement de l'import"
  } finally { importing.value = false }
}

async function triggerMarketSync() {
  syncing.value = true; importMessage.value = null; importError.value = false
  try {
    const res = await $fetch<{ data: { message: string } }>('/api/v1/admin/market/sync', { method: 'POST', body: { type: 'FULL' } })
    importMessage.value = res.data.message
    await loadMarketJobs()
  } catch (err: any) {
    importError.value = true
    importMessage.value = err?.data?.message ?? 'Erreur lors de la synchronisation marché'
  } finally { syncing.value = false }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`
}

function tagForStatus(s: string) {
  return { SUCCESS: 'success', RUNNING: 'info', FAILED: 'danger', PENDING: '', PARTIAL_SUCCESS: 'warning' }[s] ?? ''
}

onMounted(() => {
  loadStats()
  loadJobs()
  loadMarketJobs()
  loadLogs()
})
</script>
