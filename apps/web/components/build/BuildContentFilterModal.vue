<template>
  <Teleport to="body">
    <Transition name="cfm-fade">
      <div v-if="open" class="cfm-overlay" @click.self="$emit('close')">
        <div
          ref="panelRef"
          class="cfm-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="content-filter-title"
        >
          <div class="cfm-header">
            <div>
              <div class="cfm-eyebrow">Filtres</div>
              <h3 id="content-filter-title" class="cfm-title">Contenus</h3>
            </div>
            <button class="cfm-close" type="button" aria-label="Fermer" @click="$emit('close')">×</button>
          </div>

          <p class="cfm-copy">Choisissez le contenu principal à afficher dans la liste des builds.</p>

          <div class="cfm-options">
            <button
              type="button"
              class="cfm-option"
              :class="{ active: draftValue === null }"
              @click="draftValue = null"
            >
              Tous les contenus
            </button>
            <button
              v-for="option in options"
              :key="option.value"
              type="button"
              class="cfm-option"
              :class="{ active: draftValue === option.value }"
              @click="draftValue = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="cfm-actions">
            <button type="button" class="ds-btn" @click="reset">Réinitialiser</button>
            <div class="cfm-actions-right">
              <button type="button" class="ds-btn" @click="$emit('close')">Annuler</button>
              <button type="button" class="ds-btn primary" @click="apply">Appliquer</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { BuildContentType } from '@albion-tool/types'

const props = defineProps<{
  open: boolean
  selected: BuildContentType | null
  options: Array<{ value: BuildContentType; label: string }>
}>()

const emit = defineEmits<{
  apply: [value: BuildContentType | null]
  close: []
}>()

const panelRef = ref<HTMLElement | null>(null)
const draftValue = ref<BuildContentType | null>(props.selected)

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  draftValue.value = props.selected
  nextTick(() => panelRef.value?.focus())
})

watch(() => props.selected, (value) => {
  if (!props.open) draftValue.value = value
})

function apply() {
  emit('apply', draftValue.value)
}

function reset() {
  draftValue.value = null
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.cfm-fade-enter-active,
.cfm-fade-leave-active {
  transition: opacity 0.16s ease;
}

.cfm-fade-enter-from,
.cfm-fade-leave-to {
  opacity: 0;
}

.cfm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(10, 11, 15, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.cfm-panel {
  width: min(640px, 100%);
  max-height: min(80vh, 720px);
  overflow: auto;
  background: linear-gradient(180deg, rgba(26,29,36,0.98), rgba(16,18,24,0.98));
  border: 1px solid var(--border-strong);
  border-radius: calc(var(--radius-lg) + 2px);
  box-shadow: var(--shadow-lg);
  padding: 20px;
  outline: none;
}

.cfm-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cfm-eyebrow {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--gold);
}

.cfm-title {
  margin-top: 4px;
  font-size: 22px;
}

.cfm-close {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border);
  color: var(--text-3);
  background: var(--bg-2);
  font-size: 22px;
  line-height: 1;
}

.cfm-copy {
  margin-top: 12px;
  color: var(--text-2);
  font-size: 13px;
}

.cfm-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.cfm-option {
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-1);
  color: var(--text-2);
  font-size: 13px;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}

.cfm-option:hover {
  border-color: var(--border-strong);
  color: var(--text-1);
}

.cfm-option.active {
  border-color: rgba(201,161,74,0.35);
  background: rgba(201,161,74,0.1);
  color: var(--gold);
}

.cfm-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
}

.cfm-actions-right {
  display: flex;
  gap: 8px;
}

@media (max-width: 640px) {
  .cfm-overlay {
    padding: 12px;
  }

  .cfm-panel {
    padding: 16px;
  }

  .cfm-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .cfm-actions-right {
    width: 100%;
  }

  .cfm-actions-right :deep(.ds-btn),
  .cfm-actions :deep(.ds-btn) {
    flex: 1;
  }
}
</style>
