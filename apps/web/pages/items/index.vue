<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Codex
        </div>
        <h1>Codex des items</h1>
        <p class="t-muted" style="margin-top:6px">{{ total.toLocaleString('fr-FR') }} items · 21 langues</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="items-filters">
      <div class="filter-pillbox">
        <span class="fpl">Tier</span>
        <button v-for="t in [1,2,3,4,5,6,7,8]" :key="t" class="filter-pill" :class="{ active: activeTiers.includes(t) }" @click="toggleTier(t)">T{{ t }}</button>
      </div>
      <div class="row" style="margin-left:auto;gap:8px">
        <div class="nav-search" style="width:240px">
          <span class="ic-search">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input v-model="searchQ" type="text" placeholder="Rechercher…" @input="debouncedSearch" style="padding-right:12px" />
        </div>
      </div>
    </div>

    <!-- Layout: sidenav + grid -->
    <div class="items-layout">
      <aside class="side-cat">
        <div class="sidenav-section">
          <h5>Catalogue</h5>
          <button class="side-link" :class="{ active: !activeCategoryId }" @click="clearCategory">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="ic"><path d="M5 7h14l-1 14H6z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
            <span class="lbl">Tous les objets</span>
            <span class="badge">{{ total > 0 ? total.toLocaleString('fr-FR') : '…' }}</span>
          </button>
        </div>
        <div class="sidenav-section">
          <h5>Par catégorie</h5>
          <div v-for="(cat, ci) in categories" :key="cat.id" class="acc-group" :class="{ open: openCats.includes(ci) }">
            <button
              class="acc-head"
              :class="{ active: activeCategoryId === cat.id }"
              @click="toggleRootCat(ci, cat.id)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="ic" v-html="cat.iconPaths" />
              <span class="lbl">{{ cat.name }}</span>
              <span class="badge">{{ cat.count.toLocaleString('fr-FR') }}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chev"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="acc-body">
              <div class="acc-inner">
                <CategoryNavItem
                  v-for="child in cat.children"
                  :key="child.id"
                  :cat="child"
                  :active-id="activeCategoryId"
                  :depth="1"
                  @select="selectCategory"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div style="min-width:0">
        <!-- Skeleton -->
        <div v-if="loading" class="items-grid">
          <div v-for="i in 24" :key="i" class="skel" style="height:100px;border-radius:var(--radius)" />
        </div>

        <!-- Empty -->
        <div v-else-if="items.length === 0" class="panel" style="padding:48px;text-align:center;color:var(--text-3)">
          <p style="font-size:15px;margin-bottom:6px">Aucun item trouvé</p>
          <p style="font-size:13px">Ajustez vos filtres de recherche</p>
        </div>

        <!-- Grid -->
        <div v-else class="items-grid">
          <NuxtLink v-for="item in items" :key="item.id" :to="`/items/${item.uniqueName}`" class="ig-card">
            <div :class="`item-frame q-${tierQualityClass(item.tier)}`" style="width:72px;height:72px;flex-shrink:0;position:relative">
              <img
                :src="`https://render.albiononline.com/v1/item/${item.uniqueName}.png`"
                :alt="item.name"
                loading="lazy"
              />
              <span :class="`tier-badge t${item.tier}`" style="position:absolute;left:4px;top:4px">T{{ item.tier }}</span>
            </div>
            <div class="ig-meta">
              <div class="ig-name">{{ item.name }}</div>
              <div class="ig-cat">{{ item.shopSubcategory ?? item.shopCategory ?? item.itemType ?? '—' }}</div>
              <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">
                <span v-if="item.isCraftable" class="tag success" style="font-size:10px;padding:1px 5px">Craft</span>
                <span v-if="item.isRefinable" class="tag info" style="font-size:10px;padding:1px 5px">Raffinage</span>
                <span v-if="item.enchantmentLevel > 0" class="tag gold" style="font-size:10px;padding:1px 5px">.{{ item.enchantmentLevel }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Pagination -->
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

interface ApiCategory {
  id: string
  slug: string
  name: string
  count: number
  children: ApiCategory[]
}

interface Item {
  id: string
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  itemType?: string
  shopCategory?: string
  shopSubcategory?: string
  isCraftable: boolean
  isRefinable: boolean
  iconUrl?: string
}

// ── Icons par slug de catégorie ───────────────────────────────────────────
const CAT_ICONS: Record<string, string> = {
  melee:      '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/>',
  ranged:     '<path d="m3 11 19-9-9 19-2-8-8-2z"/>',
  magic:      '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/>',
  support:    '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
  cursed:     '<path d="M12 2a5 5 0 0 1 5 5c0 3-2 5.5-5 7-3-1.5-5-4-5-7a5 5 0 0 1 5-5z"/><path d="M12 14v8M8 18h8"/>',
  armors:     '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  bags:       '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/>',
  cape:       '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  mount:      '<path d="M19 7c0-1.1-.9-2-2-2h-1a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V7z"/><path d="M5 11V5h5l3 6H5zm0 0v4a1 1 0 0 0 1 1h2"/>',
  consumable: '<path d="M12 22c-4 0-7-3-7-7 0-3 2-5 3-7 1 2 3 3 4 5 0-2 1-3 1-5 2 1 6 5 6 11 0 4-3 7-7 7z"/>',
  resources:  '<path d="M3 9a9 9 0 0 1 9 9"/><path d="M3 5a13 13 0 0 1 13 13"/><circle cx="3" cy="19" r="2"/>',
  resource:   '<path d="M3 9a9 9 0 0 1 9 9"/><path d="M3 5a13 13 0 0 1 13 13"/><circle cx="3" cy="19" r="2"/>',
  gathering:  '<path d="M3 9a9 9 0 0 1 9 9"/><path d="M3 5a13 13 0 0 1 13 13"/><circle cx="3" cy="19" r="2"/>',
  furniture:  '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M6 19v2M18 19v2"/>',
  laborer:    '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
  farm:       '<path d="M11 20A7 7 0 0 1 4 13c0-4 3-9 9-9 0 4-1 13-2 16z"/><path d="M11 20c2-3 4-9 4-13"/>',
  journal:    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
}
const DEFAULT_ICON = '<rect x="3" y="3" width="18" height="18" rx="2"/>'

// ── State ─────────────────────────────────────────────────────────────────
const items = ref<Item[]>([])
const total = ref(0)
const loading = ref(true)
const nextCursor = ref<string | null>(null)
const cursorHistory = ref<string[]>([])
const searchQ = ref((route.query.q as string) ?? '')
const activeTiers = ref<number[]>([])
const activeCategoryId = ref<string | null>(null)
const openCats = ref<number[]>([])

let searchTimer: ReturnType<typeof setTimeout> | null = null

// ── Categories from DB ────────────────────────────────────────────────────
const { data: catData } = useFetch<ApiCategory[]>('/api/v1/categories', {
  query: { locale: 'FR-FR' },
})

const categories = computed(() =>
  (catData.value ?? []).map((cat) => ({
    ...cat,
    iconPaths: CAT_ICONS[cat.slug] ?? DEFAULT_ICON,
  }))
)

// ── Handlers ──────────────────────────────────────────────────────────────
function toggleTier(t: number) {
  const idx = activeTiers.value.indexOf(t)
  if (idx >= 0) activeTiers.value.splice(idx, 1)
  else activeTiers.value.push(t)
  resetAndLoad()
}

function toggleRootCat(idx: number, catId: string) {
  const oIdx = openCats.value.indexOf(idx)
  if (oIdx >= 0) openCats.value.splice(oIdx, 1)
  else openCats.value.push(idx)
  activeCategoryId.value = activeCategoryId.value === catId ? null : catId
  resetAndLoad()
}

function selectCategory(id: string) {
  activeCategoryId.value = activeCategoryId.value === id ? null : id
  resetAndLoad()
}

function clearCategory() {
  activeCategoryId.value = null
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
    else if (activeTiers.value.length > 1) q.tiers = activeTiers.value.join(',')
    if (activeCategoryId.value) q.categoryId = activeCategoryId.value
    if (cursor) q.cursor = cursor

    const res = await $fetch<{ data: any[]; meta: { total: number; nextCursor: string | null } }>('/api/v1/items', { query: q })

    items.value = (res.data ?? []).map((i: any) => ({
      id: i.id,
      uniqueName: i.uniqueName,
      name: i.name ?? i.uniqueName,
      tier: i.tier,
      enchantmentLevel: i.enchantmentLevel ?? 0,
      itemType: i.itemType,
      shopCategory: i.shopCategory,
      shopSubcategory: i.shopSubcategory,
      isCraftable: i.isCraftable ?? false,
      isRefinable: i.isRefinable ?? false,
      iconUrl: i.iconUrl,
    }))
    total.value = res.meta?.total ?? items.value.length
    nextCursor.value = res.meta?.nextCursor ?? null
  } catch (e) {
    console.error(e)
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

function tierQualityClass(tier: number) {
  if (tier >= 8) return 'masterpiece'
  if (tier >= 7) return 'excellent'
  if (tier >= 6) return 'outstanding'
  if (tier >= 5) return 'good'
  return 'normal'
}

onMounted(() => {
  if (route.query.q) searchQ.value = route.query.q as string
  loadItems()
})
</script>
