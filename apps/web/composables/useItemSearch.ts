import Fuse from 'fuse.js'

interface SearchItem {
  u: string // uniqueName
  n: string // name
  t: number // tier
  s: string // search string
}

export interface ResultItem {
  uniqueName: string
  name: string
  tier: number
}

// Global state to ensure we only load and index once
const globalIndex = ref<SearchItem[]>([])
const globalFuse = ref<Fuse<SearchItem> | null>(null)
const globalLoading = ref(false)

export function useItemSearch() {
  const init = async () => {
    if (globalIndex.value.length > 0 || globalLoading.value) return
    globalLoading.value = true
    try {
      const data = await $fetch<any[]>('/api/v1/items/search-index')
      
      const enriched = data.map(item => ({
        u: item.u,
        n: item.n,
        t: item.t,
        s: `T${item.t} ${item.n}` // Simplified search string
      }))

      globalIndex.value = enriched
      globalFuse.value = new Fuse(enriched, {
        keys: [
          { name: 'n', weight: 1 },
          { name: 'u', weight: 0.3 }
        ],
        threshold: 0.3,
        distance: 100,
        minMatchCharLength: 2
      })
    } catch (e) {
      console.error('Failed to load search index', e)
    } finally {
      globalLoading.value = false
    }
  }

  const search = (query: string, limit = 8): ResultItem[] => {
    if (!globalFuse.value || !query) return []

    const q = query.trim().toUpperCase()
    
    // Logic Optimization: Detect Tier in query (e.g., "T6", "T 6")
    const tierMatch = q.match(/\bT([1-8])\b/)
    const tier = tierMatch ? parseInt(tierMatch[1]) : null

    // If a tier is specified, we filter the index FIRST to reduce Fuse workload
    let searchPool = globalIndex.value
    let finalQuery = q

    if (tier) {
      searchPool = globalIndex.value.filter(item => item.t === tier)
      // Remove the "T6" from the query to let Fuse focus on the name
      finalQuery = q.replace(/\bT[1-8]\b/, '').trim()
    }

    // If after removing Tier there's nothing left, return top items of that tier
    if (tier && !finalQuery) {
      return searchPool.slice(0, limit).map(i => ({
        uniqueName: i.u,
        name: i.n,
        tier: i.t
      }))
    }

    // Use a temporary Fuse instance for the filtered pool (very fast on small sets)
    // or just use the global one if no tier filter
    const fuseToUse = tier 
      ? new Fuse(searchPool, { keys: ['n', 'u'], threshold: 0.35 })
      : globalFuse.value

    return fuseToUse.search(finalQuery || q, { limit }).map(r => ({
      uniqueName: r.item.u,
      name: r.item.n,
      tier: r.item.t
    }))
  }

  return {
    init,
    search,
    isLoading: computed(() => globalLoading.value)
  }
}
