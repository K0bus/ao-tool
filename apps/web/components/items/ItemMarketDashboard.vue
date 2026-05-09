<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="card p-4 flex flex-wrap gap-4 items-end">
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-500 uppercase">Location</label>
        <select v-model="filters.location" class="input-sm w-40">
          <option :value="undefined">All Cities</option>
          <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
        </select>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-500 uppercase">Quality</label>
        <select v-model="filters.quality" class="input-sm w-32">
          <option :value="1">Normal</option>
          <option :value="2">Good</option>
          <option :value="3">Outstanding</option>
          <option :value="4">Excellent</option>
          <option :value="5">Masterpiece</option>
        </select>
      </div>

      <div class="space-y-1">
        <label class="text-[10px] font-bold text-gray-500 uppercase">Time Range</label>
        <select v-model="filters.days" class="input-sm w-32">
          <option :value="7">Last 7 Days</option>
          <option :value="14">Last 14 Days</option>
          <option :value="30">Last 30 Days</option>
          <option :value="90">Last 90 Days</option>
        </select>
      </div>

      <div class="flex-1"></div>

      <button @click="() => refreshHistory()" class="btn-primary py-1.5 px-3 h-9" :disabled="pendingHistory">
        <span v-if="pendingHistory" class="animate-spin mr-2">↻</span>
        Refresh
      </button>
    </div>

    <!-- Live Prices Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div v-for="price in filteredLivePrices" :key="price.id" class="card overflow-hidden group">
        <div class="px-4 py-3 border-b border-surface-700 bg-surface-800 flex justify-between items-center">
          <span class="text-sm font-bold text-white">{{ price.location.name }}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-surface-600 text-gray-300">Q{{ price.quality }}</span>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">Sell Price Min</span>
            <span class="text-sm font-mono font-bold text-blue-400">{{ price.sellPriceMin.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">Buy Price Max</span>
            <span class="text-sm font-mono font-bold text-amber-400">{{ price.buyPriceMax.toLocaleString() }}</span>
          </div>
          <div class="pt-2 border-t border-surface-800 flex justify-between items-center text-[10px] text-gray-600">
            <span>Updated</span>
            <span>{{ useTimeAgo(price.updatedAt).value }}</span>
          </div>
        </div>
      </div>
      <div v-if="filteredLivePrices.length === 0" class="col-span-full card p-8 text-center text-gray-500 italic">
        No live price data matching your filters
      </div>
    </div>

    <!-- Chart -->
    <div class="card p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-bold text-white">Price History</h3>
          <p class="text-xs text-gray-500">Historical trend for {{ selectedCityName }} (Quality {{ filters.quality }})</p>
        </div>
      </div>
      
      <div v-if="pendingHistory" class="h-[300px] flex items-center justify-center">
        <span class="animate-spin text-primary-500 text-2xl">↻</span>
      </div>
      <ItemPriceChart v-else :history="historyData?.data ?? []" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTimeAgo } from '@vueuse/core'
import ItemPriceChart from './ItemPriceChart.vue'

interface Props {
  uniqueName: string
  livePrices: any[]
}

const props = defineProps<Props>()

const filters = ref({
  location: undefined as string | undefined,
  quality: 1,
  days: 30
})

// Extract unique cities from live prices for the dropdown
const cities = computed(() => {
  const map = new Map()
  props.livePrices.forEach(p => {
    if (!map.has(p.locationId)) {
      map.set(p.locationId, p.location)
    }
  })
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const selectedCityName = computed(() => {
  if (!filters.value.location) return 'All Cities'
  return cities.value.find(c => c.id === filters.value.location)?.name ?? filters.value.location
})

const filteredLivePrices = computed(() => {
  return props.livePrices.filter(p => {
    const matchLoc = !filters.value.location || p.locationId === filters.value.location
    const matchQual = p.quality === filters.value.quality
    return matchLoc && matchQual
  })
})

const { data: historyData, pending: pendingHistory, refresh: refreshHistory } = useFetch(
  () => `/api/v1/items/${encodeURIComponent(props.uniqueName)}/market/history`,
  { query: filters, watch: [filters] }
)
</script>
