<template>
  <span v-html="parsedDescription" class="spell-description"></span>
</template>

<script setup lang="ts">
import { parseAoDescription } from '~/utils/aoRender'

const props = defineProps<{
  description: string
}>()

const parsedDescription = computed(() => parseAoDescription(props.description))
</script>

<style scoped>
.spell-description {
  display: block;
  white-space: normal;
}
</style>
