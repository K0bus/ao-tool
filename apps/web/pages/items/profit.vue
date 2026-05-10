<template>
  <div class="page profit-page">
    <div class="page-header">
      <div>
        <div class="breadcrumb">
          <NuxtLink to="/">Accueil</NuxtLink>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <span>Analyse de profit</span>
        </div>
        <h1 class="page-title">Analyse de profit craft</h1>
        <p class="page-sub">Rentabilité du craft direct sur tous les items craftables · tri global par profit.</p>
      </div>
    </div>

    <!-- Settings Panel -->
    <div class="panel settings-panel">
      <div class="panel-header"><h3>Paramètres de calcul</h3></div>
      <div class="panel-body settings-body">
        <div class="settings-grid">

          <div class="field">
            <label class="field-label">Ville</label>
            <select v-model="city" class="ds-input" @change="reloadPage1">
              <option v-for="c in CITIES" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label">Qualité vente</label>
            <select v-model="quality" class="ds-input" @change="reloadPage1">
              <option :value="1">Normale (Q1)</option>
              <option :value="2">Bonne (Q2)</option>
              <option :value="3">Excellente (Q3)</option>
              <option :value="4">Exceptionnelle (Q4)</option>
              <option :value="5">Chef-d'œuvre (Q5)</option>
            </select>
          </div>

          <div class="field">
            <label class="field-label">
              Frais de craft
              <span class="t-mono t-gold" style="margin-left:6px">{{ craftFeePercent.toFixed(1) }}%</span>
            </label>
            <input v-model.number="craftFeePercent" type="range" class="range" min="0" max="25" step="0.5" @input="debouncedReload" />
          </div>

          <div class="settings-toggles">
            <div class="toggle-row">
              <span class="label">Focus point</span>
              <label class="ds-switch">
                <input v-model="useFocus" type="checkbox" @change="reloadPage1" />
                <span class="ds-track"><span class="ds-thumb"></span></span>
              </label>
            </div>
            <div class="toggle-row">
              <span class="label">Bonus de ville</span>
              <label class="ds-switch">
                <input v-model="useCityBonus" type="checkbox" @change="reloadPage1" />
                <span class="ds-track"><span class="ds-thumb"></span></span>
              </label>
            </div>
            <div class="toggle-row">
              <span class="label">Taxe marché (4%)</span>
              <label class="ds-switch">
                <input v-model="includeTax" type="checkbox" @change="reloadPage1" />
                <span class="ds-track"><span class="ds-thumb"></span></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="items-filters" style="margin-top:16px;flex-wrap:wrap;gap:8px">
      <div class="filter-pillbox">
        <span class="fpl">Tier</span>
        <button
          v-for="t in [1,2,3,4,5,6,7,8]"
          :key="t"
          class="filter-pill"
          :class="{ active: activeTiers.includes(t) }"
          @click="toggleTier(t)"
        >T{{ t }}</button>
      </div>

      <!-- Category button -->
      <button class="cat-filter-btn" :class="{ 'has-value': activeCategoryId }" @click="showCatModal = true">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>{{ activeCategoryLabel || 'Catégorie' }}</span>
        <span v-if="activeCategoryId" class="cat-clear" @click.stop="clearCategory">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </span>
        <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-left:2px;opacity:.5"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      <div class="row" style="margin-left:auto;gap:8px;align-items:center">
        <label class="field-label" style="margin:0;white-space:nowrap">Trier par</label>
        <select v-model="sortBy" class="ds-input" style="width:160px" @change="reloadPage1">
          <option value="profit">Profit</option>
          <option value="margin">Marge %</option>
          <option value="sellRevenue">Prix vente</option>
          <option value="ingredientCost">Coût matières</option>
        </select>
        <div class="nav-search" style="width:240px">
          <span class="ic-search">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input v-model="searchQ" type="text" placeholder="Rechercher un item…" @input="debouncedSearch" style="padding-right:12px" />
        </div>
      </div>
    </div>

    <!-- Category modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCatModal" class="modal-overlay" @click.self="showCatModal = false">
          <div class="cat-modal">
            <div class="cat-modal-head">
              <span>Filtrer par catégorie</span>
              <button class="cat-modal-close" @click="showCatModal = false">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="cat-modal-search">
              <span class="ic-search">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              </span>
              <input v-model="catSearch" type="text" placeholder="Filtrer les catégories…" class="cat-search-input" />
            </div>
            <div class="cat-modal-body">
              <button
                class="cat-modal-all"
                :class="{ active: !activeCategoryId }"
                @click="clearCategory"
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 7h14l-1 14H6z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>
                <span>Tous les items craftables</span>
              </button>
              <div
                v-for="(cat, ci) in filteredCategories"
                :key="cat.id"
                class="cat-group"
                :class="{ open: openModalCats.includes(ci) }"
              >
                <button
                  class="cat-group-head"
                  :class="{ active: activeCategoryId === cat.id }"
                  @click="toggleModalCat(ci, cat.id)"
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" v-html="cat.iconPaths" />
                  <span class="cat-name">{{ cat.name }}</span>
                  <span class="cat-count">{{ cat.count.toLocaleString('fr-FR') }}</span>
                  <svg v-if="cat.children.length" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="cat-chev"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div v-if="cat.children.length" class="cat-children">
                  <button
                    v-for="child in cat.children"
                    :key="child.id"
                    class="cat-child-btn"
                    :class="{ active: activeCategoryId === child.id }"
                    @click="selectCategory(child.id, child.name)"
                  >
                    <span class="cat-name">{{ child.name }}</span>
                    <span class="cat-count">{{ child.count.toLocaleString('fr-FR') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Capped warning -->
    <div v-if="meta.capped" class="panel" style="margin-top:12px;padding:10px 16px;border-color:rgba(201,161,74,0.3)">
      <span style="font-size:12px;color:var(--gold)">
        ⚠ Trop d'items sans filtre — seuls les 2 000 premiers ont été analysés. Affinez avec un tier ou une catégorie pour un tri complet.
      </span>
    </div>

    <!-- Table -->
    <div class="panel" style="margin-top:16px;overflow:hidden">

      <div v-if="loading" class="profit-empty">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold);animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>Calcul en cours…</span>
      </div>

      <div v-else-if="items.length === 0" class="profit-empty">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--text-3)"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        <span>Aucun item craftable trouvé pour ces filtres.</span>
      </div>

      <template v-else>
        <div class="profit-table-wrap">
          <table class="profit-table">
            <thead>
              <tr>
                <th class="col-item">Item</th>
                <th class="col-num">Matières brut</th>
                <th class="col-num">Retour mat.</th>
                <th class="col-num">Frais craft</th>
                <th class="col-num">Coût net</th>
                <th class="col-num">Prix vente</th>
                <th class="col-num col-profit">Profit</th>
                <th class="col-num col-margin">Marge</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in items"
                :key="row.id"
                class="profit-row"
                :class="{ 'row-uncalculable': row.calc.profit === null }"
                @click="$router.push(`/items/${row.uniqueName}`)"
              >
                <td class="col-item">
                  <div class="item-cell">
                    <div class="item-frame" style="width:40px;height:40px;flex-shrink:0;position:relative">
                      <img
                        :src="`https://render.albiononline.com/v1/item/${row.uniqueName}.png`"
                        :alt="row.name"
                        loading="lazy"
                      />
                      <span :class="`tier-badge t${row.tier}`" style="position:absolute;left:3px;top:3px;font-size:9px;padding:0 3px">T{{ row.tier }}</span>
                    </div>
                    <div class="item-info">
                      <span class="item-name">{{ row.name }}</span>
                      <div class="item-sub t-mono t-dim">{{ row.uniqueName }}</div>
                      <span v-if="row.enchantmentLevel > 0" class="tag gold" style="font-size:9px;padding:0 4px;margin-top:2px">.{{ row.enchantmentLevel }}</span>
                    </div>
                  </div>
                </td>

                <td class="col-num">
                  <span v-if="row.calc.ingredientCost > 0">{{ fmt(row.calc.ingredientCost + row.calc.returnSavings) }} ◇</span>
                  <span v-else class="t-dim">—</span>
                  <span v-if="row.calc.missingPrices" class="missing-badge">incomplet</span>
                </td>

                <td class="col-num t-success">
                  <span v-if="row.calc.returnSavings > 0">−{{ fmt(row.calc.returnSavings) }} ◇</span>
                  <span v-else class="t-dim">—</span>
                </td>

                <td class="col-num t-dim">
                  <span v-if="row.calc.craftFee > 0">+{{ fmt(row.calc.craftFee) }} ◇</span>
                  <span v-else class="t-dim">—</span>
                </td>

                <td class="col-num">
                  <span v-if="row.calc.netCost > 0">{{ fmt(row.calc.netCost) }} ◇</span>
                  <span v-else class="t-dim">—</span>
                </td>

                <td class="col-num">
                  <span v-if="row.calc.sellRevenue">{{ fmt(row.calc.sellRevenue) }} ◇</span>
                  <span v-else class="t-dim">—</span>
                </td>

                <td class="col-num col-profit">
                  <template v-if="row.calc.profit !== null">
                    <span :class="row.calc.profit >= 0 ? 'profit-pos' : 'profit-neg'">
                      {{ row.calc.profit >= 0 ? '+' : '' }}{{ fmt(row.calc.profit) }} ◇
                    </span>
                  </template>
                  <span v-else class="uncalculable-label">
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    Non calculable
                  </span>
                </td>

                <td class="col-num col-margin">
                  <template v-if="row.calc.margin !== null">
                    <span :class="row.calc.margin >= 0 ? 'margin-pos' : 'margin-neg'">
                      {{ row.calc.margin.toFixed(1) }}%
                    </span>
                  </template>
                  <span v-else class="t-dim">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-bar">
          <span class="t-dim" style="font-size:12px">
            {{ meta.total.toLocaleString('fr-FR') }} items · page {{ meta.page }} / {{ meta.totalPages }}
          </span>
          <div style="display:flex;gap:8px">
            <button class="ds-btn sm" :disabled="meta.page <= 1 || loading" @click="goPage(meta.page - 1)">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 5l-7 7 7 7"/></svg>
              Précédent
            </button>
            <button class="ds-btn sm" :disabled="meta.page >= meta.totalPages || loading" @click="goPage(meta.page + 1)">
              Suivant
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Analyse de profit — Albion Codex' })

