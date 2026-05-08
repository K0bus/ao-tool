<template>
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
        <span v-if="craftRuns > 1" class="text-gray-600">
          ({{ craftRuns }} runs)
        </span>
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
      />
    </div>

    <div v-else class="px-4 py-6 text-center text-sm text-gray-600">
      No ingredients found
    </div>
  </div>
</template>

<script setup lang="ts">
interface RecipeNode {
  itemId: string
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  isCraftable: boolean
  isRefinable: boolean
  iconUrl?: string | null
  quantity: number
  maxReturnRate?: number | null
  type: 'craft' | 'refine' | 'raw'
  recipe?: {
    resultCount: number
    craftingFame: number
    stationId?: string | null
    ingredients: RecipeNode[]
  } | null
}

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
    recipe: null,
  }))
)

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
    // Fallback silencieux sur les ingrédients legacy
  } finally {
    treeLoading.value = false
  }
}

onMounted(loadTree)
</script>
