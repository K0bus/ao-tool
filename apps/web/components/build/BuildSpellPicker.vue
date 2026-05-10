<template>
  <div class="spell-picker">
    <div v-for="slot in SPELL_SLOTS" :key="slot.key" class="spell-slot-section">
      <div class="sp-header">
        <span class="sp-key">{{ slot.label }}</span>
        <span v-if="selectedSpell(slot.key)" class="sp-selected-name">{{ selectedSpell(slot.key)!.name }}</span>
        <span v-else class="sp-none">—</span>
      </div>
      <div class="sp-icons">
        <template v-if="options(slot.key).length > 0">
          <button
            v-for="opt in options(slot.key)"
            :key="opt.spell.id"
            class="sp-icon-btn"
            :class="{ active: selected[slot.key]?.id === opt.spell.id }"
            :title="`${opt.spell.name}${opt.spell.cooldown ? ' — ' + opt.spell.cooldown + 's CD' : ''}`"
            @click="pick(slot.key, opt.spell)"
          >
            <img
              v-if="opt.spell.icon"
              :src="`https://render.albiononline.com/v1/spell/${opt.spell.icon}.png`"
              :alt="opt.spell.name"
              @error="handleImgError"
            />
            <span v-else class="sp-fallback">{{ opt.spell.id.charAt(0) }}</span>
          </button>
        </template>
        <div v-else class="sp-empty">Aucun spell disponible</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SPELL_SLOTS } from '~/composables/useBuildCreator'
import type { SpellSlotKey, SpellOption, SelectedSpell } from '~/composables/useBuildCreator'

const props = defineProps<{
  selected: Partial<Record<SpellSlotKey, SelectedSpell>>
  getOptions: (slot: SpellSlotKey) => SpellOption[]
}>()

const emit = defineEmits<{
  pick: [slotKey: SpellSlotKey, spell: SelectedSpell | null]
}>()

function options(slotKey: SpellSlotKey) {
  return props.getOptions(slotKey)
}

function selectedSpell(slotKey: SpellSlotKey) {
  return props.selected[slotKey] ?? null
}

function pick(slotKey: SpellSlotKey, spell: SelectedSpell) {
  if (props.selected[slotKey]?.id === spell.id) {
    emit('pick', slotKey, null)
  } else {
    emit('pick', slotKey, spell)
  }
}

function handleImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.nextElementSibling as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}
</script>

<style scoped>
.spell-picker {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.spell-slot-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 18px;
}

.sp-key {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--gold);
  background: rgba(201,161,74,0.1);
  border: 1px solid rgba(201,161,74,0.2);
  border-radius: 3px;
  padding: 1px 7px;
  min-width: 30px;
  text-align: center;
  flex-shrink: 0;
}

.sp-selected-name {
  font-size: 12px;
  color: var(--text-1);
  font-weight: 500;
}

.sp-none {
  font-size: 12px;
  color: var(--text-4);
}

.sp-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sp-icon-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--border);
  background: var(--bg-1);
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.12s, transform 0.1s, box-shadow 0.12s;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sp-icon-btn:hover {
  border-color: var(--border-strong);
  transform: scale(1.08);
}
.sp-icon-btn.active {
  border-color: var(--gold);
  box-shadow: 0 0 0 1px rgba(201,161,74,0.25), 0 0 10px rgba(201,161,74,0.1);
}
.sp-icon-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sp-fallback {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-3);
}

.sp-empty {
  font-size: 12px;
  color: var(--text-4);
  padding: 6px 0;
}
</style>