// ── Types ─────────────────────────────────────────────────────────────────

interface ProfitRow {
  id: string
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  iconUrl: string | null
  sellPrice: number | null
  cityBonus: number
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

interface Meta {
  total: number
  page: number
  totalPages: number
  capped: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Martlock', 'Thetford']

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

// ── Settings (persisted) ──────────────────────────────────────────────────

const city             = useLocalStorage('profit:city', 'Caerleon')
const quality          = useLocalStorage('profit:quality', 1)
const craftFeePercent  = useLocalStorage('profit:craftFeePercent', 8.5)
const useFocus         = useLocalStorage('profit:useFocus', true)
const useCityBonus     = useLocalStorage('profit:useCityBonus', true)
const includeTax       = useLocalStorage('profit:includeTax', true)

// ── Categories ────────────────────────────────────────────────────────────

interface ApiCategory {
  id: string
  slug: string
  name: string
  count: number
  children: ApiCategory[]
}

const showCatModal      = ref(false)
const catSearch         = ref('')
const openModalCats     = ref<number[]>([])
const activeCategoryId    = useLocalStorage<string | null>('profit:categoryId', null)
const activeCategoryLabel = useLocalStorage<string | null>('profit:categoryLabel', null)

const { data: catData } = useFetch<ApiCategory[]>('/api/v1/categories', {
  query: { locale: 'FR-FR' },
})

const categories = computed(() =>
  (catData.value ?? []).map((cat) => ({
    ...cat,
    iconPaths: CAT_ICONS[cat.slug] ?? DEFAULT_ICON,
  }))
)

const filteredCategories = computed(() => {
  const q = catSearch.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value
    .map((cat) => ({
      ...cat,
      children: cat.children.filter((c) => c.name.toLowerCase().includes(q)),
    }))
    .filter((cat) => cat.name.toLowerCase().includes(q) || cat.children.length > 0)
})

function toggleModalCat(idx: number, catId: string) {
  const i = openModalCats.value.indexOf(idx)
  if (i >= 0) openModalCats.value.splice(i, 1)
  else openModalCats.value.push(idx)
  // Clicking root also selects it
  selectCategory(catId, categories.value.find((c) => c.id === catId)?.name ?? catId)
}

function selectCategory(id: string, label: string) {
  if (activeCategoryId.value === id) {
    activeCategoryId.value = null
    activeCategoryLabel.value = null
  } else {
    activeCategoryId.value = id
    activeCategoryLabel.value = label
  }
  showCatModal.value = false
  reloadPage1()
}

function clearCategory() {
  activeCategoryId.value = null
  activeCategoryLabel.value = null
  showCatModal.value = false
  reloadPage1()
}

// Close modal on Escape
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') showCatModal.value = false
  })
})

