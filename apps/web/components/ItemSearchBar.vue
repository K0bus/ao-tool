<template>
  <div
    :class="isNavbar ? 'nav-search' : 'hero-search'"
    v-click-outside="closeResults"
  >
    <!-- Navbar Search Icon -->
    <span v-if="isNavbar" class="ic-search">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
    </span>

    <!-- Hero Search Icon -->
    <svg v-else viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold);flex-shrink:0"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>

    <input
      ref="inputRef"
      v-model="query"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
      :class="isNavbar ? '' : 'hero-search-input'"
      @focus="onFocus"
      @keydown.enter="onEnter"
      @keydown.esc="closeResults"
      @keydown.down.prevent="onArrowDown"
      @keydown.up.prevent="onArrowUp"
    />

    <!-- Navbar KBD -->
    <span v-if="isNavbar" class="kbd">⌘K</span>

    <!-- Hero KBD -->
    <kbd v-else style="font-family:var(--font-mono);font-size:11px;color:var(--gold);background:rgba(201,161,74,0.1);border:1px solid var(--gold-deep);padding:4px 10px;border-radius:4px">↵</kbd>

    <!-- Results Dropdown (Using original .nav-search-results classes) -->
    <div v-if="showResults && results.length > 0" class="nav-search-results" :style="!isNavbar ? heroResultsStyle : {}">
      <NuxtLink
        v-for="(item, index) in results"
        :key="item.uniqueName"
        :to="`/items/${item.uniqueName}`"
        class="nsr-row"
        :class="{ 'is-selected': index === selectedIndex }"
        @click="closeResults"
        @mouseenter="selectedIndex = index"
      >
        <div class="item-frame" style="width:32px;height:32px;flex-shrink:0">
          <AoItemImage :unique-name="item.uniqueName" :display-name="item.name" :alt="item.name" />
        </div>
        <div class="nsr-meta">
          <div class="nsr-name">{{ item.name }}</div>
          <div class="nsr-id">{{ item.uniqueName }}</div>
        </div>
        <span :class="`tier-badge t${item.tier}`">T{{ item.tier }}</span>
      </NuxtLink>
    </div>
    <div v-else-if="showResults && query.length >= 2 && !isLoading" class="nav-search-results nsr-empty" :style="!isNavbar ? heroResultsStyle : {}">
      Aucun résultat pour "{{ query }}"
    </div>
    <div v-else-if="showResults && isLoading" class="nav-search-results nsr-empty" :style="!isNavbar ? heroResultsStyle : {}">
      Chargement du codex...
    </div>
  </div>
</template>

<script setup lang="ts">
import { refDebounced } from '@vueuse/core'

const props = defineProps({
  isNavbar: { type: Boolean, default: false },
  placeholder: { type: String, default: "Rechercher un item..." }
})

const query = ref('')
const debouncedQuery = refDebounced(query, 150)
const showResults = ref(false)
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const router = useRouter()

const { init, search, isLoading } = useItemSearch()

const results = computed(() => {
  if (debouncedQuery.value.length < 2) return []
  return search(debouncedQuery.value, 8)
})

const heroResultsStyle = {
  top: 'calc(100% + 12px)',
  left: '20px',
  right: '20px',
  borderRadius: 'var(--radius-lg)'
}

watch(query, (newVal) => {
  selectedIndex.value = -1
  if (newVal.length >= 2) {
    showResults.value = true
  } else {
    showResults.value = false
  }
})

function onFocus() {
  init()
  if (query.value.length >= 2) {
    showResults.value = true
  }
}

function closeResults() {
  showResults.value = false
}

function onEnter() {
  if (selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
    router.push(`/items/${results.value[selectedIndex.value].uniqueName}`)
    closeResults()
  } else if (query.value.trim()) {
    router.push({ path: '/items', query: { q: query.value.trim() } })
    closeResults()
  }
}

function onArrowDown() {
  if (results.value.length === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % results.value.length
}

function onArrowUp() {
  if (results.value.length === 0) return
  selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length
}

const vClickOutside = {
  mounted(el: any, binding: any) {
    el._clickOutside = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('mousedown', el._clickOutside)
  },
  unmounted(el: any) {
    document.removeEventListener('mousedown', el._clickOutside)
  }
}

defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
/* Ensure the results are visible and styled correctly */
.nav-search-results {
  display: block !important;
}

.nsr-row.is-selected {
  background: rgba(201, 161, 74, 0.1);
  color: var(--text-0);
}

/* Custom scrollbar for dropdown */
.nav-search-results::-webkit-scrollbar {
  width: 6px;
}
.nav-search-results::-webkit-scrollbar-thumb {
  background: var(--gold-deep);
  border-radius: 3px;
}

/* Specific adjustments for Hero mode results if needed */
.hero-search .nav-search-results {
  max-height: 400px;
}
</style>
