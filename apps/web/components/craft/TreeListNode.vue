<template>
  <div
    class="tl-row"
    :class="[
      { root: depth === 0, leaf: !hasChildren, open: isOpen },
      rowDecisionClass,
      { 'tl-inactive': inactive }
    ]"
  >
    <button class="tl-head" type="button" @click="hasChildren ? toggle() : undefined">
      <span class="tl-chev" :class="{ hidden: !hasChildren }">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </span>
      <div class="tl-img">
        <img :src="`https://render.albiononline.com/v1/item/${node.uniqueName}.png`" :alt="node.name" loading="lazy" />
        <span :class="`tier-badge t${node.tier}`">T{{ node.tier }}</span>
      </div>
      <div class="tl-meta">
        <div class="tl-name">{{ node.name }}</div>
        <div class="tl-id t-mono">{{ node.uniqueName }}</div>
      </div>

      <!-- Strategy badge column (caché si le nœud est inactif) -->
      <div class="tl-badge">
        <button
          v-if="strategy?.hasRecipe && depth > 0 && !inactive"
          class="tl-badge-btn"
          :class="[strategy.decision, { override: strategy.isOverridden }]"
          @click.stop="toggleOverride?.(node.uniqueName)"
        >
          <span v-if="strategy.isOverridden" class="badge-dot" />
          {{ strategy.decision === 'craft' ? 'CRAFT' : 'ACHETER' }}
        </button>
      </div>

      <div class="tl-qty t-mono">× {{ fmtQty(node.qty) }}</div>
      <div class="tl-price t-mono" :class="effectiveCost > 0 ? 't-gold' : 't-dim'">
        {{ effectiveCost > 0 ? fmt(effectiveCost) + ' ◇' : '—' }}
      </div>
    </button>
    <div v-if="hasChildren" class="tl-body">
      <div class="tl-inner">
        <CraftTreeListNode
          v-for="(child, i) in node.children"
          :key="child.uniqueName + '-' + i"
          :node="child"
          :depth="depth + 1"
          :inactive="inactive || strategy?.decision === 'buy'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NodeStrategy {
  decision: 'craft' | 'buy'
  auto: 'craft' | 'buy'
  craftCostPerUnit: number
  buyCostPerUnit: number
  isOverridden: boolean
  hasRecipe: boolean
}

const props = defineProps<{
  node: {
    uniqueName: string
    name: string
    tier: number
    qty: number
    marketPrice: number
    children: any[]
  }
  depth: number
  inactive?: boolean
}>()

const strategyMap = inject<ComputedRef<Map<string, NodeStrategy>> | undefined>('strategyMap', undefined)
const toggleOverride = inject<((uniqueName: string) => void) | undefined>('toggleOverride', undefined)

const strategy = computed(() => strategyMap?.value?.get(props.node.uniqueName))

const rowDecisionClass = computed(() => {
  if (!strategy.value || props.depth === 0 || props.inactive) return ''
  return `decision-tl-${strategy.value.decision}`
})

const effectiveCost = computed(() => {
  if (props.inactive || !strategy.value) return props.node.marketPrice * props.node.qty
  const price = strategy.value.decision === 'craft'
    ? strategy.value.craftCostPerUnit
    : strategy.value.buyCostPerUnit
  return isFinite(price) ? price * props.node.qty : props.node.marketPrice * props.node.qty
})

const isOpen = ref(props.depth === 0)
const hasChildren = computed(() => props.node.children.length > 0)

function toggle() {
  isOpen.value = !isOpen.value
}

function fmt(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'k'
  return Math.round(v).toLocaleString('fr-FR')
}

function fmtQty(v: number) {
  if (!v) return '0'
  return Number.isInteger(v) ? v.toString() : v.toFixed(1)
}
</script>