// ── Filters / sort (persisted) ────────────────────────────────────────────

const searchQ    = ref('')
const activeTiers = useLocalStorage<number[]>('profit:activeTiers', [])
const sortBy     = useLocalStorage<'profit' | 'margin' | 'sellRevenue' | 'ingredientCost'>('profit:sortBy', 'profit')

// ── Data ─────────────────────────────────────────────────────────────────

const items = ref<ProfitRow[]>([])
const loading = ref(true)
const meta = ref<Meta>({ total: 0, page: 1, totalPages: 1, capped: false })

// ── API ───────────────────────────────────────────────────────────────────

function buildQuery(page: number) {
  const q: Record<string, string | number> = {
    location: city.value,
    quality: quality.value,
    useFocus: String(useFocus.value),
    useCityBonus: String(useCityBonus.value),
    craftFeePercent: craftFeePercent.value,
    includeTax: String(includeTax.value),
    sortBy: sortBy.value,
    page,
    limit: 48,
  }
  if (searchQ.value.trim().length >= 2) q.q = searchQ.value.trim()
  if (activeTiers.value.length === 1) q.tier = activeTiers.value[0]
  else if (activeTiers.value.length > 1) q.tier = activeTiers.value[0] // TODO: multi-tier API support
  if (activeCategoryId.value) q.categoryId = activeCategoryId.value
  return q
}

