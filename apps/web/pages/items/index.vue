<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Items</h1>
      <p class="page-subtitle">Search and filter all Albion Online items</p>
    </div>

    <!-- Search + Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="filters.q"
          type="search"
          class="input pl-9"
          placeholder="Search items..."
          @input="debouncedSearch"
        />
      </div>

      <select v-model="filters.tier" class="input w-auto min-w-[120px]">
        <option value="">All Tiers</option>
        <option v-for="t in 8" :key="t" :value="t">Tier {{ t }}</option>
      </select>

      <select v-model="filters.enchantment" class="input w-auto min-w-[140px]">
        <option value="">All Enchants</option>
        <option value="0">No Enchant</option>
        <option value="1">.1</option>
        <option value="2">.2</option>
        <option value="3">.3</option>
      </select>

      <select v-model="filters.craftable" class="input w-auto min-w-[140px]">
        <option value="">All Items</option>
        <option value="true">Craftable Only</option>
        <option value="refinable">Refinable Only</option>
      </select>
    </div>

    <!-- Results count -->
    <div class="text-sm text-gray-500 mb-4" v-if="!loading">
      {{ total }} items found
    </div>

    <!-- Grid -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="i in 24" :key="i" class="card p-3 animate-pulse">
        <div class="w-full aspect-square bg-surface-700 rounded mb-2" />
        <div class="h-3 bg-surface-700 rounded mb-1" />
        <div class="h-3 bg-surface-800 rounded w-2/3" />
      </div>
    </div>

    <div v-else-if="items.length === 0" class="card p-12 text-center text-gray-500">
      <p class="font-medium">No items found</p>
      <p class="text-sm mt-1">Try adjusting your search filters</p>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/items/${item.uniqueName}`"
        class="card p-3 hover:border-primary-600/40 hover:shadow-glow transition-all group"
      >
        <div class="relative mb-2">
          <img
            :src="item.iconUrl ?? `https://render.albiononline.com/v1/item/${item.uniqueName}.png`"
            :alt="item.name"
            class="w-full aspect-square object-contain rounded bg-surface-800 group-hover:scale-105 transition-transform"
            loading="lazy"
            @error="onImageError"
          />
          <div class="absolute top-1 left-1 flex gap-1">
            <span class="tier-badge text-white" :class="tierColor(item.tier)">
              T{{ item.tier }}
            </span>
            <span v-if="item.enchantmentLevel > 0" class="tier-badge bg-purple-600/80 text-white">
              .{{ item.enchantmentLevel }}
            </span>
          </div>
        </div>
        <p class="text-xs font-medium text-gray-200 truncate">{{ item.name }}</p>
        <p class="text-xs text-gray-600 truncate">{{ item.shopCategory }}</p>
      </NuxtLink>
    </div>

    <!-- Pagination -->
    <div v-if="nextCursor" class="mt-6 text-center">
      <button class="btn-secondary" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ItemSummary } from '@albion-tool/types'

definePageMeta({ layout: 'default' })

const route = useRoute()

const filters = reactive({
  q: (route.query.q as string) || '',
  tier: '',
  enchantment: '',
  craftable: '',
})

const items = ref<ItemSummary[]>([])
const total = ref(0)
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)

async function search() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.tier) params.set('tier', filters.tier)
    if (filters.enchantment) params.set('enchantment', filters.enchantment)
    if (filters.craftable === 'true') params.set('craftable', 'true')
    if (filters.craftable === 'refinable') params.set('refinable', 'true')

    const res = await $fetch<{ data: ItemSummary[]; meta: { total: number; nextCursor: string | null } }>(
      `/api/v1/items?${params.toString()}`
    )
    items.value = res.data
    total.value = res.meta.total
    nextCursor.value = res.meta.nextCursor
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!nextCursor.value) return
  loadingMore.value = true
  try {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    params.set('cursor', nextCursor.value)

    const res = await $fetch<{ data: ItemSummary[]; meta: { nextCursor: string | null } }>(
      `/api/v1/items?${params.toString()}`
    )
    items.value.push(...res.data)
    nextCursor.value = res.meta.nextCursor
  } finally {
    loadingMore.value = false
  }
}

const debouncedSearch = useDebounceFn(search, 300)

function tierColor(tier: number) {
  const colors: Record<number, string> = {
    1: 'bg-gray-600',
    2: 'bg-green-700',
    3: 'bg-blue-700',
    4: 'bg-yellow-700',
    5: 'bg-orange-700',
    6: 'bg-red-700',
    7: 'bg-purple-700',
    8: 'bg-pink-700',
  }
  return colors[tier] ?? 'bg-gray-600'
}

function onImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = '/images/placeholder-item.svg'
}

watch(filters, debouncedSearch, { deep: true })

onMounted(search)
</script>
