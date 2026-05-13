<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="open" class="confirm-overlay" @click.self="emit('cancel')">
        <div
          class="confirm-modal"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <div class="confirm-head">
            <div>
              <p v-if="eyebrow" class="confirm-eyebrow">{{ eyebrow }}</p>
              <h3 :id="titleId" class="confirm-title">{{ title }}</h3>
            </div>
            <button class="confirm-close" @click="emit('cancel')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <p class="confirm-message">{{ message }}</p>

          <div class="confirm-actions">
            <button class="ds-btn" :disabled="loading" @click="emit('cancel')">
              {{ cancelLabel }}
            </button>
            <button
              class="ds-btn"
              :class="variant === 'danger' ? 'confirm-danger' : 'primary'"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ loading ? loadingLabel : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loadingLabel?: string
  loading?: boolean
  variant?: 'primary' | 'danger'
  eyebrow?: string
}>(), {
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  loadingLabel: 'Chargement…',
  loading: false,
  variant: 'primary',
  eyebrow: '',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const titleId = `confirm-title-${Math.random().toString(36).slice(2, 10)}`

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('cancel')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 1400;
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.confirm-modal {
  width: 100%;
  max-width: 420px;
  background: var(--bg-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 18px;
}

.confirm-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.confirm-eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
  font-family: var(--font-display);
}

.confirm-title {
  margin: 0;
  font-size: 18px;
  color: var(--text-0);
}

.confirm-close {
  padding: 4px;
  border-radius: 4px;
  color: var(--text-3);
  transition: color 0.1s, background 0.1s;
}

.confirm-close:hover {
  color: var(--text-0);
  background: var(--bg-3);
}

.confirm-message {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
}

.confirm-danger {
  color: #fff;
  border-color: rgba(176,74,50,0.45);
  background: linear-gradient(180deg, rgba(176,74,50,0.95) 0%, rgba(140,52,33,0.95) 100%);
}

.confirm-danger:hover:not(:disabled) {
  border-color: rgba(176,74,50,0.7);
  background: linear-gradient(180deg, rgba(186,82,58,0.98) 0%, rgba(150,60,40,0.98) 100%);
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.16s ease;
}

.confirm-fade-enter-active .confirm-modal,
.confirm-fade-leave-active .confirm-modal {
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-modal,
.confirm-fade-leave-to .confirm-modal {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
</style>
