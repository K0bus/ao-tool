<template>
  <div>
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Game Data</h1>
        <p class="page-subtitle">Manage Locations and Return Rates</p>
      </div>
    </div>

    <div v-if="loading" class="space-y-4 animate-pulse mt-6">
      <div class="card p-4 h-64" />
      <div class="card p-4 h-64" />
    </div>

    <div v-else class="space-y-6 mt-6">
      <!-- Locations -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-700 flex justify-between items-center">
          <div>
            <h2 class="text-sm font-semibold text-white">Locations</h2>
            <p class="text-xs text-gray-500 mt-0.5">Manage cities and specific zones</p>
          </div>
          <button class="px-3 py-1.5 text-xs font-medium bg-surface-700 hover:bg-surface-600 text-white rounded transition-colors disabled:opacity-50" @click="showLocConfirm = true" :disabled="seedingLoc">
            {{ seedingLoc ? 'Seeding...' : 'Seed Default Locations' }}
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-400 uppercase bg-surface-800">
              <tr>
                <th class="px-4 py-2">ID</th>
                <th class="px-4 py-2">Name</th>
                <th class="px-4 py-2">Type</th>
                <th class="px-4 py-2 text-right">Active</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-700">
              <tr v-for="loc in locations" :key="loc.id" class="hover:bg-surface-800/50">
                <td class="px-4 py-2 font-mono text-xs text-gray-400">{{ loc.id }}</td>
                <td class="px-4 py-2 text-gray-200">
                  <input type="text" v-model="loc.name" class="input w-full max-w-[200px] text-sm py-1 h-8" @change="updateLocation(loc.id, { name: loc.name })" />
                </td>
                <td class="px-4 py-2 text-gray-400 text-xs font-mono">{{ loc.type }}</td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                    :class="loc.isActive ? 'bg-primary-600' : 'bg-surface-600'"
                    role="switch"
                    :aria-checked="loc.isActive"
                    @click="updateLocation(loc.id, { isActive: !loc.isActive })"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition duration-200 ease-in-out"
                      :class="loc.isActive ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Return Rates -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-700 flex justify-between items-center">
          <div>
            <h2 class="text-sm font-semibold text-white">Return Rates</h2>
            <p class="text-xs text-gray-500 mt-0.5">Manage crafting/refining return rates</p>
          </div>
          <button class="px-3 py-1.5 text-xs font-medium bg-surface-700 hover:bg-surface-600 text-white rounded transition-colors disabled:opacity-50" @click="showRRConfirm = true" :disabled="seedingRR">
            {{ seedingRR ? 'Seeding...' : 'Seed Default Return Rates' }}
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-gray-400 uppercase bg-surface-800">
              <tr>
                <th class="px-4 py-2">Tier / Enchant</th>
                <th class="px-4 py-2">Base Rate</th>
                <th class="px-4 py-2">Focus Rate</th>
                <th class="px-4 py-2">City Bonus</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-surface-700">
              <tr v-for="rr in returnRates" :key="rr.id" class="hover:bg-surface-800/50">
                <td class="px-4 py-2 text-gray-200">
                  <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-700 text-xs font-medium font-mono">
                    T{{ rr.tier }} <span v-if="rr.enchantmentLevel > 0" class="text-green-400">.{{ rr.enchantmentLevel }}</span>
                  </span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <input type="number" step="0.01" min="0" max="1" v-model.number="rr.baseReturnRate" class="input text-sm py-1 h-8 w-24" @change="updateReturnRate(rr.id, { baseReturnRate: rr.baseReturnRate })" />
                    <span class="text-xs text-gray-500 w-10 text-right">{{ (rr.baseReturnRate * 100).toFixed(1) }}%</span>
                  </div>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <input type="number" step="0.01" min="0" max="1" v-model.number="rr.focusReturnRate" class="input text-sm py-1 h-8 w-24" @change="updateReturnRate(rr.id, { focusReturnRate: rr.focusReturnRate })" />
                    <span class="text-xs text-gray-500 w-10 text-right">{{ (rr.focusReturnRate * 100).toFixed(1) }}%</span>
                  </div>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <input type="number" step="0.01" min="0" max="1" v-model.number="rr.cityBonusRate" class="input text-sm py-1 h-8 w-24" @change="updateReturnRate(rr.id, { cityBonusRate: rr.cityBonusRate })" />
                    <span class="text-xs text-gray-500 w-10 text-right">{{ (rr.cityBonusRate * 100).toFixed(1) }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Save feedback -->
      <Transition name="fade">
        <div
          v-if="saveSuccess"
          class="fixed bottom-6 right-6 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded px-4 py-3 shadow-lg z-50 flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Data saved successfully
        </div>
      </Transition>
    </div>

    <ConfirmationModal
      :open="showLocConfirm"
      title="Seed Default Locations"
      message="Are you sure you want to seed default locations? This will overwrite existing locations based on their ID."
      confirm-label="Seed Locations"
      variant="danger"
      :loading="seedingLoc"
      @confirm="performSeedLocations"
      @cancel="showLocConfirm = false"
    />

    <ConfirmationModal
      :open="showRRConfirm"
      title="Seed Default Return Rates"
      message="Are you sure you want to seed default return rates? This will overwrite existing return rates."
      confirm-label="Seed Return Rates"
      variant="danger"
      :loading="seedingRR"
      @confirm="performSeedReturnRates"
      @cancel="showRRConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const locations = ref<any[]>([])
const returnRates = ref<any[]>([])
const loading = ref(false)
const saveSuccess = ref(false)
const seedingLoc = ref(false)
const seedingRR = ref(false)
const showLocConfirm = ref(false)
const showRRConfirm = ref(false)

function showSuccess() {
  saveSuccess.value = true
  setTimeout(() => (saveSuccess.value = false), 2500)
}

async function loadData() {
  loading.value = true
  try {
    const [locRes, rrRes] = await Promise.all([
      $fetch('/api/v1/admin/game-data/locations'),
      $fetch('/api/v1/admin/game-data/return-rates')
    ])
    locations.value = (locRes as any).data
    returnRates.value = (rrRes as any).data
  } catch (err) {
    console.error('Failed to load data:', err)
  } finally {
    loading.value = false
  }
}

async function updateLocation(id: string, data: any) {
  try {
    const res = await $fetch(`/api/v1/admin/game-data/locations/${id}`, {
      method: 'PATCH',
      body: data
    })
    const index = locations.value.findIndex(l => l.id === id)
    if (index !== -1) {
      locations.value[index] = { ...locations.value[index], ...(res as any).data }
    }
    showSuccess()
  } catch (err) {
    console.error('Failed to update location:', err)
    await loadData()
  }
}

async function updateReturnRate(id: string, data: any) {
  try {
    const res = await $fetch(`/api/v1/admin/game-data/return-rates/${id}`, {
      method: 'PATCH',
      body: data
    })
    const index = returnRates.value.findIndex(r => r.id === id)
    if (index !== -1) {
      returnRates.value[index] = { ...returnRates.value[index], ...(res as any).data }
    }
    showSuccess()
  } catch (err) {
    console.error('Failed to update return rate:', err)
    await loadData()
  }
}

async function performSeedLocations() {
  seedingLoc.value = true
  try {
    await $fetch('/api/v1/admin/game-data/locations/seed', { method: 'POST' })
    await loadData()
    showLocConfirm.value = false
    showSuccess()
  } catch (err) {
    console.error('Failed to seed locations:', err)
  } finally {
    seedingLoc.value = false
  }
}

async function performSeedReturnRates() {
  seedingRR.value = true
  try {
    await $fetch('/api/v1/admin/game-data/return-rates/seed', { method: 'POST' })
    await loadData()
    showRRConfirm.value = false
    showSuccess()
  } catch (err) {
    console.error('Failed to seed return rates:', err)
  } finally {
    seedingRR.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
e>
