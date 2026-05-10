export interface KillEventItem {
  Type: string           // Item uniqueName, e.g. "T8_2H_POLEHAMMER" or "T7_HEAD_PLATE_AVALON@1"
  Count: number
  Quality: number        // 1=Normal, 2=Good, 3=Outstanding, 4=Excellent, 5=Masterpiece
  ActiveSpells?: readonly string[]
  PassiveSpells?: readonly string[]
  LegendarySoul?: string | null
}

export interface KillEventEquipment {
  MainHand?: KillEventItem | null
  OffHand?: KillEventItem | null
  Head?: KillEventItem | null
  Armor?: KillEventItem | null
  Shoes?: KillEventItem | null
  Bag?: KillEventItem | null
  Cape?: KillEventItem | null
  Mount?: KillEventItem | null
  Potion?: KillEventItem | null
  Food?: KillEventItem | null
}

export interface KillEventParticipant {
  Id: string
  Name: string
  GuildId?: string
  GuildName?: string
  AllianceId?: string
  AllianceName?: string
  AverageItemPower: number
  Equipment: KillEventEquipment
  DamageDone?: number
  SupportHealingDone?: number
}

export interface KillEvent {
  EventId: number
  TimeStamp: string
  Version: number
  Killer: KillEventParticipant
  Victim: KillEventParticipant
  Assists?: readonly KillEventParticipant[] | null
  Participants?: readonly KillEventParticipant[] | null
  TotalVictimKillFame: number
  Location?: string | null
  groupMemberCount?: number
  numberOfParticipants?: number
}

export interface GuildMemberLifetimeStats {
  PvE: { Total: number }
  Crafting: { Total: number }
  CrystalLeague: number
  Timestamp: string
}

export interface GuildMember {
  Id: string
  Name: string
  GuildId: string
  LifetimeStatistics?: GuildMemberLifetimeStats
}

export interface Guild {
  Id: string
  Name: string
  AllianceId?: string
  AllianceName?: string
  AllianceTag?: string
  Founded?: string
  MemberCount?: number
  killFame?: number
  deathFame?: number
}

export interface Alliance {
  AllianceId: string
  AllianceName: string
  AllianceTag?: string
  FounderId?: string
  FounderName?: string
  Founded?: string
  NumPlayers?: number
  Guilds: ReadonlyArray<{ Id: string; Name: string; MemberCount?: number }>
}

export interface GatheringStats {
  Total: number
  Royal?: number
  Outlands?: number
  Avalon?: number
}

export interface PlayerLifetimeStats {
  PvE: { Total: number; Royal?: number; Outlands?: number; Avalon?: number; Hellgate?: number; CorruptedDungeon?: number; Mists?: number }
  Gathering: { All?: GatheringStats; Fiber?: GatheringStats; Hide?: GatheringStats; Ore?: GatheringStats; Rock?: GatheringStats; Wood?: GatheringStats }
  Crafting: { Total: number; Royal?: number; Outlands?: number; Avalon?: number }
  CrystalLeague: number
  FishingFame?: number
  FarmingFame?: number
  Timestamp: string
}

export interface Player {
  Id: string
  Name: string
  GuildId?: string
  GuildName?: string
  AllianceId?: string
  AllianceName?: string
  AllianceTag?: string
  Avatar?: string
  AvatarRing?: string
  KillFame: number
  DeathFame: number
  FameRatio?: number
  AverageItemPower: number
  Equipment: KillEventEquipment
  Inventory?: readonly KillEventItem[]
  LifetimeStatistics?: PlayerLifetimeStats
  recentKills?: readonly KillEvent[]
  recentDeaths?: readonly KillEvent[]
}
