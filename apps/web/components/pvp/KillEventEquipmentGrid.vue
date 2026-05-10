<template>
  <div class="eq-grid" :class="size">
    <div
      v-for="slot in slots"
      :key="slot.key"
      class="eq-slot"
      :class="slot.qualityClass"
      :title="slot.tooltip"
    >
      <template v-if="slot.type">
        <img
          :src="`https://render.albiononline.com/v1/item/${slot.type}.png`"
          :alt="slot.type"
          @error="onImgError"
        />
        <span v-if="showTier" class="eq-tier-badge">{{ slot.tierLabel }}</span>
        <span v-if="showIp && slot.ip" class="eq-ip-badge">{{ slot.ip }}</span>
      </template>
      <template v-else>
        <span class="eq-empty">·</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { KillEventEquipment } from '@albion-tool/types'

const props = withDefaults(defineProps<{
  equipment: KillEventEquipment
  size?: 'sm' | 'md' | 'lg'
  showTier?: boolean
  showIp?: boolean
}>(), { size: 'sm', showTier: false, showIp: false })

const SLOT_ORDER = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const
const QUALITY_CLASSES = ['', '', 'q-good', 'q-outstanding', 'q-excellent', 'q-masterpiece']

const slots = computed(() =>
  SLOT_ORDER.map((key) => {
    const item = props.equipment[key]
    if (!item?.Type) {
      return { key, type: null, qualityClass: '', tierLabel: '', ip: 0, tooltip: '' }
    }
    const type = item.Type
    const tier = itemTier(type)
    const ench = itemEnchant(type)
    const tierLabel = tier > 0 ? (ench > 0 ? `T${tier}.${ench}` : `T${tier}`) : ''
    const ip = calcItemPower(type, item.Quality)
    const qualityClass = QUALITY_CLASSES[item.Quality] ?? ''
    const tooltip = `${key}: ${type} | Q${item.Quality} | ~${ip} IP`
    return { key, type, qualityClass, tierLabel, ip, tooltip }
  })
)

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const parent = img.parentElement
  if (parent && !parent.querySelector('.eq-empty')) {
    const span = document.createElement('span')
    span.className = 'eq-empty'
    span.textContent = '?'
    parent.appendChild(span)
  }
}
</script>

<style scoped>
.eq-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 3px;
}

.eq-slot {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-1);
  border: 1px solid var(--border-subtle);
  border-radius: 3px;
  overflow: hidden;
}

/* Quality borders */
.eq-slot.q-good    { border-color: var(--q-good); }
.eq-slot.q-outstanding { border-color: var(--q-outstanding); }
.eq-slot.q-excellent   { border-color: var(--q-excellent); }
.eq-slot.q-masterpiece {
  border-color: var(--q-masterpiece);
  box-shadow: inset 0 0 8px rgba(212,164,55,0.15);
}

.eq-grid.sm .eq-slot { width: 28px; height: 28px; }
.eq-grid.md .eq-slot { width: 48px; height: 48px; }
.eq-grid.lg .eq-slot { width: 64px; height: 64px; }

.eq-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.eq-empty {
  font-size: 10px;
  color: var(--text-4);
  opacity: 0.35;
}

.eq-tier-badge {
  position: absolute;
  bottom: 1px;
  left: 1px;
  font-size: 8px;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--gold);
  background: rgba(11,10,8,0.8);
  border-radius: 2px;
  padding: 0 2px;
  line-height: 1.4;
  pointer-events: none;
}

.eq-grid.sm .eq-tier-badge { display: none; }

.eq-ip-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  font-size: 7px;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--text-1);
  background: rgba(11,10,8,0.85);
  border-radius: 2px;
  padding: 0 2px;
  line-height: 1.5;
  pointer-events: none;
}

.eq-grid.sm .eq-ip-badge { display: none; }
</style>
