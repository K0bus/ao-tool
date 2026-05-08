<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">System Config</h1>
      <p class="page-subtitle">Feature flags and application settings</p>
    </div>

    <div v-if="loading" class="space-y-4 animate-pulse">
      <div v-for="i in 4" :key="i" class="card p-4 h-20" />
    </div>

    <div v-else class="space-y-4">
      <!-- Feature Flags -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-700">
          <h2 class="text-sm font-semibold text-white">Feature Flags</h2>
          <p class="text-xs text-gray-500 mt-0.5">Toggle upcoming features without a deployment</p>
        </div>

        <div v-if="featureFlags" class="divide-y divide-surface-800">
          <div
            v-for="(enabled, flag) in featureFlags"
            :key="flag"
            class="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p class="text-sm font-medium text-gray-200">{{ flagLabel(flag) }}</p>
              <p class="text-xs text-gray-600 font-mono">{{ flag }}</p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-900"
              :class="enabled ? 'bg-primary-600' : 'bg-surface-600'"
              role="switch"
              :aria-checked="enabled"
              :disabled="saving === flag"
              @click="toggleFlag(flag, !enabled)"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out"
                :class="enabled ? 'translate-x-5' : 'translate-x-0'"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Search Config -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-surface-700">
          <h2 class="text-sm font-semibold text-white">Search Settings</h2>
        </div>
        <div v-if="searchConfig" class="divide-y divide-surface-800">
          <div class="flex items-center justify-between px-4 py-3">
            <div>
              <p class="text-sm font-medium text-gray-200">Default Locale</p>
              <p class="text-xs text-gray-600">Language used for search and display</p>
            </div>
            <select
              v-model="searchConfig.default_locale"
              class="input w-auto text-sm"
              @change="saveSearchConfig"
            >
              <option value="EN-US">EN-US</option>
              <option value="FR-FR">FR-FR</option>
              <option value="DE-DE">DE-DE</option>
              <option value="ZH-CN">ZH-CN</option>
              <option value="PT-BR">PT-BR</option>
            </select>
          </div>
          <div class="flex items-center justify-between px-4 py-3">
            <div>
              <p class="text-sm font-medium text-gray-200">Items Per Page</p>
              <p class="text-xs text-gray-600">Default page size for item listings</p>
            </div>
            <select
              v-model.number="searchConfig.items_per_page"
              class="input w-auto text-sm"
              @change="saveSearchConfig"
            >
              <option :value="24">24</option>
              <option :value="48">48</option>
              <option :value="96">96</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Save feedback -->
      <Transition name="fade">
        <div
          v-if="saveSuccess"
          class="text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded px-3 py-2"
        >
          Configuration saved
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface SystemConfig {
  key: string
  value: any
  description: string | null
  updatedAt: string
}

const configs = ref<SystemConfig[]>([])
const loading = ref(false)
const saving = ref<string | null>(null)
const saveSuccess = ref(false)

const featureFlags = computed<Record<string, boolean> | null>(() => {
  const fc = configs.value.find((c) => c.key === 'features')
  return fc ? (fc.value as Record<string, boolean>) : null
})

const searchConfig = computed<{ default_locale: string; items_per_page: number } | null>(() => {
  const sc = configs.value.find((c) => c.key === 'search')
  return sc ? (sc.value as any) : null
})

const FLAG_LABELS: Record<string, string> = {
  market_prices: 'Market Prices (Live)',
  profitability_calculator: 'Profitability Calculator',
  black_market: 'Black Market Tools',
  guild_tools: 'Guild Tools',
  public_api: 'Public API',
  premium_subscription: 'Premium Subscription',
}

function flagLabel(flag: string) {
  return FLAG_LABELS[flag] ?? flag.replace(/_/g, ' ')
}

async function saveConfig(key: string, value: any) {
  saving.value = key
  try {
    await $fetch('/api/v1/admin/system/config', {
      method: 'PATCH',
      body: { key, value },
    })
    const config = configs.value.find((c) => c.key === key)
    if (config) config.value = value

    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2500)
  } catch (err) {
    console.error('Failed to save config:', err)
  } finally {
    saving.value = null
  }
}

async function toggleFlag(flag: string, newValue: boolean) {
  if (!featureFlags.value) return
  const updated = { ...featureFlags.value, [flag]: newValue }
  await saveConfig('features', updated)
}

async function saveSearchConfig() {
  if (!searchConfig.value) return
  await saveConfig('search', searchConfig.value)
}

async function loadConfigs() {
  loading.value = true
  try {
    const res = await $fetch<{ data: SystemConfig[] }>('/api/v1/admin/system/config')
    configs.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(loadConfigs)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
