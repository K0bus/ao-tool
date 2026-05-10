<template>
  <img
    :src="src"
    :alt="alt ?? displayName ?? uniqueName"
    :class="imgClass"
    :loading="loading"
    decoding="async"
    :width="width"
    :height="height"
    :style="imgStyle"
    @error="onImgError"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    uniqueName: string
    /** Nom affiché (ex. FR) — utilisé en secours dans l’URL render avec ?locale= */
    displayName?: string
    locale?: string
    /** Query sur la 1ʳᵉ URL uniquement (ex. { quality: '5' }) */
    primaryParams?: Record<string, string>
    alt?: string
    imgClass?: string
    loading?: 'lazy' | 'eager'
    width?: string | number
    height?: string | number
    imgStyle?: string | Record<string, string | number>
  }>(),
  {
    locale: 'fr',
    loading: 'lazy',
  },
)

const { src, onImgError } = useAoItemImage(
  () => props.uniqueName,
  () => props.displayName,
  () => props.locale,
  () => props.primaryParams,
)
</script>
