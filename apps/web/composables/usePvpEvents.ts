import type { KillEvent } from '@albion-tool/types'

export function usePvpEvents(options?: { guildId?: Ref<string | undefined> }) {
  const PAGE_SIZE = 51
  const events = ref<KillEvent[]>([])
  const offset = ref(0)
  const hasMore = ref(true)
  const pending = ref(false)
  const error = ref<Error | null>(null)

  async function load(reset = false) {
    if (reset) {
      events.value = []
      offset.value = 0
      hasMore.value = true
    }
    if (!hasMore.value || pending.value) return
    pending.value = true
    error.value = null
    try {
      const res = await $fetch<{ data: KillEvent[] }>('/api/v1/pvp/events', {
        query: {
          limit: PAGE_SIZE,
          offset: offset.value,
          guildId: options?.guildId?.value,
        },
      })
      const batch = res.data
      events.value.push(...batch)
      hasMore.value = batch.length >= PAGE_SIZE
      offset.value += batch.length
    } catch (err) {
      error.value = err as Error
    } finally {
      pending.value = false
    }
  }

  if (options?.guildId) {
    watch(options.guildId, () => load(true))
  }

  onMounted(() => load())

  return {
    events: readonly(events),
    pending: readonly(pending),
    error: readonly(error),
    hasMore: readonly(hasMore),
    loadMore: () => load(),
    refresh: () => load(true),
  }
}
