<template>
  <div class="space-y-4">
    <!-- Profitability Card -->
    <div v-if="profitData" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card p-4 bg-surface-800/50">
        <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Cost</p>
        <p class="text-lg font-mono font-bold text-white">{{ Math.round(profitData.totalCost).toLocaleString() }}</p>
        <p class="text-[10px] text-gray-500 mt-1">Unit: {{ Math.round(profitData.unitCost).toLocaleString() }}</p>
      </div>
      <div class="card p-4 bg-surface-800/50">
        <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Net Revenue</p>
        <p class="text-lg font-mono font-bold text-white">{{ Math.round(profitData.netRevenue).toLocaleString() }}</p>
        <p class="text-[10px] text-gray-500 mt-1">Tax: {{ Math.round(profitData.taxAmount).toLocaleString() }} ({{ (taxRate * 100).toFixed(1) }}%)</p>
      </div>
      <div class="card p-4 border-l-4" :class="profitData.profit >= 0 ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'">
        <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Est. Profit</p>
        <p class="text-lg font-mono font-bold" :class="profitData.profit >= 0 ? 'text-green-400' : 'text-red-400'">
          {{ profitData.profit >= 0 ? '+' : '' }}{{ Math.round(profitData.profit).toLocaleString() }}
        </p>
        <p class="text-[10px] mt-1" :class="profitData.profit >= 0 ? 'text-green-600' : 'text-red-600'">
          Per unit: {{ Math.round(profitData.profit / Math.max(1, quantity)).toLocaleString() }}
        </p>
      </div>
      <div class="card p-4 bg-surface-800/50">
        <p class="text-[10px] font-bold text-gray-500 uppercase mb-1">Profit Margin</p>
        <p class="text-lg font-mono font-bold text-white">{{ profitData.margin.toFixed(2) }}%</p>
        <p class="text-[10px] text-gray-500 mt-1">Location: {{ selectedLocation }}</p>
      </div>
    </div>

    <div class="card overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-surface-700">
        <div>
          <h3 class="text-sm font-semibold text-white">{{ title ?? 'Crafting Recipe' }}</h3>
          <p v-if="stationLabel" class="text-xs text-gray-500 mt-0.5">Station: {{ stationLabel }}</p>
        </div>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <span v-if="computedFame > 0">
            <span class="text-gray-600">Fame </span>
            <span class="text-white font-medium">{{ totalFame.toLocaleString() }}</span>
          </span>
          <span v-if="computedResultCount > 1">
            <span class="text-gray-600">Yields </span>
            <span class="text-white font-medium">× {{ totalYield }}</span>
          </span>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 border-b border-surface-700 bg-surface-800/30 text-xs">
        <!-- Quantity -->
        <label class="flex items-center gap-2">
          <span class="text-gray-500 font-medium shrink-0">Quantity</span>
          <input
            v-model.number="quantity"
            type="number"
            min="1"
            max="9999"
            class="w-20 bg-surface-700 border border-surface-600 rounded px-2 py-0.5 text-white text-xs text-center focus:outline-none focus:border-primary-500"
            @change="quantity = Math.max(1, Math.min(9999, quantity || 1))"
          />
        </label>

        <span class="text-surface-600 hidden sm:inline">|</span>

        <!-- Location -->
        <label class="flex items-center gap-2">
          <span class="text-gray-500 font-medium">Market</span>
          <select v-model="selectedLocation" class="bg-surface-700 border border-surface-600 rounded px-1.5 py-0.5 text-white text-[10px] focus:outline-none">
            <option value="Caerleon">Caerleon</option>
            <option value="Bridgewatch">Bridgewatch</option>
            <option value="FortSterling">Fort Sterling</option>
            <option value="Lymhurst">Lymhurst</option>
            <option value="Martlock">Martlock</option>
            <option value="Thetford">Thetford</option>
            <option value="Brecilien">Brecilien</option>
            <option value="BlackMarket">Black Market</option>
          </select>
        </label>

        <span class="text-surface-600 hidden sm:inline">|</span>

        <!-- Focus -->
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input v-model="withFocus" type="checkbox" class="rounded accent-primary-500" />
          <span class="text-gray-300">Focus</span>
          <span class="text-green-500 font-semibold">({{ (focusRate * 100).toFixed(1) }}%)</span>
        </label>

        <!-- City bonus -->
        <label class="flex items-center gap-1.5 cursor-pointer select-none">
          <input v-model="withCityBonus" type="checkbox" class="rounded accent-primary-500" />
          <span class="text-gray-300">City bonus</span>
          <span class="text-primary-400 font-semibold">(+25%)</span>
        </label>

        <span class="ml-auto text-white font-semibold tabular-nums">
          {{ (effectiveReturnRate * 100).toFixed(1) }}% returned
        </span>
      </div>

      <!-- Loading -->
      <div v-if="treeLoading" class="p-4 space-y-2 animate-pulse">
        <div v-for="i in 4" :key="i" class="h-10 bg-surface-800 rounded" :style="{ width: `${85 - i * 10}%` }" />
      </div>

      <!-- Tree -->
      <div v-else-if="displayNodes.length > 0" class="py-1">
        <CraftingTreeNode
          v-for="node in displayNodes"
          :key="node.uniqueName"
          :node="node"
          :depth="0"
          :multiplier="craftRuns"
          :return-rate="effectiveReturnRate"
          :decisions="userDecisions"
          :get-price="getPrice"
          @update-decision="setDecision"
        />
      </div>

      <div v-else class="px-4 py-6 text-center text-sm text-gray-600">
        No ingredients found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCraftingProfitability, type RecipeNode } from '~/composables/useCraftingProfitability'