async function loadItems(page: number) {
  loading.value = true
  try {
    const res = await $fetch<{ data: ProfitRow[]; meta: Meta }>(
      '/api/v1/items/profit',
      { query: buildQuery(page) }
    )
    items.value = res.data ?? []
    meta.value = res.meta ?? { total: 0, page: 1, totalPages: 1, capped: false }
  } catch (e) {
    console.error(e)
    items.value = []
  } finally {
    loading.value = false
  }
}

function reloadPage1() {
  loadItems(1)
}

function goPage(p: number) {
  loadItems(p)
}

// ── Debouncing ────────────────────────────────────────────────────────────

let reloadTimer: ReturnType<typeof setTimeout> | null = null

function debouncedReload() {
  if (reloadTimer) clearTimeout(reloadTimer)
  reloadTimer = setTimeout(reloadPage1, 350)
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(reloadPage1, 280)
}

// ── Filters ───────────────────────────────────────────────────────────────

function toggleTier(t: number) {
  const idx = activeTiers.value.indexOf(t)
  if (idx >= 0) activeTiers.value.splice(idx, 1)
  else activeTiers.value.push(t)
  reloadPage1()
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(v: number) {
  if (!v) return '0'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'k'
  return Math.round(v).toLocaleString('fr-FR')
}

onMounted(() => {
  const route = useRoute()
  if (route.query.q) searchQ.value = route.query.q as string
  reloadPage1()
})
</script>

<style scoped>
/* ── Settings ──────────────────────────────────────────────────────────── */

.settings-body {
  padding: 16px 20px 20px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 180px 200px 1fr auto;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .settings-grid { grid-template-columns: 1fr 1fr; }
  .settings-toggles { grid-column: 1 / -1; flex-direction: row; flex-wrap: wrap; gap: 16px; }
}

.settings-toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 2px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toggle-row .label {
  font-size: 12px;
  color: var(--text-2);
}

.range {
  width: 100%;
  accent-color: var(--gold);
  cursor: pointer;
  height: 4px;
  background: var(--bg-4);
  border-radius: 2px;
  outline: none;
  margin-top: 6px;
}

/* ── Table ────────────────────────────────────────────────────────────── */

.profit-table-wrap {
  overflow-x: auto;
}

.profit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.profit-table thead th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-3);
  border-bottom: 1px solid var(--border);
  background: var(--bg-2);
  white-space: nowrap;
}

.col-num { text-align: right !important; }

.profit-table tbody tr {
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.1s;
  cursor: pointer;
}

.profit-table tbody tr:hover { background: rgba(201, 161, 74, 0.07); }

.profit-table tbody td {
  padding: 10px 14px;
  vertical-align: middle;
  white-space: nowrap;
  font-size: 12.5px;
  font-family: var(--font-mono);
  color: var(--text-2);
}

.row-uncalculable { opacity: 0.5; }

/* ── Item cell ────────────────────────────────────────────────────────── */

.item-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.item-info { min-width: 0; }

