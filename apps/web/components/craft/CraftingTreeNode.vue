<template>
  <div>
    <div
      class="flex items-center gap-3 py-2 px-3 rounded-md group transition-colors"
      :class="[
        depth > 0 ? 'hover:bg-surface-800/50' : '',
        isCrafting ? 'bg-green-500/5' : '',
      ]"
      :style="{ paddingLeft: `${0.75 + depth * 1.5}rem` }"
    >
      <!-- Toggle expand -->
      <button
        v-if="hasChildren"
        class="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-300 shrink-0 transition-colors"
        @click.stop="expanded = !expanded"
      >
        <svg
          class="w-3 h-3 transition-transform"
          :class="{ 'rotate-90': expanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div v-else class="w-4 shrink-0" />

      <!-- Icon -->
      <ItemIcon :unique-name="node.uniqueName" :display-name="node.name" size="sm" class="shrink-0" />

      <!-- Name + badges -->
      <div class="flex-1 min-w-0">
        <NuxtLink
          :to="`/items/${node.uniqueName}`"
          class="text-sm font-medium text-gray-200 hover:text-primary-300 transition-colors truncate block"
          @click.stop
        >
          {{ node.name }}
        </NuxtLink>
        <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <ItemTierBadge :tier="node.tier" />
          <span v-if="node.enchantmentLevel > 0" class="tier-badge bg-purple-700 text-white text-xs">
            .{{ node.enchantmentLevel }}
          </span>
          
          <!-- Price display -->
          <span class="text-[10px] text-gray-500 font-mono">
            {{ getPrice(node).toLocaleString() }} silver
          </span>
        </div>
      </div>

      <!-- Craft / Buy Toggle -->
      <div v-if="node.type !== 'raw'" class="flex items-center bg-surface-700 rounded p-0.5 mr-2 shadow-inner">
        <button
          class="px-2 py-0.5 text-[9px] font-bold rounded transition-all"
          :class="isCrafting ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-300'"
          @click.stop="$emit('update-decision', node.uniqueName, true)"
        >
          CRAFT
        </button>
        <button
          class="px-2 py-0.5 text-[9px] font-bold rounded transition-all"
          :class="!isCrafting ? 'bg-surface-500 text-white' : 'text-gray-500 hover:text-gray-300'"
          @click.stop="$emit('update-decision', node.uniqueName, false)"
        >
          BUY
        </button>
      </div>

      <!-- Quantity + return -->
      <div class="text-right shrink-0 min-w-[4rem]">
        <div class="flex flex-col items-end">
          <span class="text-sm font-bold text-white">× {{ effectiveQty }}</span>
          <div v-if="isCrafting && returnAmount > 0" class="text-[10px] text-green-500">
            -{{ Math.round(returnAmount) }} ret.
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-ingredients -->
    <Transition name="tree">
      <div v-if="expanded && node.recipe && isCrafting">
        <CraftingTreeNode
          v-for="child in node.recipe.ingredients"
          :key="child.uniqueName"
          :node="child"
          :depth="depth + 1"
          :multiplier="multiplier * (node.quantity / node.recipe.resultCount)"
          :return-rate="returnRate"
          :decisions="decisions"
          :get-price="getPrice"
          @update-decision="(name, craft) => $emit('update-decision', name, craft)"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { type RecipeNode } from '~/composables/useCraftingProfitability'

const props = defineProps<{
  node: RecipeNode
  depth?: number
  multiplier?: number
  returnRate?: number
  decisions: Record<string, boolean>
  getPrice: (node: RecipeNode) => number
}>()

defineEmits<{
  (e: 'update-decision', uniqueName: string, craft: boolean): void
}>()

const depth = computed(() => props.depth ?? 0)
const multiplier = computed(() => props.multiplier ?? 1)
const returnRate = computed(() => props.returnRate ?? 0)

const isCrafting = computed(() => props.decisions[props.node.uniqueName] ?? (props.node.type !== 'raw'))

const effectiveQty = computed(() => Math.ceil(props.node.quantity * multiplier.value))

const returnAmount = computed(() => {
  if (!props.node.maxReturnRate || returnRate.value === 0) return 0
  return effectiveQty.value * Math.min(returnRate.value, props.node.maxReturnRate)
})

const expanded = ref(true)
const hasChildren = computed(() => (props.node.recipe?.ingredients?.length ?? 0) > 0)

onMounted(() => {
  if (depth.value >= 2) expanded.value = false
})
</script>

<style scoped>
.tree-enter-active,
.tree-leave-active {
  transition: opacity 0.15s ease, max-height 0.2s ease;
  overflow: hidden;
}
.tree-enter-from,
.tree-leave-to {
  opacity: 0;
  max-height: 0;
}
.tree-enter-to,
.tree-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
