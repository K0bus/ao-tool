<template>
  <div>
    <!-- Hero -->
    <div class="text-center py-16 px-4">
      <div class="inline-flex items-center gap-2 bg-primary-600/10 border border-primary-600/20 rounded-full px-4 py-1.5 text-xs text-primary-400 font-medium mb-6">
        <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
        Albion Online Database
      </div>

      <h1 class="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
        Everything about<br>
        <span class="text-primary-400">Albion Online items</span>
      </h1>

      <p class="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
        Search, analyze and plan your crafting builds with complete recipes, return rates and city bonuses.
      </p>

      <!-- Search -->
      <form class="max-w-xl mx-auto" @submit.prevent="goSearch">
        <div class="flex items-center gap-3 w-full px-4 py-3 bg-surface-800 border border-surface-600 rounded-lg hover:border-primary-600/50 transition-colors focus-within:border-primary-600/50">
          <svg class="w-4 h-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="query"
            type="search"
            class="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none"
            placeholder="Search items, weapons, resources..."
            autofocus
          />
          <kbd class="hidden sm:inline-flex items-center gap-1 text-xs text-gray-600 bg-surface-700 px-2 py-0.5 rounded shrink-0">
            Enter
          </kbd>
        </div>
      </form>
    </div>

    <!-- Feature grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      <div v-for="feature in features" :key="feature.title" class="card p-5">
        <div class="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center mb-3 text-primary-400">
          <component :is="feature.icon" class="w-4 h-4" />
        </div>
        <h3 class="font-semibold text-white text-sm mb-1">{{ feature.title }}</h3>
        <p class="text-xs text-gray-500 leading-relaxed">{{ feature.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const query = ref('')

function goSearch() {
  const q = query.value.trim()
  router.push({ path: '/items', query: q ? { q } : undefined })
}

const features = [
  {
    title: 'Complete Item Database',
    description: 'All items, weapons, armor, resources and consumables with full details and enchantment variants.',
    icon: resolveComponent('IconDatabase'),
  },
  {
    title: 'Crafting Recipes',
    description: 'Full crafting trees with ingredients, sub-recipes, station requirements and city bonuses.',
    icon: resolveComponent('IconCraft'),
  },
  {
    title: 'Return Rates',
    description: 'Calculate resource return rates with or without focus, per city and per tier.',
    icon: resolveComponent('IconChart'),
  },
]
</script>
