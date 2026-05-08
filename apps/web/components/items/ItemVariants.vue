<template>
  <div class="card overflow-hidden">
    <div class="px-4 py-3 border-b border-surface-700">
      <h3 class="text-sm font-semibold text-white">Enchantment Variants</h3>
    </div>

    <div class="divide-y divide-surface-800">
      <!-- Base item -->
      <NuxtLink
        v-if="baseItem"
        :to="`/items/${baseItem.uniqueName}`"
        class="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors group"
      >
        <ItemIcon :unique-name="baseItem.uniqueName" size="sm" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-300 truncate group-hover:text-white transition-colors">{{ baseItem.name }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <ItemTierBadge :tier="baseItem.tier" />
          <span class="tier-badge bg-gray-700 text-gray-300 text-xs font-bold">Base</span>
        </div>
      </NuxtLink>

      <!-- Current item (highlighted) -->
      <div class="flex items-center gap-3 px-4 py-3 bg-primary-600/10 border-l-2 border-primary-500">
        <ItemIcon :unique-name="currentItem.uniqueName" size="sm" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white font-medium truncate">{{ currentItem.name }}</p>
          <p class="text-xs text-gray-500">Current</p>
        </div>
        <div class="flex items-center gap-1.5">
          <ItemTierBadge :tier="currentItem.tier" />
          <span v-if="currentItem.enchantmentLevel > 0" class="tier-badge bg-purple-700 text-white text-xs font-bold">
            .{{ currentItem.enchantmentLevel }}
          </span>
        </div>
      </div>

      <!-- Enchanted variants -->
      <NuxtLink
        v-for="variant in variants"
        :key="variant.uniqueName"
        :to="`/items/${variant.uniqueName}`"
        class="flex items-center gap-3 px-4 py-3 hover:bg-surface-800/50 transition-colors group"
      >
        <ItemIcon :unique-name="variant.uniqueName" size="sm" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-300 truncate group-hover:text-white transition-colors">{{ variant.name }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <ItemTierBadge :tier="variant.tier" />
          <span class="tier-badge bg-purple-700 text-white text-xs font-bold">
            .{{ variant.enchantmentLevel }}
          </span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ItemRef {
  id: string
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  iconUrl?: string | null
}

defineProps<{
  currentItem: ItemRef
  baseItem?: ItemRef | null
  variants: ItemRef[]
}>()
</script>
