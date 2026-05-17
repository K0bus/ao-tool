<template>
  <div class="json-viewer-container">
    <div class="json-viewer-toolbar">
      <div class="toolbar-left">
        <span class="t-eyebrow">JSON Data Explorer</span>
      </div>
      <div class="toolbar-right">
        <button class="ds-btn ghost sm" @click="expandAll" title="Tout développer">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          Développer tout
        </button>
        <button class="ds-btn ghost sm" @click="collapseAll" title="Tout réduire">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
          Réduire tout
        </button>
        <button class="ds-btn ghost sm" @click="copyToClipboard" title="Copier le JSON">
          <span v-if="copied" class="copied-status t-success">Copié !</span>
          <span v-else style="display: flex; align-items: center; gap: 4px;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copier
          </span>
        </button>
      </div>
    </div>
    
    <div class="json-viewer-content">
      <JsonViewerNode :value="value" :is-last="true" :depth="0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'

const props = defineProps<{
  value: any
}>()

// State to synchronize expand/collapse events globally down the tree
const globalExpandState = ref<'expand' | 'collapse' | null>(null)
provide('globalExpandState', globalExpandState)

const expandAll = () => {
  globalExpandState.value = 'expand'
  // Reset immediately so subsequent clicks still trigger watches
  setTimeout(() => {
    globalExpandState.value = null
  }, 50)
}

const collapseAll = () => {
  globalExpandState.value = 'collapse'
  setTimeout(() => {
    globalExpandState.value = null
  }, 50)
}

const copied = ref(false)
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.value, null, 2))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}
</script>

<style scoped>
.json-viewer-container {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-divider);
  background-color: #060504; /* Extremely dark background */
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5), var(--shadow);
}

.json-viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #0b0a08;
  border-bottom: 1px solid var(--border-divider);
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 6px;
  align-items: center;
}

.json-viewer-content {
  padding: 16px;
  overflow: auto;
  max-height: 550px;
  min-height: 120px;
  scrollbar-gutter: stable;
}

/* Beautiful custom scrollbar for the dark zone */
.json-viewer-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.json-viewer-content::-webkit-scrollbar-track {
  background: #060504;
}

.json-viewer-content::-webkit-scrollbar-thumb {
  background: #1d1a14;
  border-radius: 4px;
}

.json-viewer-content::-webkit-scrollbar-thumb:hover {
  background: var(--gold-deep);
}

.copied-status {
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
</style>
