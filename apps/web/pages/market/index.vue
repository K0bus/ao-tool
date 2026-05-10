<template>
  <div class="page market-page">
    <div class="page-header">
      <div>
        <div class="crumbs"><NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Marché</div>
        <h1>Marché en direct</h1>
        <p class="t-muted" style="margin-top:6px">
          <template v-if="statsData">
            {{ statsData.totalItems.toLocaleString('fr-FR') }} items indexés · {{ CITIES.length }} cités royales
          </template>
          <template v-else>Chargement…</template>
        </p>
      </div>
      <span class="status live">Live</span>
    </div>

    <!-- KPIs -->
    <div class="market-top">
      <div v-for="s in kpis" :key="s.k" class="panel mkt-stat">
        <div class="ms-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="s.iconPaths" />
        </div>
        <div class="ms-body">
          <div class="ms-k">{{ s.k }}</div>
          <div class="ms-v t-mono">{{ s.v }}</div>
          <div class="ms-d">{{ s.d }}</div>
        </div>
      </div>
    </div>

    <!-- Top profit table -->
    <div class="panel" style="margin-top:4px">
      <div class="panel-header" style="flex-wrap:wrap;gap:10px">
        <h3>Top profits craft · {{ selectedCity }}</h3>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-left:auto">
          <div class="filter-pillbox">
            <span class="fpl">Tier</span>
            <button
              v-for="t in [4,5,6,7,8]"
              :key="t"
              class="filter-pill"
              :class="{ active: activeTier === t }"
              @click="toggleTier(t)"
            >T{{ t }}</button>
          </div>
          <select v-model="selectedCity" class="ds-input" style="width:160px" @change="loadProfit">
            <option v-for="c in CITIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div v-if="profitLoading" class="profit-empty">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold);animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>Calcul en cours…</span>
      </div>

      <div v-else-if="!topItems.length" style="padding:48px 24px;text-align:center;color:var(--text-3);font-size:13px">
        Aucun item calculable pour ces filtres.
      </div>

      <template v-else>
        <div style="overflow-x:auto">
          <table class="ds-table" style="width:100%">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align:right">Coût net</th>
                <th style="text-align:right">Prix vente</th>
                <th style="text-align:right">Profit</th>
                <th style="text-align:right">Marge</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in topItems" :key="r.id">
                <td>
                  <NuxtLink :to="`/items/${r.uniqueName}`" style="display:flex;align-items:center;gap:10px">
                    <div class="item-frame" style="width:32px;height:32px;flex-shrink:0;position:relative">
                      <img :src="`https://render.albiononline.com/v1/item/${r.uniqueName}.png`" :alt="r.name" loading="lazy" />
                      <span :class="`tier-badge t${r.tier}`" style="position:absolute;left:2px;top:2px;font-size:8px;padding:0 2px">T{{ r.tier }}</span>
                    </div>
                    <div>
                      <div style="font-size:13px;color:var(--text-0)">{{ r.name }}</div>
                      <div class="t-dim t-mono" style="font-size:10px">{{ r.uniqueName }}</div>
                    </div>
                  </NuxtLink>
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-size:13px;color:var(--text-2)">
                  {{ r.calc.netCost > 0 ? fmt(r.calc.netCost) + ' ◇' : '—' }}
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-size:13px;color:var(--gold)">
                  {{ r.calc.sellRevenue ? fmt(r.calc.sellRevenue) + ' ◇' : '—' }}
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-size:13px;font-weight:600">
                  <span v-if="r.calc.profit !== null" :class="r.calc.profit >= 0 ? 't-success' : 't-danger'">
                    {{ r.calc.profit >= 0 ? '+' : '' }}{{ fmt(r.calc.profit) }} ◇
                  </span>
                  <span v-else class="t-dim">—</span>
                </td>
                <td style="text-align:right;font-family:var(--font-mono);font-size:13px;font-weight:600">
                  <span v-if="r.calc.margin !== null" :class="r.calc.margin >= 0 ? 't-gold t-mono' : 't-danger'">
                    {{ r.calc.margin >= 0 ? '+' : '' }}{{ r.calc.margin.toFixed(1) }}%
                  </span>
                  <span v-else class="t-dim">—</span>
                </td>
                <td><NuxtLink :to="`/items/${r.uniqueName}`" class="ds-btn sm">Voir</NuxtLink></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between">
          <span class="t-dim" style="font-size:12px">{{ profitMeta.total.toLocaleString('fr-FR') }} items craftables analysés</span>
          <NuxtLink to="/items/profit" class="ds-btn ghost sm">
            Analyse complète
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Marché en direct — Albion Codex' })

