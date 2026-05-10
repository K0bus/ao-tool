<template>
  <div class="tl-row" :class="{ root: depth === 0, leaf: !hasChildren, open: isOpen }">
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
      <div class="tl-qty t-mono">× {{ fmtQty(node.qty) }}</div>
      <div class="tl-price t-mono" :class="node.marketPrice > 0 ? 't-gold' : 't-dim'">
        {{ node.marketPrice > 0 ? fmt(node.marketPrice * node.qty) + ' ◇' : '—' }}
      </div>
    </button>
    <div v-if="hasChildren" class="tl-body">
      <div class="tl-inner">
        <CraftTreeListNode
          v-for="(child, i) in node.children"
          :key="child.uniqueName + '-' + i"
          :node="child"
          :depth="depth + 1"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
}>()

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
