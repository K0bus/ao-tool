<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Codex
        </div>
        <h1>Codex des items</h1>
        <p class="t-muted" style="margin-top:6px">{{ total.toLocaleString('fr-FR') }} items · 3 187 recettes · 21 langues</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="items-filters">
      <div class="filter-pillbox">
        <span class="fpl">Tier</span>
        <button v-for="t in [1,2,3,4,5,6,7,8]" :key="t" class="filter-pill" :class="{ active: activeTiers.includes(t) }" @click="toggleTier(t)">T{{ t }}</button>
      </div>
      <div class="row" style="margin-left:auto;gap:8px">
        <div class="view-switch">
          <button class="vs active"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></button>
        </div>
        <div class="nav-search" style="width:220px">
          <span class="ic-search"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></span>
          <input v-model="searchQ" type="text" placeholder="Rechercher…" @input="debouncedSearch" style="padding-right:12px" />
        </div>
      </div>
    </div>

    <!-- Layout: sidenav + grid -->
    <div class="items-layout">
      <aside class="side-cat">
        <div class="sidenav-section">
          <h5>Catalogue</h5>
          <button class="side-link" :class="{ active: !activeCategory }" @click="clearCategory">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M5 7h14l-1 14H6z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
            <span class="lbl">Tous les objets</span>
            <span class="badge">{{ total > 0 ? total.toLocaleString('fr-FR') : '…' }}</span>
          </button>
        </div>
        <div class="sidenav-section">
          <h5>Par catégorie</h5>
          <div v-for="(cat, ci) in categories" :key="cat.name" class="acc-group" :class="{ open: openCats.includes(ci) }">
            <button class="acc-head" :class="{ active: activeCategory === cat.name }" @click="toggleCat(ci, cat.name)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="ic" v-html="cat.iconPaths" />
              <span class="lbl">{{ cat.name }}</span>
              <span class="badge">{{ cat.count }}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chev"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="acc-body">
              <div class="acc-inner">
                <button v-for="sub in cat.subs" :key="sub.name" class="side-sub" :class="{ active: activeSubCategory === sub.name }" @click.stop="selectSub(cat.name, sub.name)">
                  <span class="dot" /><span class="lbl">{{ sub.name }}</span><span class="badge">{{ sub.count }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div>
        <div v-if="loading" class="items-grid">
          <div v-for="i in 18" :key="i" class="skeleton" style="height:100px;border-radius:var(--radius)" />
        </div>
        <div v-else-if="items.length === 0" class="panel" style="padding:48px;text-align:center;color:var(--text-3)">
          <p style="font-size:15px;margin-bottom:6px">Aucun item trouvé</p>
          <p style="font-size:13px">Ajustez vos filtres de recherche</p>
        </div>
        <div v-else class="items-grid">
          <NuxtLink v-for="item in items" :key="item.id" :to="`/items/${item.uniqueName}`" class="ig-card">
            <div :class="`item-frame q-${qualityClass(item.tier)}`" style="width:72px;height:72px;flex-shrink:0;position:relative">
              <img :src="item.iconUrl ?? `https://render.albiononline.com/v1/item/${item.uniqueName}.png`" :alt="item.name" loading="lazy" @error="(e:Event) => { const t = e.target as HTMLImageElement; t.src = `https://render.albiononline.com/v1/item/${item.uniqueName}.png` }" />
              <span :class="`tier-badge t${item.tier}`" style="position:absolute;left:4px;top:4px">T{{ item.tier }}</span>
            </div>
            <div class="ig-meta">
              <div class="ig-name">{{ item.name }}</div>
              <div class="ig-cat">{{ item.shopCategory ?? '—' }}</div>
              <div class="ig-price"><span class="t-mono">—</span><span style="font-size:12px;color:var(--gold)">◇</span></div>
            </div>
          </NuxtLink>
        </div>

        <div class="pagination">
          <span class="t-dim" style="margin-right:12px;font-size:12px">{{ total.toLocaleString('fr-FR') }} items</span>
          <button class="ds-btn sm" :disabled="cursorHistory.length === 0" @click="goPrev">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>
            Précédent
          </button>
          <button class="ds-btn sm" :disabled="!nextCursor" @click="goNext">
            Suivant
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()

interface Item { id: string; uniqueName: string; name: string; tier: number; shopCategory?: string; iconUrl?: string }

const items = ref<Item[]>([])
const total = ref(0)
const loading = ref(true)
const nextCursor = ref<string | null>(null)
const cursorHistory = ref<string[]>([])
const searchQ = ref((route.query.q as string) ?? '')
const activeTiers = ref<number[]>([])
const activeCategory = ref<string | null>(null)
const activeSubCategory = ref<string | null>(null)
const openCats = ref<number[]>([0])

let searchTimer: ReturnType<typeof setTimeout> | null = null

const categories = [
  { name: 'Armes', count: '508', iconPaths: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>',
    subs: [{ name: 'Épées', count: 84 }, { name: 'Haches', count: 76 }, { name: 'Marteaux', count: 64 }, { name: 'Arcs', count: 88 }, { name: 'Bâtons', count: 60 }, { name: 'Dagues', count: 72 }] },
  { name: 'Armures', count: '288', iconPaths: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    subs: [{ name: 'Tissu', count: 96 }, { name: 'Cuir', count: 96 }, { name: 'Plaque', count: 96 }] },
  { name: 'Outils', count: '32', iconPaths: '<path d="M14 14 4 24"/><path d="M14 14 22 6"/>',
    subs: [{ name: 'Pioches', count: 8 }, { name: 'Faucilles', count: 8 }, { name: 'Haches', count: 8 }] },
  { name: 'Ressources', count: '200', iconPaths: '<path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 9-9 0 4-1 13-2 16z"/><path d="M11 20c2-3 4-9 4-13"/>',
    subs: [{ name: 'Bois', count: 40 }, { name: 'Minerai', count: 40 }, { name: 'Fibre', count: 40 }, { name: 'Cuir brut', count: 40 }] },
  { name: 'Consommables', count: '104', iconPaths: '<path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 1 2 3 3 4 5 0-2 1-3 1-5 2 1 6 5 6 11 0 4-3 7-7 7z"/>',
    subs: [{ name: 'Nourriture', count: 56 }, { name: 'Potions', count: 48 }] },
]

function toggleTier(t: number) {
  const idx = activeTiers.value.indexOf(t)
  if (idx >= 0) activeTiers.value.splice(idx, 1)
  else activeTiers.value.push(t)
  resetAndLoad()
}
function toggleCat(idx: number, name: string) {
  const oIdx = openCats.value.indexOf(idx)
  if (oIdx >= 0) openCats.value.splice(oIdx, 1)
  else openCats.value.push(idx)
  activeCategory.value = activeCategory.value === name ? null : name
  activeSubCategory.value = null
  resetAndLoad()
}
function selectSub(cat: string, sub: string) {
  activeCategory.value = cat
  activeSubCategory.value = sub
  resetAndLoad()
}
function clearCategory() {
  activeCategory.value = null
  activeSubCategory.value = null
  resetAndLoad()
}
function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(resetAndLoad, 280)
}
function resetAndLoad() {
  cursorHistory.value = []
  nextCursor.value = null
  loadItems()
}
async function loadItems(cursor?: string) {
  loading.value = true
  try {
    const q: Record<string, string | number> = { limit: 24 }
    if (searchQ.value.trim().length >= 2) q.q = searchQ.value.trim()
    if (activeTiers.value.length === 1) q.tier = activeTiers.value[0]
    if (cursor) q.cursor = cursor
    const res = await $fetch<{ data: any }>('/api/v1/items', { query: q })
    const d = res.data
    items.value = (d.items ?? []).map((i: any) => ({
      id: i.id,
      uniqueName: i.uniqueName,
      name: i.name ?? i.localizations?.[0]?.name ?? i.uniqueName,
      tier: i.tier,
      shopCategory: i.shopCategory,
      iconUrl: i.iconUrl,
    }))
    total.value = d.total ?? items.value.length
    nextCursor.value = d.meta?.nextCursor ?? null
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}
function goPrev() {
  cursorHistory.value.pop()
  const c = cursorHistory.value[cursorHistory.value.length - 1]
  loadItems(c)
}
function goNext() {
  if (!nextCursor.value) return
  cursorHistory.value.push(nextCursor.value)
  loadItems(nextCursor.value)
}
function qualityClass(tier: number) {
  if (tier >= 8) return 'masterpiece'
  if (tier >= 7) return 'excellent'
  if (tier >= 6) return 'outstanding'
  if (tier >= 5) return 'good'
  return 'normal'
}
onMounted(() => loadItems())
</script>