.item-name {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.item-sub {
  font-size: 10px;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* ── Profit / margin colors ───────────────────────────────────────────── */

.col-profit, .col-margin { font-weight: 600; }

.profit-pos { color: var(--success); }
.profit-neg { color: var(--danger); }
.margin-pos { color: var(--gold); }
.margin-neg { color: var(--danger); }
.t-success   { color: var(--success); }

/* ── "Non calculable" label ───────────────────────────────────────────── */

.uncalculable-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-family: var(--font-body);
  color: var(--text-4);
  font-style: italic;
  letter-spacing: 0.01em;
}

/* ── Missing prices badge ─────────────────────────────────────────────── */

.missing-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  padding: 1px 5px;
  background: rgba(176, 74, 50, 0.12);
  border: 1px solid rgba(176, 74, 50, 0.25);
  color: var(--danger);
  border-radius: 3px;
  font-family: var(--font-body);
  letter-spacing: 0.03em;
  vertical-align: middle;
}

/* ── Empty ────────────────────────────────────────────────────────────── */

.profit-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  color: var(--text-3);
  font-size: 14px;
}

/* ── Pagination ───────────────────────────────────────────────────────── */

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-top: 1px solid var(--border-subtle);
}

/* ── Category filter button ───────────────────────────────────────────── */

.cat-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 32px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-2);
  color: var(--text-2);
  font-size: 12.5px;
  cursor: pointer;
  transition: border-color .15s, color .15s;
  white-space: nowrap;
}
.cat-filter-btn:hover { border-color: var(--gold); color: var(--text-0); }
.cat-filter-btn.has-value { border-color: rgba(201,161,74,.5); color: var(--gold); background: rgba(201,161,74,.06); }

.cat-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(201,161,74,.15);
  color: var(--gold);
  margin-left: 2px;
}
.cat-clear:hover { background: rgba(201,161,74,.3); }

/* ── Modal overlay ────────────────────────────────────────────────────── */

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
}

.cat-modal {
  width: 480px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 120px);
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg, 10px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.6);
}

.cat-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-0);
  flex-shrink: 0;
}

.cat-modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: none;
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: background .1s, color .1s;
}
.cat-modal-close:hover { background: var(--bg-4); color: var(--text-0); }

.cat-modal-search {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.cat-modal-search .ic-search {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-4);
  pointer-events: none;
}
.cat-search-input {
  width: 100%;
  padding: 6px 10px 6px 32px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-0);
  font-size: 12.5px;
  outline: none;
  box-sizing: border-box;
}
.cat-search-input:focus { border-color: rgba(201,161,74,.4); }

.cat-modal-body {
  overflow-y: auto;
  padding: 8px 0;
  flex: 1;
}

.cat-modal-all {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text-2);
  font-size: 12.5px;
  cursor: pointer;
  text-align: left;
  transition: background .1s, color .1s;
}
.cat-modal-all:hover { background: var(--bg-3); color: var(--text-0); }
.cat-modal-all.active { color: var(--gold); background: rgba(201,161,74,.06); }

/* ── Category accordion ───────────────────────────────────────────────── */

.cat-group-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text-1);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background .1s, color .1s;
}
.cat-group-head:hover { background: var(--bg-3); color: var(--text-0); }
.cat-group-head.active { color: var(--gold); background: rgba(201,161,74,.06); }

.cat-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cat-count { font-size: 11px; color: var(--text-4); margin-left: auto; flex-shrink: 0; }

.cat-chev { flex-shrink: 0; transition: transform .2s; color: var(--text-4); }
.cat-group.open .cat-chev { transform: rotate(180deg); }

.cat-children { display: none; }
.cat-group.open .cat-children { display: block; }

.cat-child-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px 6px 40px;
  background: transparent;
  border: none;
  color: var(--text-2);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: background .1s, color .1s;
}
.cat-child-btn:hover { background: var(--bg-3); color: var(--text-0); }
.cat-child-btn.active { color: var(--gold); background: rgba(201,161,74,.06); }

/* ── Modal transition ─────────────────────────────────────────────────── */

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity .18s ease;
}
.modal-fade-enter-active .cat-modal, .modal-fade-leave-active .cat-modal {
  transition: transform .18s ease, opacity .18s ease;
}
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .cat-modal, .modal-fade-leave-to .cat-modal {
  transform: translateY(-12px);
  opacity: 0;
}

/* ── Misc ─────────────────────────────────────────────────────────────── */

.page-title { font-family: var(--font-display); }
.page-sub   { color: var(--text-3); margin-top: 4px; font-size: 13px; }

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 8px;
}
.breadcrumb a:hover { color: var(--gold); }
</style>
