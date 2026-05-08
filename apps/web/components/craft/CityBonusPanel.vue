<template>
  <div class="card overflow-hidden">
    <div class="px-4 py-3 border-b border-surface-700">
      <h3 class="text-sm font-semibold text-white">City Bonuses</h3>
      <p class="text-xs text-gray-500 mt-0.5">Craft in these cities for bonus output</p>
    </div>

    <div v-if="bonuses.length === 0" class="px-4 py-6 text-center text-sm text-gray-600">
      No city-specific bonuses for this item
    </div>

    <table v-else class="w-full text-sm">
      <thead>
        <tr class="border-b border-surface-700 text-xs text-gray-500">
          <th class="text-left px-4 py-2 font-medium">City</th>
          <th class="text-right px-4 py-2 font-medium">Craft Bonus</th>
          <th class="text-right px-4 py-2 font-medium">Refine Bonus</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-800">
        <tr
          v-for="bonus in bonuses"
          :key="bonus.locationId"
          class="hover:bg-surface-800/40 transition-colors"
        >
          <td class="px-4 py-2.5 font-medium text-gray-200">
            {{ bonus.location.name }}
          </td>
          <td class="px-4 py-2.5 text-right">
            <span v-if="bonus.craftingBonus > 0" class="text-green-400 font-semibold">
              +{{ (bonus.craftingBonus * 100).toFixed(0) }}%
            </span>
            <span v-else class="text-gray-600">—</span>
          </td>
          <td class="px-4 py-2.5 text-right">
            <span v-if="bonus.refiningBonus > 0" class="text-blue-400 font-semibold">
              +{{ (bonus.refiningBonus * 100).toFixed(0) }}%
            </span>
            <span v-else class="text-gray-600">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  bonuses: Array<{
    locationId: string
    craftingBonus: number
    refiningBonus: number
    location: { id: string; name: string }
  }>
}>()
</script>
