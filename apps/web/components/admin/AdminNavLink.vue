<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors"
    :class="isActive ? 'bg-surface-700 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-surface-800'"
  >
    {{ label }}
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{
  to: string
  label: string
  icon?: string
  exact?: boolean
}>()

const route = useRoute()
const isActive = computed(() =>
  props.exact ? route.path === props.to : route.path.startsWith(props.to)
)
</script>