import CraftingTreeNode from './CraftingTreeNode.vue'

interface LegacyIngredient {
  item: { uniqueName: string; name: string; tier: number; enchantmentLevel: number; isCraftable: boolean; isRefinable: boolean; iconUrl?: string | null }
  quantity: number
  maxReturnRate?: number | null
}

const props = defineProps<{
  itemUniqueName?: string
  title?: string
  craftingFame?: number
  resultCount?: number
  stationId?: string | null
  stationName?: string | null
  ingredients?: LegacyIngredient[]
}>()

// ── State ────────────────────────────────────────────────────────────────────

const treeData = ref<RecipeNode | null>(null)
const treeLoading = ref(false)

const quantity = ref(1)
const withFocus = ref(false)
const withCityBonus = ref(false)

const {
  userDecisions,
  selectedLocation,
  taxRate,
  setDecision,
  getPrice,
  getProfitData
} = useCraftingProfitability()

// ── Computed ─────────────────────────────────────────────────────────────────

const computedResultCount = computed(() => props.resultCount ?? treeData.value?.recipe?.resultCount ?? 1)
const computedFame = computed(() => props.craftingFame ?? treeData.value?.recipe?.craftingFame ?? 0)
const stationLabel = computed(() => props.stationName ?? props.stationId ?? treeData.value?.recipe?.stationId ?? null)

const craftRuns = computed(() => Math.ceil(quantity.value / computedResultCount.value))
const totalYield = computed(() => craftRuns.value * computedResultCount.value)
const totalFame = computed(() => computedFame.value * craftRuns.value)

const focusRate = 0.478
const effectiveReturnRate = computed(() => {
  let rate = withFocus.value ? focusRate : 0.15
  if (withCityBonus.value) rate += 0.25
  return Math.min(rate, 0.9)
})

const legacyNodes = computed<RecipeNode[]>(() =>
  (props.ingredients ?? []).map((ing) => ({
    itemId: ing.item.uniqueName,
    uniqueName: ing.item.uniqueName,
    name: ing.item.name,
    tier: ing.item.tier,
    enchantmentLevel: ing.item.enchantmentLevel,
    isCraftable: ing.item.isCraftable,
    isRefinable: ing.item.isRefinable,
    iconUrl: ing.item.iconUrl ?? null,
    quantity: ing.quantity,
    maxReturnRate: ing.maxReturnRate ?? null,
    type: ing.item.isCraftable ? 'craft' : ing.item.isRefinable ? 'refine' : 'raw',
    marketPrices: [],
    recipe: null,
  }))
)

const profitData = computed(() => {
  return getProfitData(treeData.value, quantity.value, effectiveReturnRate.value)
})

const displayNodes = computed<RecipeNode[]>(() => {
  if (treeData.value?.recipe) return treeData.value.recipe.ingredients
  return legacyNodes.value
})

// ── Tree loading ──────────────────────────────────────────────────────────────

async function loadTree() {
  if (!props.itemUniqueName || treeLoading.value || treeData.value) return
  treeLoading.value = true
  try {
    const res = await $fetch<{ data: RecipeNode }>(`/api/v1/items/${props.itemUniqueName}/recipe/tree`)
    treeData.value = res.data
  } catch {
    // Fallback silencieux
  } finally {
    treeLoading.value = false
  }
}

onMounted(loadTree)
</script>
