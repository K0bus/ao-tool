<template>
  <div class="spell-picker">
    <div v-for="group in groups" :key="group.key" class="spell-slot-section">
      <div class="sp-header">
        <div class="sp-meta">
          <span class="sp-item">{{ group.slotLabel }}</span>
          <span class="sp-key">{{ group.spellSlotLabel }}</span>
        </div>
        <span v-if="selectedSpell(group.key)" class="sp-selected-name">{{ selectedSpell(group.key)!.name }}</span>
        <span v-else class="sp-none">—</span>
      </div>
      <div class="sp-icons">
        <template v-if="group.options.length > 0">
          <button
            v-for="opt in group.options"
            :key="opt.spell.id"
            class="sp-icon-btn"
            :class="{ active: selected[group.key]?.id === opt.spell.id }"
            @mouseenter="showTooltip($event, group.slotLabel, group.spellSlotLabel, opt.spell)"
            @mousemove="moveTooltip"
            @mouseleave="hideTooltip"
            @click="pick(group.key, opt.spell)"
          >
            <img
              :src="spellIconUrl(opt.spell)"
              :alt="opt.spell.name"
              @error="handleImgError"
            />
            <span class="sp-fallback">{{ spellFallbackLabel(opt.spell.id) }}</span>
          </button>
        </template>
        <div v-else class="sp-empty">Aucun spell disponible</div>
      </div>
    </div>

    <div
      v-if="tooltip.visible"
      class="sp-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      <div class="sp-tooltip-title">{{ tooltip.title }}</div>
      <div v-if="tooltip.badge" class="sp-tooltip-badge">{{ tooltip.badge }}</div>
      <div v-for="line in tooltip.lines" :key="line" class="sp-tooltip-line" v-html="parseAoDescription(line)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SpellGroup, SelectedSpell } from '~/composables/useBuildCreator'
import { parseAoDescription } from '~/utils/aoRender'

const props = defineProps<{
  selected: Record<string, SelectedSpell>
  groups: SpellGroup[]
}>()

const emit = defineEmits<{
  pick: [groupKey: string, spell: SelectedSpell]
}>()

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  badge: '',
  lines: [] as string[],
})

function selectedSpell(groupKey: string) {
  return props.selected[groupKey] ?? null
}

function pick(groupKey: string, spell: SelectedSpell) {
  emit('pick', groupKey, spell)
}

function spellIconUrl(spell: SelectedSpell) {
  return `https://render.albiononline.com/v1/spell/${spell.id}.png`
}

function spellFallbackLabel(id: string) {
  return id.charAt(0).toUpperCase()
}

function handleImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.parentElement?.querySelector('.sp-fallback') as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}

function moveTooltip(event: MouseEvent) {
  tooltip.x = event.clientX + 14
  tooltip.y = event.clientY + 18
}

function hideTooltip() {
  tooltip.visible = false
}

function showTooltip(event: MouseEvent, slotLabel: string, spellSlotLabel: string, spell: SelectedSpell) {
  moveTooltip(event)
  tooltip.title = spell.name
  tooltip.badge = `${slotLabel} · ${spellSlotLabel}`
  tooltip.lines = [
    spell.cooldown != null ? `Cooldown: ${formatStat(spell.cooldown)}s` : null,
    spell.energyCost != null ? `Énergie: ${formatStat(spell.energyCost)}` : null,
    spell.range != null ? `Portée: ${formatStat(spell.range)}m` : null,
    [
      spell.spellKind ? `Type: ${spell.spellKind}` : null,
      spell.uiType ? `UI: ${spell.uiType}` : null,
      spell.category ? `Catégorie: ${spell.category}` : null,
    ].filter(Boolean).join(' · ') || null,
    spell.description || null,
  ].filter((line): line is string => Boolean(line))
  tooltip.visible = true
}

function formatStat(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
</script>

<style scoped>
.spell-picker {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

.spell-slot-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 24px;
}

.sp-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-item {
  font-size: 12px;
  color: var(--text-2);
  font-weight: 600;
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
  display: none;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-3);
}

.sp-empty {
  font-size: 12px;
  color: var(--text-4);
  padding: 6px 0;
}

.sp-tooltip {
  position: fixed;
  z-index: 1200;
  min-width: 180px;
  max-width: 280px;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: rgba(15, 17, 22, 0.96);
  box-shadow: var(--shadow-lg);
  pointer-events: none;
}

.sp-tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-0);
}

.sp-tooltip-badge {
  display: inline-flex;
  margin-top: 6px;
  font-size: 10px;
  color: var(--gold);
  border: 1px solid rgba(201,161,74,0.25);
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(201,161,74,0.08);
}

.sp-tooltip-line {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
}
</style>
