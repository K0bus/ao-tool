<template>
  <div class="page admin">
    <div class="page-header flex justify-between items-center flex-wrap gap-4">
      <div>
        <h1 class="page-title">Database Status</h1>
        <p class="page-subtitle">Comprehensive overview of the database records and state.</p>
      </div>
      <button class="ds-btn ghost sm" @click="loadStats" :disabled="loading">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'animate-spin': loading }"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="loading && !stats" class="mt-6 space-y-8 animate-pulse">
      <div v-for="i in 3" :key="i">
        <div class="h-6 w-32 bg-surface-800 rounded mb-4"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="j in 4" :key="j" class="card p-4 h-24"></div>
        </div>
      </div>
    </div>

    <div v-else-if="stats" class="mt-6 space-y-8">
      <!-- Items Section -->
      <section>
        <h2 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Items Overview</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="panel kpi-card">
            <div class="kc-k">Total Items</div>
            <div class="kc-v t-mono">{{ stats.items.total.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Base catalog</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Craftable & Refinable</div>
            <div class="kc-v t-mono">{{ (stats.items.craftable + stats.items.refinable).toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Participate in economy</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Equipments</div>
            <div class="kc-v t-mono">{{ (stats.items.weapons + stats.items.armors).toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Weapons & Armors</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Icons Fetched</div>
            <div class="kc-v t-mono" :style="{ color: stats.items.withIcon === stats.items.total ? 'var(--success)' : 'var(--warning)' }">
              {{ stats.items.withIcon.toLocaleString('fr-FR') }}
            </div>
            <div class="kc-d">{{ ((stats.items.withIcon / (stats.items.total || 1)) * 100).toFixed(1) }}% coverage</div>
          </div>
        </div>
      </section>

      <!-- Market Data Section -->
      <section>
        <h2 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Market Engine</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="panel kpi-card">
            <div class="kc-k">Live Prices Tracked</div>
            <div class="kc-v t-mono">{{ stats.market.prices.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Current market snapshots</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Resolved Prices</div>
            <div class="kc-v t-mono">{{ stats.market.resolved.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Processed for calculations</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Price History Records</div>
            <div class="kc-v t-mono">{{ stats.market.history.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Time-series data points</div>
          </div>
        </div>
      </section>

      <!-- Game Data & Logic -->
      <section>
        <h2 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Game Definitions</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="panel kpi-card">
            <div class="kc-k">Spells</div>
            <div class="kc-v t-mono">{{ stats.gameData.spells.toLocaleString('fr-FR') }}</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Crafting Recipes</div>
            <div class="kc-v t-mono">{{ stats.gameData.craftingRecipes.toLocaleString('fr-FR') }}</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Refining Recipes</div>
            <div class="kc-v t-mono">{{ stats.gameData.refiningRecipes.toLocaleString('fr-FR') }}</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Locations</div>
            <div class="kc-v t-mono">{{ stats.gameData.locations.toLocaleString('fr-FR') }}</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Return Rates</div>
            <div class="kc-v t-mono">{{ stats.gameData.returnRates.toLocaleString('fr-FR') }}</div>
          </div>
        </div>
      </section>

      <!-- Users & Social -->
      <section>
        <h2 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Community & Users</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="panel kpi-card">
            <div class="kc-k">Total Users</div>
            <div class="kc-v t-mono">{{ stats.users.total.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">{{ stats.users.active }} Active / {{ stats.users.admins }} Admins</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Total Builds</div>
            <div class="kc-v t-mono">{{ stats.builds.total.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Player creations</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Public Builds</div>
            <div class="kc-v t-mono">{{ stats.builds.public.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">{{ ((stats.builds.public / (stats.builds.total || 1)) * 100).toFixed(1) }}% of total</div>
          </div>
          <div class="panel kpi-card">
            <div class="kc-k">Collections</div>
            <div class="kc-v t-mono">{{ stats.builds.collections.toLocaleString('fr-FR') }}</div>
            <div class="kc-d">Curated groups</div>
          </div>
        </div>
      </section>

      <!-- Database Storage -->
      <section>
        <h2 class="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Storage Usage</h2>
        <div class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-400 uppercase bg-surface-800 border-b border-surface-700">
                <tr>
                  <th class="px-4 py-3 font-semibold">Table Name</th>
                  <th class="px-4 py-3 font-semibold text-right">Data Size</th>
                  <th class="px-4 py-3 font-semibold text-right">Index Size</th>
                  <th class="px-4 py-3 font-semibold text-right text-white">Total Size</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-surface-800">
                <tr v-for="table in stats.tables" :key="table.tableName" class="hover:bg-surface-800/50">
                  <td class="px-4 py-2 font-mono text-xs text-gray-300">{{ table.tableName }}</td>
                  <td class="px-4 py-2 text-right text-gray-400 font-mono text-xs">{{ formatBytes(table.tableBytes) }}</td>
                  <td class="px-4 py-2 text-right text-gray-400 font-mono text-xs">{{ formatBytes(table.indexBytes) }}</td>
                  <td class="px-4 py-2 text-right text-white font-mono text-xs font-semibold">{{ formatBytes(table.totalBytes) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface DbStats {
  users: { total: number; active: number; admins: number }
  items: {
    total: number
    craftable: number
    refinable: number
    weapons: number
    armors: number
    mounts: number
    consumables: number
    withIcon: number
  }
  builds: { total: number; public: number; private: number; collections: number }
  market: { prices: number; resolved: number; history: number }
  gameData: { spells: number; craftingRecipes: number; refiningRecipes: number; locations: number; returnRates: number }
  tables: Array<{ tableName: string; totalBytes: number; tableBytes: number; indexBytes: number }>
}

const stats = ref<DbStats | null>(null)
const loading = ref(true)

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function loadStats() {
  loading.value = true
  try {
    const res = await $fetch<{ data: DbStats }>('/api/v1/admin/database-stats')
    stats.value = res.data
  } catch (err) {
    console.error('Failed to load DB stats', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>