interface ProfitRow {
  id: string
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  calc: {
    ingredientCost: number
    returnSavings: number
    craftFee: number
    netCost: number
    sellRevenue: number | null
    tax: number
    profit: number | null
    margin: number | null
    missingPrices: boolean
  }
}

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Martlock', 'Thetford']

const selectedCity = useLocalStorage('market:city', 'Caerleon')
const activeTier   = ref<number | null>(null)

const { data: statsRaw } = await useFetch('/api/v1/stats')
const statsData = computed(() => (statsRaw.value as any)?.data ?? null)

const topItems    = ref<ProfitRow[]>([])
const profitMeta  = ref({ total: 0, capped: false })
const profitLoading = ref(false)

async function loadProfit() {
  profitLoading.value = true
  try {
    const query: Record<string, string | number> = {
      location: selectedCity.value,
      quality: 1,
      useFocus: 'false',
      useCityBonus: 'false',
      craftFeePercent: 8.5,
      includeTax: 'true',
      sortBy: 'profit',
      limit: 10,
      page: 1,
    }
    if (activeTier.value !== null) query.tier = activeTier.value
    const res = await $fetch<{ data: ProfitRow[]; meta: any }>('/api/v1/items/profit', { query })
    topItems.value = (res.data ?? []).filter(r => r.calc.profit !== null)
    profitMeta.value = res.meta ?? { total: 0, capped: false }
  } catch {
    topItems.value = []
  } finally {
    profitLoading.value = false
  }
}

function toggleTier(t: number) {
  activeTier.value = activeTier.value === t ? null : t
  loadProfit()
}

function fmt(v: number) {
  if (!v) return '0'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'k'
  return Math.round(v).toLocaleString('fr-FR')
}

function fmtLastSync(completedAt: string | null | undefined): string {
  if (!completedAt) return 'Jamais'
  const diff = Date.now() - new Date(completedAt).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1)  return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24)   return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

const kpis = computed(() => {
  const top   = topItems.value[0]
  const stats = statsData.value

  return [
    {
      k: 'Items indexés',
      v: stats ? stats.totalItems.toLocaleString('fr-FR') : '…',
      d: 'Base de données complète',
      iconPaths: '<path d="M4 19.5V4a2 2 0 0 1 2-2h13v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2.5z"/><path d="M9 2v18"/>',
    },
    {
      k: 'Craftables analysés',
      v: profitMeta.value.total ? profitMeta.value.total.toLocaleString('fr-FR') : '…',
      d: selectedCity.value,
      iconPaths: '<path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
    },
    {
      k: 'Meilleur profit',
      v: top?.calc.profit != null ? fmt(top.calc.profit) + ' ◇' : '—',
      d: top ? top.name : 'Calcul en cours…',
      iconPaths: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    },
    {
      k: 'Meilleure marge',
      v: top?.calc.margin != null ? `+${top.calc.margin.toFixed(1)}%` : '—',
      d: fmtLastSync(stats?.lastImport?.completedAt),
      iconPaths: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/>',
    },
  ]
})

onMounted(() => loadProfit())
</script>

<style scoped>
.t-success { color: var(--success); }
.t-danger  { color: var(--danger); }
.t-gold    { color: var(--gold); }

.profit-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  color: var(--text-3);
  font-size: 14px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
