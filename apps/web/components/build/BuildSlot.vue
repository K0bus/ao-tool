<template>
  <button class="build-slot" :class="{ filled: !!item, active }" @click="$emit('click')">
    <div v-if="item" class="slot-tier">T{{ item.tier }}<template v-if="item.enchantmentLevel > 0">.{{ item.enchantmentLevel }}</template></div>
    <div class="slot-icon">
      <AoItemImage v-if="item" :unique-name="item.uniqueName" :display-name="item.name" :alt="item.name" />
      <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
    </div>
    <span class="slot-label">{{ item ? item.name : label }}</span>
    <button v-if="item" class="slot-remove" title="Retirer" @click.stop="$emit('remove')">
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  </button>
</template>

<script setup lang="ts">
import type { EquippedItem } from '~/composables/useBuildCreator'

defineProps<{
  label: string
  item: EquippedItem | null
  active?: boolean
}>()

defineEmits<{
  click: []
  remove: []
}>()
</script>

<style scoped>
.build-slot {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 12px 8px 10px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
  width: 100%;
  min-height: 108px;
}
.build-slot:hover {
  border-color: var(--border-strong);
  background: var(--bg-3);
}
.build-slot.active {
  border-color: var(--gold-dim);
  background: rgba(201,161,74,0.05);
  outline: 1px solid rgba(201,161,74,0.18);
  outline-offset: 1px;
}
.build-slot.filled {
  border-color: rgba(201,161,74,0.22);
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
.build-slot.filled .slot-icon {
  border-style: solid;
  border-color: rgba(201,161,74,0.18);
}
.slot-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slot-label {
  font-size: 10px;
  color: var(--text-3);
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.build-slot.filled .slot-label {
  color: var(--text-2);
}

.slot-tier {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--gold);
  background: rgba(11,10,8,0.75);
  border-radius: 3px;
  padding: 1px 4px;
  line-height: 1;
}

.slot-remove {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 4px;
  border-radius: 3px;
  color: var(--text-4);
  background: rgba(11,10,8,0.65);
  opacity: 0;
  transition: opacity 0.1s;
}
.build-slot:hover .slot-remove { opacity: 1; }
.slot-remove:hover { background: rgba(176,74,50,0.25); color: var(--danger); }
</style>
