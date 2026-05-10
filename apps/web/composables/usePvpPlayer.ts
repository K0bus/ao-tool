import type { Player } from '@albion-tool/types'

export function usePvpPlayer(id: Ref<string>) {
  return useFetch(() => `/api/v1/pvp/players/${id.value}`, {
    key: () => `pvp-player-${id.value}`,
    transform: (r: { data: Player }) => r.data,
  })
}
