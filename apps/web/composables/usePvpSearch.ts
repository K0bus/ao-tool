interface PvpSearchResult {
  Id: string
  Name: string
  GuildId?: string
  GuildName?: string
}

interface PvpSearchResults {
  guilds: PvpSearchResult[]
  players: PvpSearchResult[]
}

export function usePvpSearch() {
  const query = ref('')
  const results = ref<PvpSearchResults>({ guilds: [], players: [] })
  const searching = ref(false)

  const doSearch = useDebounceFn(async () => {
    if (query.value.length < 2) {
      results.value = { guilds: [], players: [] }
      return
    }
    searching.value = true
    try {
      const res = await $fetch<{ data: PvpSearchResults }>('/api/v1/pvp/search', {
        query: { q: query.value },
      })
      results.value = res.data
    } catch {
      results.value = { guilds: [], players: [] }
    } finally {
      searching.value = false
    }
  }, 300)

  watch(query, doSearch)

  function clear() {
    query.value = ''
    results.value = { guilds: [], players: [] }
  }

  return { query, results, searching, clear }
}
