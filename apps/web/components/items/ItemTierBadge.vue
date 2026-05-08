<template>
  <span class="tier-badge text-white text-xs font-bold" :class="color">T{{ tier }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{ tier: number }>()

const COLORS: Record<number, string> = {
  1: 'bg-gray-600',
  2: 'bg-emerald-700',
  3: 'bg-blue-700',
  4: 'bg-yellow-700',
  5: 'bg-orange-700',
  6: 'bg-red-700',
  7: 'bg-purple-700',
  8: 'bg-pink-700',
}
const color = computed(() => COLORS[props.tier] ?? 'bg-gray-600')
</script>
