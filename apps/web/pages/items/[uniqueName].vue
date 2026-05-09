<template>
  <div>
    <!-- Loading skeleton -->
    <template v-if="pending">
      <div class="flex items-start gap-6 mb-8 animate-pulse">
        <div class="w-24 h-24 rounded-lg bg-surface-700 shrink-0" />
        <div class="flex-1">
          <div class="h-8 bg-surface-700 rounded w-64 mb-3" />
          <div class="h-4 bg-surface-800 rounded w-40 mb-2" />
          <div class="h-4 bg-surface-800 rounded w-32" />
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="card p-12 text-center">
      <p class="text-lg font-semibold text-white mb-2">Item not found</p>
      <p class="text-sm text-gray-500 mb-6">{{ route.params.uniqueName }}</p>
      <NuxtLink to="/items" class="btn-secondary">← Back to Items</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="item">
      <!-- Breadcrumb -->
      <nav class="flex items-center gap-2 text-xs text-gray-600 mb-6">
        <NuxtLink to="/" class="hover:text-gray-400">Home</NuxtLink>
        <span>/</span>
        <NuxtLink to="/items" class="hover:text-gray-400">Items</NuxtLink>
        <span>/</span>
        <span class="text-gray-400 truncate max-w-xs">{{ item.name }}</span>
      </nav>

      <!-- Item header -->
      <div class="flex items-start gap-5 mb-8">
        <!-- Icon large -->
        <div class="relative shrink-0">
          <ItemIcon :unique-name="item.uniqueName" size="xl" class="rounded-xl shadow-card" />
          <div class="absolute -bottom-2 -right-2 flex gap-1">
            <ItemTierBadge :tier="item.tier" />
            <span v-if="item.enchantmentLevel > 0" class="tier-badge bg-purple-700 text-white text-xs font-bold">
              .{{ item.enchantmentLevel }}
            </span>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-white mb-1">{{ item.name }}</h1>
          <p class="text-sm text-gray-500 font-mono mb-3">{{ item.uniqueName }}</p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span v-if="item.shopCategory" class="inline-flex items-center px-2 py-1 rounded-md bg-surface-700 text-xs text-gray-300 border border-surface-600">
              {{ item.shopCategory }}
            </span>
            <span v-if="item.shopSubcategory" class="inline-flex items-center px-2 py-1 rounded-md bg-surface-700 text-xs text-gray-400">
              {{ item.shopSubcategory }}
            </span>
            <span v-if="item.isCraftable" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-xs text-green-400 border border-green-500/20">
              Craftable
            </span>
            <span v-if="item.isRefinable" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-xs text-blue-400 border border-blue-500/20">
              Refinable
            </span>
          </div>

          <!-- Stats inline -->
          <div class="flex items-center gap-5 text-sm text-gray-400">
            <span v-if="item.weight">
              <span class="text-gray-600">Weight </span>
              <span class="text-gray-200">{{ item.weight }}</span>
            </span>
            <span v-if="item.maxStackSize">
              <span class="text-gray-600">Max stack </span>
              <span class="text-gray-200">{{ item.maxStackSize.toLocaleString() }}</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Tab navigation -->
      <div class="flex gap-1 border-b border-surface-700 mb-6">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.id
            ? 'border-primary-500 text-primary-400'
            : 'border-transparent text-gray-500 hover:text-gray-300'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="ml-1.5 text-xs text-gray-600">({{ tab.count }})</span>
        </button>
      </div>

      <!-- Tab: Market -->
      <div v-if="activeTab === 'market'">
        <ItemMarketDashboard
          :unique-name="item.uniqueName"
          :live-prices="item.marketPrices ?? []"
        />
      </div>

      <!-- Tab: Overview -->
      <div v-if="activeTab === 'overview'" class="space-y-4">
        <!-- Description -->
        <div v-if="description" class="card p-4">
          <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
          <p class="text-sm text-gray-300 leading-relaxed">{{ description }}</p>
        </div>

        <!-- Localizations -->
        <div class="card overflow-hidden">
          <div class="px-4 py-3 border-b border-surface-700">
            <h3 class="text-sm font-semibold text-white">Names by Language</h3>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-surface-800">
            <div
              v-for="loc in item.localizations"
              :key="loc.locale"
              class="px-4 py-2.5"
            >
              <p class="text-xs text-gray-600 mb-0.5">{{ loc.locale }}</p>
              <p class="text-sm text-gray-200">{{ loc.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Crafting -->
      <div v-if="activeTab === 'crafting'" class="space-y-4">
        <CraftingTree
          v-if="item.craftingRecipe"
          :item-unique-name="item.uniqueName"
          :ingredients="item.craftingRecipe.ingredients"
          :crafting-fame="item.craftingRecipe.craftingFame"
          :result-count="item.craftingRecipe.resultCount"
          :station-id="item.craftingRecipe.craftingStationId"
          title="Crafting Recipe"
        />
        <CityBonusPanel :bonuses="item.cityBonuses ?? []" />
      </div>

      <!-- Tab: Refining -->
      <div v-if="activeTab === 'refining'">
        <CraftingTree
          v-if="item.refiningRecipe"
          :item-unique-name="item.uniqueName"
          :ingredients="item.refiningRecipe.ingredients"
          :result-count="item.refiningRecipe.resultCount"
          :station-id="item.refiningRecipe.craftingStationId"
          title="Refining Recipe"
        />
      </div>

      <!-- Tab: Variants -->
      <div v-if="activeTab === 'variants'">
        <ItemVariants
          :current-item="item"
          :base-item="item.baseItem"
          :variants="item.enchantVariants ?? []"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ItemIcon from '~/components/items/ItemIcon.vue'
import ItemTierBadge from '~/components/items/ItemTierBadge.vue'
import ItemVariants from '~/components/items/ItemVariants.vue'
import ItemMarketDashboard from '~/components/items/ItemMarketDashboard.vue'
import CraftingTree from '~/components/craft/CraftingTree.vue'
import CityBonusPanel from '~/components/craft/CityBonusPanel.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const uniqueName = computed(() => route.params.uniqueName as string)

const { data: item, pending, error } = await useFetch(() => `/api/v1/items/${encodeURIComponent(uniqueName.value)}`, {
  key: () => `item-${uniqueName.value}`,
  transform: (res: { data: any }) => res.data,
})

const description = computed(() =>
  item.value?.localizations?.find((l: any) => l.locale === 'EN-US')?.description ?? null
)

// Tabs dynamiques selon les données disponibles
const availableTabs = computed(() => {
  if (!item.value) return []
  const tabs = [{ id: 'overview', label: 'Overview', count: 0 }]
  
  // Market tab if prices exist
  if (item.value.marketPrices?.length > 0) {
    tabs.unshift({ id: 'market', label: 'Market', count: 0 })
  }

  if (item.value.craftingRecipe) tabs.push({ id: 'crafting', label: 'Crafting', count: item.value.craftingRecipe.ingredients.length })
  if (item.value.refiningRecipe) tabs.push({ id: 'refining', label: 'Refining', count: item.value.refiningRecipe.ingredients.length })
  const variantCount = (item.value.enchantVariants?.length ?? 0) + (item.value.baseItem ? 1 : 0)
  if (variantCount > 0) tabs.push({ id: 'variants', label: 'Variants', count: variantCount })
  return tabs
})

const activeTab = ref('overview')

// Set default tab once data is loaded
watch(item, (v) => {
  if (!v) return
  if (v.marketPrices?.length > 0) activeTab.value = 'market'
  else if (v.craftingRecipe) activeTab.value = 'crafting'
  else if (v.refiningRecipe) activeTab.value = 'refining'
  else activeTab.value = 'overview'
}, { immediate: true })

// SEO
useHead(() => ({
  title: item.value ? `${item.value.name} — Albion Tool` : 'Item — Albion Tool',
  meta: [
    {
      name: 'description',
      content: item.value
        ? `${item.value.name} T${item.value.tier} — Crafting recipe, return rates, and city bonuses`
        : '',
    },
  ],
}))
</script>
