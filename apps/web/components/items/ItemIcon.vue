<template>
  <div class="relative inline-flex" :class="sizeClass">
    <img
      :src="src"
      :alt="alt ?? displayName ?? uniqueName"
      class="w-full h-full object-contain rounded bg-surface-800"
      :class="{ 'opacity-50': failed }"
      loading="lazy"
      decoding="async"
      @error="onImgError"
    />
    <div v-if="failed" class="absolute inset-0 flex items-center justify-center">
      <span class="text-gray-600 text-xs">?</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    uniqueName: string
    /** Nom affiché pour le fallback render (?locale=) si l’URL uniquename échoue */
    displayName?: string
    locale?: string
    primaryParams?: Record<string, string>
    alt?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    locale: 'fr',
  },
)

const { src, failed, onImgError } = useAoItemImage(
  () => props.uniqueName,
  () => props.displayName,
  () => props.locale,
  () => props.primaryParams,
)

const SIZES = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}
const sizeClass = computed(() => SIZES[props.size ?? 'md'])
</script>
