<template>
  <div class="relative inline-flex" :class="sizeClass">
    <img
      :src="src"
      :alt="alt"
      class="w-full h-full object-contain rounded bg-surface-800"
      :class="{ 'opacity-50': failed }"
      loading="lazy"
      @error="onError"
    />
    <div v-if="failed" class="absolute inset-0 flex items-center justify-center">
      <span class="text-gray-600 text-xs">?</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  uniqueName: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}>()

const AO_RENDER = 'https://render.albiononline.com/v1/item'

const src = computed(() => `${AO_RENDER}/${props.uniqueName}.png`)
const failed = ref(false)

const SIZES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}
const sizeClass = computed(() => SIZES[props.size ?? 'md'])

function onError() {
  failed.value = true
}
</script>
