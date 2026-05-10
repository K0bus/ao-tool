import type { Guild, GuildMember, KillEvent } from '@albion-tool/types'

export function usePvpGuild(id: Ref<string>) {
  const guild = useFetch(() => `/api/v1/pvp/guilds/${id.value}`, {
    key: () => `pvp-guild-${id.value}`,
    transform: (r: { data: Guild }) => r.data,
  })

  const members = useLazyFetch(() => `/api/v1/pvp/guilds/${id.value}/members`, {
    key: () => `pvp-guild-members-${id.value}`,
    transform: (r: { data: GuildMember[] }) => r.data,
    default: () => [] as GuildMember[],
  })

  const topKills = useLazyFetch(() => `/api/v1/pvp/guilds/${id.value}/top`, {
    key: () => `pvp-guild-top-${id.value}`,
    transform: (r: { data: KillEvent[] }) => r.data,
    default: () => [] as KillEvent[],
  })

  return { guild, members, topKills }
}
