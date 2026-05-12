<template>
  <Teleport to="body">
    <div v-if="open" class="ipm-overlay" @click.self="$emit('close')">
      <div class="ipm-panel">
        <div class="ipm-header">
          <h3>Choisir — {{ slotLabel }}</h3>
          <button class="ipm-close" @click="$emit('close')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Filters -->
        <div class="ipm-filters">
          <div class="ipm-search-wrap">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ipm-search-ic"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              ref="searchEl"
              v-model="query"
              type="text"
              placeholder="Rechercher un item…"
              class="ipm-search"
              @input="onInput"
            />
          </div>
          <div class="ipm-tier-pills">
            <button
              v-for="t in [1,2,3,4,5,6,7,8]"
              :key="t"
              class="filter-pill sm"
              :class="{ active: activeTiers.includes(t) }"
              @click="toggleTier(t)"
            >T{{ t }}</button>
          </div>
        </div>

        <!-- Results -->
        <div class="ipm-results">
          <div v-if="loading" class="ipm-loading">
            <div v-for="i in 8" :key="i" class="skel" style="height:52px;border-radius:var(--radius)" />
          </div>
          <template v-else-if="results.length > 0">
            <button
              v-for="item in results"
              :key="item.uniqueName"
              class="ipm-row"
              @click="select(item)"
            >
              <div class="ipm-item-icon">
                <AoItemImage :unique-name="item.uniqueName" :display-name="item.name" :alt="item.name" />
              </div>
              <div class="ipm-item-meta">
                <div class="ipm-item-name">{{ item.name }}</div>
              </div>
              <span :class="`tier-badge t${item.tier}`">T{{ item.tier }}<template v-if="item.enchantmentLevel > 0">.{{ item.enchantmentLevel }}</template></span>
            </button>
          </template>
          <div v-else class="ipm-empty">
            {{ query.length >= 2 ? 'Aucun résultat pour "' + query + '"' : 'Tapez pour rechercher un item' }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { EquippedItem } from '~/composables/useBuildCreator'

const props = defineProps<{
  open: boolean
  slotLabel: string
  slotFilter?: { itemType?: string; category?: string; subcategory?: string }
}>()

const emit = defineEmits<{
  close: []
  select: [item: EquippedItem]
}>()

interface RawItem {
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  twoHanded?: boolean | null
  itemType?: string | null
  shopCategory?: string | null
  shopSubcategory?: string | null
  iconUrl?: string | null
}

const query = ref('')
const results = ref<RawItem[]>([])
const loading = ref(false)
const activeTiers = ref<number[]>([8])
const searchEl = ref<HTMLInputElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.open, (v) => {
  if (v) {
    query.value = ''
    results.value = []
    activeTiers.value = [8]
    nextTick(() => searchEl.value?.focus())
    doSearch()
  }
})

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doSearch, 280)
}

function toggleTier(t: number) {
  const idx = activeTiers.value.indexOf(t)
  if (idx >= 0) activeTiers.value.splice(idx, 1)
  else activeTiers.value.push(t)
  doSearch()
}

async function doSearch() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      limit: 40,
      tiers: activeTiers.value.join(','),
      excludeShopCategories: 'artefacts,vanity',
      excludeShopSubcategories: 'other',
    }
    if (query.value.length >= 2) params.q = query.value
    if (props.slotFilter?.itemType) params.itemType = props.slotFilter.itemType
    if (props.slotFilter?.category) params.category = props.slotFilter.category
    if (props.slotFilter?.subcategory) params.subcategory = props.slotFilter.subcategory

    const res = await $fetch<{ data: RawItem[] }>('/api/v1/items', { query: params })
    results.value = res.data
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function select(item: RawItem) {
  emit('select', {
    uniqueName: item.uniqueName,
    name: item.name,
    tier: item.tier,
    enchantmentLevel: item.enchantmentLevel,
    twoHanded: item.twoHanded,
    iconUrl: item.iconUrl,
    itemType: item.itemType,
    shopCategory: item.shopCategory,
    shopSubcategory: item.shopSubcategory,
  })
  emit('close')
}
</script>

<style scoped>
.ipm-overlay {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0,0,0,0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.ipm-panel {
  width: 100%;
  max-width: 520px;
  max-height: 80vh;
  background: var(--bg-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ipm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-divider);
}
.ipm-header h3 {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--text-0);
  margin: 0;
}

.ipm-close {
  padding: 4px;
  border-radius: 4px;
  color: var(--text-3);
  transition: color 0.1s;
}
.ipm-close:hover { color: var(--text-0); }

.ipm-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-divider);
}

.ipm-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.ipm-search-ic {
  position: absolute;
  left: 10px;
  color: var(--text-3);
  pointer-events: none;
}
.ipm-search {
  width: 100%;
  padding: 8px 10px 8px 32px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-0);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.ipm-search:focus { border-color: var(--gold-dim); }

.ipm-tier-pills {
  display: flex;
  gap: 4px;
}

.ipm-results {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ipm-loading {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
}

.ipm-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background 0.1s;
  text-align: left;
  width: 100%;
  border: none;
  background: transparent;
}
.ipm-row:hover { background: var(--bg-3); }

.ipm-item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-1);
  border: 1px solid var(--border);
}
.ipm-item-icon img { width: 100%; height: 100%; object-fit: cover; }

.ipm-item-meta { flex: 1; min-width: 0; }
.ipm-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ipm-empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-3);
}
</style>
