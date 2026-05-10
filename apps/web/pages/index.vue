<template>
  <div class="page home">
    <!-- Hero -->
    <section class="hero">
      <div class="t-eyebrow" style="text-align:center">❖ &nbsp;ALBION CODEX&nbsp; ❖</div>
      <h1 class="hero-title">La connaissance de l'Albion, à portée de main.</h1>
      <p class="hero-sub">Base de données complète, calculateur de craft, suivi de marché. Construit pour les artisans, marchands et aventuriers.</p>

      <!-- Search -->
      <form class="hero-search" @submit.prevent="goSearch">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold);flex-shrink:0"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          v-model="query"
          class="hero-search-input"
          type="text"
          placeholder="Rechercher un item, une ressource, une recette…"
          autocomplete="off"
        />
        <kbd style="font-family:var(--font-mono);font-size:11px;color:var(--gold);background:rgba(201,161,74,0.1);border:1px solid var(--gold-deep);padding:4px 10px;border-radius:4px">↵</kbd>
      </form>

      <!-- Trending chips -->
      <div class="hero-suggest">
        <span class="t-dim" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-family:var(--font-display)">Tendances craft</span>
        <NuxtLink v-for="chip in trendingItems" :key="chip.uniqueName" :to="`/items/${chip.uniqueName}`" class="trend-chip">
          <div class="tc-img">
            <img :src="`https://render.albiononline.com/v1/item/${chip.uniqueName}.png`" :alt="chip.name" loading="lazy" />
          </div>
          <span>{{ chip.name }}</span>
        </NuxtLink>
        <template v-if="trendingItems.length === 0">
          <div v-for="i in 4" :key="i" class="trend-chip skel" style="width:120px;height:36px" />
        </template>
      </div>
    </section>

    <!-- Tools grid -->
    <section class="tools-grid">
      <NuxtLink v-for="tool in tools" :key="tool.route" :to="tool.route" class="tool-card">
        <div class="tc-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="tool.iconPaths" />
        </div>
        <div class="tc-body">
          <div class="tc-head">
            <h3>{{ tool.title }}</h3>
            <span v-if="tool.tag" class="tag gold">{{ tool.tag }}</span>
          </div>
          <p>{{ tool.desc }}</p>
          <div class="tc-cta">Ouvrir <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></div>
        </div>
      </NuxtLink>
    </section>

    <!-- Divider -->
    <div class="divider-orn">❖</div>

    <!-- Lower: featured + stats -->
    <section class="home-lower">
      <!-- Featured item -->
      <div class="panel parchment framed" style="overflow:hidden">
        <div class="panel-header">
          <h3>Item à la une</h3>
          <span v-if="topProfit" class="tag gold">T{{ topProfit.tier }} · {{ topProfit.categoryName ?? topProfit.shopCategory ?? topProfit.itemType }}</span>
          <span v-else class="tag gold">Meilleure marge craft</span>
        </div>
        <div class="panel-body featured-body">
          <div class="item-frame q-masterpiece featured-img">
            <img
              v-if="topProfit"
              :src="`https://render.albiononline.com/v1/item/${topProfit.uniqueName}.png?quality=5`"
              :alt="topProfit.name"
            />
            <div v-else class="skel" style="width:100%;height:100%;border-radius:var(--radius)" />
            <span v-if="topProfit" class="corner">T·{{ topProfit.tier }}</span>
          </div>
          <div class="featured-meta">
            <span class="t-eyebrow">{{ topProfit?.categoryName ?? topProfit?.shopSubcategory ?? topProfit?.shopCategory ?? topProfit?.itemType ?? '…' }}</span>
            <h2 style="font-size:26px;margin:4px 0 4px">{{ topProfit?.name ?? '…' }}</h2>
            <p v-if="!topProfit" class="t-muted" style="margin-bottom:12px">Calcul en cours…</p>
            <div v-if="topProfit" class="featured-profit-stats">
              <div class="fps-item">
                <span class="fps-label">Marge moy.</span>
                <span class="fps-val" :class="topProfit.avgMargin >= 0 ? 't-success' : 't-danger'">
                  {{ topProfit.avgMargin >= 0 ? '+' : '' }}{{ topProfit.avgMargin.toFixed(1) }}%
                </span>
              </div>
              <div class="fps-item">
                <span class="fps-label">Meilleure ville</span>
                <span class="fps-val t-gold">{{ topProfit.bestCity }}</span>
              </div>
              <div class="fps-item">
                <span class="fps-label">Villes calculées</span>
                <span class="fps-val t-mono">{{ topProfit.citiesCount }}</span>
              </div>
            </div>
            <div class="row" style="margin-top:16px;gap:10px">
              <NuxtLink v-if="topProfit" :to="`/items/${topProfit.uniqueName}`" class="ds-btn primary">
                Voir détails
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </NuxtLink>
              <NuxtLink :to="topProfit ? `/items/profit?q=${encodeURIComponent(topProfit.name)}` : '/items/profit'" class="ds-btn">
                Analyse de profit
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats panel -->
      <div class="panel">
        <div class="panel-header">
          <h3>État du codex</h3>
          <span v-if="statsData" class="status live">Synchronisé</span>
          <span v-else class="status">Chargement…</span>
        </div>
        <div class="home-stats">
          <div v-for="s in codexStats" :key="s.k" class="home-stat">
            <div class="hs-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="s.iconPaths" />
            </div>
            <div class="hs-meta">
              <div class="hs-k">{{ s.k }}</div>
              <div class="hs-v t-mono">{{ s.v }}</div>
              <div class="hs-d">{{ s.d }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Activity feed -->
    <div class="panel home-activity" style="margin-top:16px">
      <div class="panel-header">
        <h3>Mises à jour récentes</h3>
        <NuxtLink to="/admin" class="ds-btn ghost sm">Tout voir <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></NuxtLink>
      </div>
      <div style="padding:0">
        <div v-if="!activityData || activityData.length === 0" class="act-row">
          <span class="t-mono t-dim" style="font-size:11px">—</span>
          <span class="tag info" style="justify-content:center">INFO</span>
          <span style="color:var(--text-1);font-size:13px">Aucun job d'import récent.</span>
        </div>
        <div v-for="act in activityData" :key="act.id" class="act-row">
          <span class="t-mono t-dim" style="font-size:11px">{{ formatRelative(act.createdAt) }}</span>
          <span :class="`tag ${jobTag(act.status)}`" style="justify-content:center">{{ act.type.replace('_', ' ') }}</span>
          <span style="color:var(--text-1);font-size:13px">{{ jobLabel(act) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const query = ref('')

function goSearch() {
  if (!query.value.trim()) return
  router.push({ path: '/items', query: { q: query.value.trim() } })
}

const tools = [
  {
    title: 'Crafting Tree',
    desc: 'Calculez le coût total et la marge de tous vos crafts.',
    route: '/crafting',
    tag: 'Outil phare',
    iconPaths: '<path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
  },
  {
    title: 'Marché en direct',
    desc: 'Prix par cité, historique et arbitrages détectés.',
    route: '/market',
    tag: 'Live',
    iconPaths: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/>',
  },
  {
    title: 'Base de données',
    desc: 'Items indexés, stats, traductions, sets.',
    route: '/items',
    tag: null,
    iconPaths: '<path d="M4 19.5V4a2 2 0 0 1 2-2h13v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2.5z"/><path d="M9 2v18"/>',
  },
  {
    title: 'Administration',
    desc: "Suivez vos workers et l'état de la base.",
    route: '/admin',
    tag: null,
    iconPaths: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  },
]

// Real data
const { data: statsRaw } = await useFetch('/api/v1/stats')
const { data: activityRaw } = await useFetch('/api/v1/activity')
const { data: topProfitRaw } = useTopProfit()

const statsData = computed(() => (statsRaw.value as any)?.data ?? null)
const activityData = computed(() => (activityRaw.value as any)?.data ?? [])
const topProfitItems = computed(() => topProfitRaw.value ?? [])
const topProfit = computed(() => topProfitItems.value[0] ?? null)
const trendingItems = computed(() => topProfitItems.value.slice(1, 5))

function fmtNumber(n: number | null | undefined): string {
  if (n == null) return '…'
  return n.toLocaleString('fr-FR')
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'à l\'instant'
  if (mins < 60) return `il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `il y a ${hrs} h`
  return `il y a ${Math.floor(hrs / 24)} j`
}

function jobTag(status: string): string {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'RUNNING') return 'info'
  return 'gold'
}

function jobLabel(act: any): string {
  if (act.status === 'SUCCESS') {
    const parts: string[] = []
    if (act.itemsCreated > 0) parts.push(`${fmtNumber(act.itemsCreated)} créés`)
    if (act.itemsUpdated > 0) parts.push(`${fmtNumber(act.itemsUpdated)} mis à jour`)
    if (act.itemsProcessed > 0 && parts.length === 0) parts.push(`${fmtNumber(act.itemsProcessed)} traités`)
    return parts.length > 0 ? parts.join(', ') + '.' : 'Import terminé.'
  }
  if (act.status === 'FAILED') return 'Import échoué.'
  if (act.status === 'RUNNING') return 'Import en cours…'
  return 'Import en attente.'
}

const codexStats = computed(() => {
  const d = statsData.value
  const lastImport = d?.lastImport
  const lastSync = lastImport?.completedAt
    ? formatRelative(lastImport.completedAt)
    : 'Jamais'

  return [
    {
      k: 'Items indexés',
      v: fmtNumber(d?.totalItems),
      d: lastImport ? `Dernier import ${lastSync}` : 'Aucun import',
      iconPaths: '<path d="M4 19.5V4a2 2 0 0 1 2-2h13v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2.5z"/><path d="M9 2v18"/>',
    },
    {
      k: 'Recettes connues',
      v: fmtNumber(d?.totalRecipes),
      d: 'Craft + raffinage',
      iconPaths: '<path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
    },
  ]
})
</script>

<style scoped>
.featured-profit-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(201, 161, 74, 0.06);
  border: 1px solid rgba(201, 161, 74, 0.18);
  border-radius: var(--radius);
}

.fps-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fps-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  font-family: var(--font-display);
}

.fps-val {
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font-mono);
}

.t-success { color: var(--success); }
.t-danger  { color: var(--danger); }
.t-gold    { color: var(--gold); }
</style>
