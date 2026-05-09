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
        <div class="kc-k">Workers actifs</div>
        <div class="kc-v t-mono">8 / 8</div>
        <div class="kc-d up">Tous opérationnels</div>
      </div>
      <div class="panel kpi-card">
        <div class="kc-k">Prix collectés / h</div>
        <div class="kc-v t-mono">184k</div>
        <div class="kc-d up">↑ 6.2%</div>
      </div>
    </div>

    <div class="admin-dual">
      <!-- Workers list -->
      <div class="panel">
        <div class="panel-header">
          <h3>Workers</h3>
          <span class="status live">Actifs</span>
        </div>
        <div class="workers-list">
          <div v-for="w in workers" :key="w.id" :class="['worker-row', w.status === 'error' && 'warn']">
            <span :class="['status-dot', w.status]" style="width:8px;height:8px;border-radius:50%;flex-shrink:0" />
            <div>
              <div class="wr-name">{{ w.name }}</div>
              <div class="wr-desc">{{ w.desc }}</div>
            </div>
            <div style="flex:1;min-width:0">
              <div class="wr-prog-head">
                <span style="color:var(--text-2)">{{ w.phase }}</span>
                <span class="t-mono" style="color:var(--text-2)">{{ w.pct }}%</span>
              </div>
              <div class="prog-bar"><div class="prog-fill" :style="{ width: w.pct + '%', background: w.status === 'error' ? 'var(--danger)' : 'var(--gold)' }" /></div>
            </div>
            <div class="wr-rate">{{ w.rate }}</div>
            <div class="wr-last">{{ w.last }}</div>
            <div class="wr-actions">
              <button class="ds-btn ghost sm" style="padding:4px 8px">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent imports -->
      <div class="panel">
        <div class="panel-header">
          <h3>Imports récents</h3>
          <NuxtLink to="/admin/data/imports" class="ds-btn ghost sm">Voir tout <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></NuxtLink>
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
          <span class="status live">Live</span>
          <NuxtLink to="/admin/users" class="ds-btn ghost sm">Utilisateurs</NuxtLink>
        </div>
      </div>
      <div class="log-stream">
        <div v-for="(line, i) in logs" :key="i" class="log-line">
          <span class="t-mono t-dim" style="font-size:10px">{{ line.t }}</span>
          <span :class="`log-lvl lvl-${line.lvl}`">{{ line.lvl.toUpperCase() }}</span>
          <span class="log-src">{{ line.src }}</span>
          <span class="log-msg">{{ line.msg }}</span>
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

const workers = [
  { id: 1, name: 'market-caerleon', desc: 'Prix Marché Caerleon', status: 'ok', phase: 'Synchronisation', pct: 78, rate: '412 / s', last: 'il y a 2 s' },
  { id: 2, name: 'market-bridgewatch', desc: 'Prix Marché Bridgewatch', status: 'ok', phase: 'Synchronisation', pct: 65, rate: '388 / s', last: 'il y a 4 s' },
  { id: 3, name: 'market-blackmarket', desc: 'Prix Marché Noir', status: 'error', phase: 'Timeout API', pct: 0, rate: '—', last: 'il y a 2 h' },
  { id: 4, name: 'translation-fr', desc: 'Traductions FR', status: 'ok', phase: 'Terminé', pct: 100, rate: '—', last: 'il y a 37 min' },
  { id: 5, name: 'import-items', desc: 'Import items Albion', status: 'idle', phase: 'En attente', pct: 0, rate: '—', last: 'il y a 14 min' },
]

const logs = [
  { t: '14:22:08', lvl: 'info', src: 'market-caerleon', msg: '8 421 nouveaux prix synchronisés depuis Caerleon.' },
  { t: '14:21:50', lvl: 'info', src: 'market-bridgewatch', msg: '6 203 prix mis à jour (Bridgewatch).' },
  { t: '14:08:14', lvl: 'info', src: 'translation-fr', msg: 'Worker terminé — 320 entrées traitées.' },
  { t: '12:37:02', lvl: 'error', src: 'market-blackmarket', msg: 'Timeout API après 30 s — worker redémarré.' },
  { t: '12:10:41', lvl: 'warn', src: 'import-items', msg: 'Patch 27 — 12 nouveaux items, 4 recettes modifiées.' },
  { t: '11:58:30', lvl: 'info', src: 'system', msg: 'Démarrage du cycle de synchronisation toutes les 60 s.' },
]

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await $fetch<{ data: Stats }>('/api/v1/admin/stats')
    stats.value = res.data
  } catch { /* stats stay null */ } finally {
    statsLoading.value = false
  }
}

async function loadJobs() {
  jobsLoading.value = true
  try {
    const res = await $fetch<{ data: ImportJob[] }>('/api/v1/admin/import/jobs')
    recentJobs.value = res.data.slice(0, 6)
  } catch { /* jobs stay empty */ } finally {
    jobsLoading.value = false
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
    importMessage.value = err?.data?.message ?? 'Erreur lors du déclenchement de l\'import'
  } finally { importing.value = false }
}

async function triggerMarketSync() {
  syncing.value = true; importMessage.value = null; importError.value = false
  try {
    const res = await $fetch<{ data: { message: string } }>('/api/v1/admin/market/sync', { method: 'POST', body: { type: 'FULL' } })
    importMessage.value = res.data.message
  } catch (err: any) {
    importError.value = true
    importMessage.value = err?.data?.message ?? 'Erreur lors de la synchronisation marché'
  } finally { syncing.value = false }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `il y a ${d}j`
  if (h > 0) return `il y a ${h}h`
  return 'À l\'instant'
}

function tagForStatus(s: string) {
  return { SUCCESS: 'success', RUNNING: 'info', FAILED: 'danger', PENDING: '', PARTIAL_SUCCESS: 'warning' }[s] ?? ''
}

onMounted(() => { loadStats(); loadJobs() })
</script>
