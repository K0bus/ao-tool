<template>
  <div class="pvp-eq-grid">
    <div
      v-for="(column, columnIndex) in SLOT_COLUMNS"
      :key="`col-${columnIndex}`"
      class="slots-column"
      :class="{ center: columnIndex === 1 }"
    >
      <div
        v-for="slotKey in column"
        :key="slotKey"
        class="build-slot-static"
        :class="[
          { filled: !!getSlotData(slotKey).type },
          getSlotData(slotKey).qualityClass
        ]"
        @mouseenter="showTooltip($event, slotKey)"
        @mousemove="moveTooltip"
        @mouseleave="hideTooltip"
      >
        <div v-if="getSlotData(slotKey).type" class="slot-tier">
          {{ getSlotData(slotKey).tierLabel }}
        </div>
        
        <div class="slot-icon">
          <AoItemImage
            v-if="getSlotData(slotKey).type"
            :unique-name="getSlotData(slotKey).type!"
            :display-name="getSlotData(slotKey).displayName"
            :alt="getSlotData(slotKey).displayName"
          />
          <span v-else class="eq-empty">·</span>
        </div>

        <span class="slot-label">
          {{ getSlotData(slotKey).type ? getSlotData(slotKey).displayName : getSlotData(slotKey).label }}
        </span>

        <div v-if="getSlotData(slotKey).type && getSlotData(slotKey).ip" class="slot-ip">
          {{ getSlotData(slotKey).ip }} IP
        </div>
      </div>
    </div>

    <!-- Teleported Tooltip -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible"
        class="slot-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <div class="slot-tooltip-title">{{ tooltip.title }}</div>
        <div v-if="tooltip.badge" class="slot-tooltip-badge">{{ tooltip.badge }}</div>
        <div v-for="line in tooltip.lines" :key="line" class="slot-tooltip-line">{{ line }}</div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { KillEventEquipment } from '@albion-tool/types'
import { itemTier, itemEnchant, calcItemPower, QUALITY_LABELS } from '~/utils/pvp'

const props = defineProps<{
  equipment: KillEventEquipment
  names: Record<string, string>
}>()

const SLOT_COLUMNS = [
  ['Bag', 'MainHand', 'Potion'],
  ['Head', 'Armor', 'Shoes', 'Mount'],
  ['Cape', 'OffHand', 'Food'],
] as const

const SLOT_LABELS: Record<string, string> = {
  MainHand: 'Arme', OffHand: 'Secondaire', Head: 'Casque', Armor: 'Armure',
  Shoes: 'Bottes', Bag: 'Sac', Cape: 'Cape', Mount: 'Monture', Potion: 'Potion', Food: 'Nourriture',
}

const QUALITY_CLASSES = ['', '', 'q-good', 'q-outstanding', 'q-excellent', 'q-masterpiece']

function getSlotData(key: string) {
  const item = props.equipment[key as keyof KillEventEquipment]
  const label = SLOT_LABELS[key] || key

  if (!item?.Type) {
    return { label, type: null, displayName: '', tierLabel: '', ip: 0, qualityClass: '' }
  }

  const type = item.Type
  const t = itemTier(type)
  const e = itemEnchant(type)
  const tierLabel = e > 0 ? `T${t}.${e}` : `T${t}`
  const baseName = props.names[type] ?? ''
  
  return {
    label,
    type,
    displayName: baseName || type,
    tierLabel,
    ip: calcItemPower(type, item.Quality),
    qualityClass: QUALITY_CLASSES[item.Quality] ?? '',
    quality: item.Quality,
    name: baseName || type
  }
}

// Tooltip logic
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  badge: '',
  lines: [] as string[]
})

function moveTooltip(event: MouseEvent) {
  tooltip.x = event.clientX + 14
  tooltip.y = event.clientY + 18
}

function hideTooltip() {
  tooltip.visible = false
}

function showTooltip(event: MouseEvent, slotKey: string) {
  const data = getSlotData(slotKey)
  if (!data.type) return

  moveTooltip(event)
  tooltip.title = data.name
  tooltip.badge = data.tierLabel
  tooltip.lines = [
    data.label,
    `Qualité: ${QUALITY_LABELS[data.quality!] || 'Normale'}`,
    data.ip ? `${data.ip} IP` : null,
  ].filter((l): l is string => !!l)
  tooltip.visible = true
}
</script>

<style scoped>
.pvp-eq-grid {
  display: grid;
  grid-template-columns: repeat(3, 128px);
  gap: 16px;
  justify-content: center;
  align-items: start;
  padding: 32px 16px;
}

.slots-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slots-column.center {
  transform: translateY(-20px);
}

.build-slot-static {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px 12px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-align: center;
  width: 128px;
  min-height: 154px;
  transition: border-color 0.15s, background 0.15s;
}

.build-slot-static.filled {
  border-color: rgba(201,161,74,0.15);
}

.build-slot-static:hover {
  background: var(--bg-3);
  border-color: var(--border-strong);
}

.slot-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-sm);
  background: var(--bg-1);
  border: 1px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--text-4);
  flex-shrink: 0;
}

.build-slot-static.filled .slot-icon {
  border-style: solid;
  border-color: rgba(201,161,74,0.12);
}

.slot-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eq-empty {
  font-size: 16px;
  opacity: 0.2;
}

.slot-label {
  font-size: 10px;
  color: var(--text-3);
  line-height: 1.3;
  min-height: calc(10px * 1.3 * 2);
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.build-slot-static.filled .slot-label {
  color: var(--text-1);
}

.slot-tier {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--gold);
  background: rgba(11,10,8,0.7);
  border-radius: 3px;
  padding: 1px 4px;
  line-height: 1;
  z-index: 2;
}

.slot-ip {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--gold-dim);
  margin-top: -2px;
}

/* Quality borders matching BuildSlot but adapted for static */
.build-slot-static.q-good { border-color: var(--q-good); }
.build-slot-static.q-outstanding { border-color: var(--q-outstanding); }
.build-slot-static.q-excellent { border-color: var(--q-excellent); }
.build-slot-static.q-masterpiece { border-color: var(--q-masterpiece); }

/* Tooltip styles (copied from BuildSlot.vue) */
.slot-tooltip {
  position: fixed;
  z-index: 2000;
  min-width: 160px;
  max-width: 240px;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: rgba(15, 17, 22, 0.98);
  box-shadow: var(--shadow-lg);
  pointer-events: none;
  backdrop-filter: blur(4px);
}

.slot-tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-0);
}

.slot-tooltip-badge {
  display: inline-flex;
  margin-top: 6px;
  font-size: 10px;
  color: var(--gold);
  border: 1px solid rgba(201,161,74,0.25);
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(201,161,74,0.08);
}

.slot-tooltip-line {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
}

@media (max-width: 600px) {
  .pvp-eq-grid {
    grid-template-columns: repeat(auto-fit, 128px);
    gap: 12px;
    justify-content: center;
  }
  .slots-column.center {
    transform: none;
  }
}
</style>
