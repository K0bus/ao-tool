import { buildGameModeFromContentType, type BuildBudget, type BuildContentType, type BuildDifficulty, type BuildGroupScale, type BuildPlaystyle, type BuildRole } from '@albion-tool/types'

export type SlotKey = 'weapon' | 'offhand' | 'helmet' | 'armor' | 'shoes' | 'cape' | 'bag' | 'food' | 'potion' | 'mount'
export type SpellSlotKey = 'Q' | 'W' | 'E' | 'PASSIVE'

export interface EquippedItem {
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  itemPower?: number | null
  twoHanded?: boolean | null
  iconUrl?: string | null
  itemType?: string | null
  shopCategory?: string | null
  shopSubcategory?: string | null
}

export interface SelectedSpell {
  id: string
  name: string
  icon?: string | null
  cooldown?: number | null
  energyCost?: number | null
  range?: number | null
  category?: string | null
  uiType?: string | null
  spellKind: string
}

export interface SpellOption {
  slotNumber: number | null
  tag?: string | null
  spell: SelectedSpell
}

export interface SpellGroup {
  key: string
  slot: SlotKey
  slotLabel: string
  item: EquippedItem
  spellSlot: SpellSlotKey
  spellSlotLabel: string
  options: SpellOption[]
}

export interface SlotFilter {
  itemType?: string      // comma-separated ItemType values
  category?: string      // shopCategory filter
  subcategory?: string   // shopSubcategory filter
}

export const EQUIPMENT_SLOTS: { key: SlotKey; label: string; icon: string; filter: SlotFilter }[] = [
  { key: 'helmet',  label: 'Casque',       icon: 'M', filter: { category: 'head' } },
  { key: 'weapon',  label: 'Arme',         icon: 'A', filter: { itemType: 'WEAPON' } },
  { key: 'armor',   label: 'Armure',       icon: 'P', filter: { category: 'armors' } },
  { key: 'offhand', label: 'Secondaire',   icon: 'O', filter: { itemType: 'OFF_HAND' } },
  { key: 'shoes',   label: 'Chaussures',   icon: 'C', filter: { category: 'shoes' } },
  { key: 'cape',    label: 'Cape',         icon: 'K', filter: { category: 'capes' } },
  { key: 'bag',     label: 'Sac',          icon: 'S', filter: { category: 'bags' } },
  { key: 'food',    label: 'Nourriture',   icon: 'N', filter: { itemType: 'CONSUMABLE', subcategory: 'food,omelette,stew,soup,sandwich,pie' } },
  { key: 'potion',  label: 'Potion',       icon: 'T', filter: { itemType: 'CONSUMABLE', subcategory: 'potions,potion' } },
  { key: 'mount',   label: 'Monture',      icon: 'V', filter: { itemType: 'MOUNT' } },
]

export const SPELL_SLOTS: { key: SpellSlotKey; label: string; slotNumber: number | null }[] = [
  { key: 'Q', label: 'Q', slotNumber: 1 },
  { key: 'W', label: 'W', slotNumber: 2 },
  { key: 'E', label: 'E', slotNumber: 3 },
  { key: 'PASSIVE', label: 'Passif', slotNumber: null },
]

const SPELL_SLOT_BY_NUMBER: Record<number, SpellSlotKey> = {
  1: 'Q',
  2: 'W',
  3: 'E',
}

function isSingleActiveSpellSlot(slot: SlotKey) {
  return slot === 'helmet' || slot === 'armor' || slot === 'shoes'
}

function activeSpellSlotLabel(slot: SlotKey, spellSlot: SpellSlotKey) {
  if (spellSlot === 'PASSIVE') return 'Passif'

  if (slot === 'helmet') return 'D'
  if (slot === 'armor') return 'R'
  if (slot === 'shoes') return 'F'

  return spellSlot
}

export function useBuildCreator() {
  const equipment = reactive<Record<SlotKey, EquippedItem | null>>({
    weapon: null, offhand: null, helmet: null, armor: null, shoes: null,
    cape: null, bag: null, food: null, potion: null, mount: null,
  })

  const selectedSpells = reactive<Record<string, SelectedSpell>>({})
  const spellOptions = reactive<Partial<Record<SlotKey, SpellOption[]>>>({})

  const title = ref('Mon build')
  const description = ref('')
  const contentTypes = ref<BuildContentType[]>([])
  const roles = ref<BuildRole[]>([])
  const groupScales = ref<BuildGroupScale[]>([])
  const playstyles = ref<BuildPlaystyle[]>([])
  const difficulty = ref<BuildDifficulty | null>(null)
  const budget = ref<BuildBudget | null>(null)
  const visibility = ref<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE')
  const primaryContentType = computed<BuildContentType | null>(() => contentTypes.value[0] ?? null)
  const gameMode = computed(() => buildGameModeFromContentType(primaryContentType.value) ?? '')

  const isSaving = ref(false)
  const shareCode = ref<string | null>(null)
  const guestShareUrl = ref<string | null>(null)

  const activeSlot = ref<SlotKey | null>(null)

  async function setItem(slot: SlotKey, item: EquippedItem | null) {
    if (slot === 'offhand' && equipment.weapon?.twoHanded) return
    clearSelectedSpellsForEquipmentSlot(slot)
    equipment[slot] = item
    if (slot === 'weapon' && item?.twoHanded) {
      clearSelectedSpellsForEquipmentSlot('offhand')
      equipment.offhand = null
      spellOptions.offhand = []
    }
    if (!item) {
      spellOptions[slot] = []
      return
    }
    await fetchSpellOptions(slot, item.uniqueName)
  }

  async function fetchSpellOptions(slot: SlotKey, uniqueName: string) {
    try {
      const res = await $fetch<{ data: SpellOption[] }>(`/api/v1/items/${uniqueName}/spells`)
      spellOptions[slot] = res.data
    } catch {
      spellOptions[slot] = []
    }
  }

  function clearSelectedSpellsForEquipmentSlot(slot: SlotKey) {
    for (const key of Object.keys(selectedSpells)) {
      if (key.startsWith(`${slot}:`)) delete selectedSpells[key]
    }
  }

  function setSpell(groupKey: string, spell: SelectedSpell | null) {
    if (!spell) return
    selectedSpells[groupKey] = spell
  }

  function spellSlotFromNumber(slot: SlotKey, slotNumber: number | null): SpellSlotKey {
    if (slotNumber === null) return 'PASSIVE'
    if (isSingleActiveSpellSlot(slot)) return 'Q'
    return SPELL_SLOT_BY_NUMBER[slotNumber] ?? 'E'
  }

  function buildSpellGroupKey(slot: SlotKey, spellSlot: SpellSlotKey) {
    return `${slot}:${spellSlot.toLowerCase()}`
  }

  const spellGroups = computed<SpellGroup[]>(() => {
    const groups: SpellGroup[] = []

    for (const slotDef of EQUIPMENT_SLOTS) {
      const item = equipment[slotDef.key]
      if (!item) continue

      const opts = spellOptions[slotDef.key] ?? []
      const grouped = new Map<SpellSlotKey, SpellOption[]>()

      for (const opt of opts) {
        const spellSlot = spellSlotFromNumber(slotDef.key, opt.slotNumber)
        const list = grouped.get(spellSlot) ?? []
        list.push(opt)
        grouped.set(spellSlot, list)
      }

      for (const spellSlotDef of SPELL_SLOTS) {
        const options = grouped.get(spellSlotDef.key)
        if (!options?.length) continue

        groups.push({
          key: buildSpellGroupKey(slotDef.key, spellSlotDef.key),
          slot: slotDef.key,
          slotLabel: slotDef.label,
          item,
          spellSlot: spellSlotDef.key,
          spellSlotLabel: activeSpellSlotLabel(slotDef.key, spellSlotDef.key),
          options,
        })
      }
    }

    return groups
  })

  watchEffect(() => {
    const groups = spellGroups.value
    const activeGroupKeys = new Set(groups.map((group) => group.key))

    for (const key of Object.keys(selectedSpells)) {
      if (!activeGroupKeys.has(key)) delete selectedSpells[key]
    }

    for (const group of groups) {
      const current = selectedSpells[group.key]
      const hasCurrentOption = current
        ? group.options.some((option) => option.spell.id === current.id)
        : false

      if (!hasCurrentOption && group.options.length > 0) {
        selectedSpells[group.key] = group.options[0]!.spell
      }
    }
  })

  const hasEquipment = computed(() => Object.values(equipment).some(Boolean))
  const hasSpells = computed(() => Object.keys(selectedSpells).length > 0)
  const offhandDisabled = computed(() => Boolean(equipment.weapon?.twoHanded))
  const baseIp = computed(() => {
    const weaponIp = equipment.weapon?.itemPower ?? null
    const offhandIp = equipment.offhand?.itemPower ?? null
    const headIp = equipment.helmet?.itemPower ?? null
    const armorIp = equipment.armor?.itemPower ?? null
    const shoesIp = equipment.shoes?.itemPower ?? null
    const capeIp = equipment.cape?.itemPower ?? null

    if (!weaponIp && !offhandIp && !headIp && !armorIp && !shoesIp && !capeIp) {
      return null
    }

    const values: number[] = []

    if (weaponIp != null) {
      values.push(weaponIp)
      if (equipment.weapon?.twoHanded) values.push(weaponIp)
    }

    if (!equipment.weapon?.twoHanded && offhandIp != null) {
      values.push(offhandIp)
    }

    if (headIp != null) values.push(headIp)
    if (armorIp != null) values.push(armorIp)
    if (shoesIp != null) values.push(shoesIp)
    if (capeIp != null) values.push(capeIp)

    if (values.length === 0) return null
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  })

  async function saveBuild() {
    return persistBuild()
  }

  async function updateBuild(code: string) {
    return persistBuild(code)
  }

  async function persistBuild(code?: string) {
    isSaving.value = true
    try {
      const body = {
        title: title.value,
        description: description.value || undefined,
        gameMode: gameMode.value || undefined,
        primaryContentType: primaryContentType.value ?? undefined,
        contentTypes: uniqueValues(contentTypes.value),
        roles: uniqueValues(roles.value),
        groupScales: uniqueValues(groupScales.value),
        playstyles: uniqueValues(playstyles.value),
        difficulty: difficulty.value || undefined,
        budget: budget.value || undefined,
        visibility: visibility.value,
        equipment: Object.fromEntries(
          Object.entries(equipment).map(([k, v]) => [k, v?.uniqueName ?? null])
        ),
        spells: Object.entries(selectedSpells).map(([slotKey, spell]) => ({
          slotKey,
          spellId: spell.id,
        })),
      }
      const res = await $fetch<{ data: { shareCode: string } }>(code ? `/api/v1/builds/${code}` : '/api/v1/builds', {
        method: code ? 'PUT' : 'POST',
        body,
      })
      shareCode.value = res.data.shareCode
      return res.data
    } finally {
      isSaving.value = false
    }
  }

  function buildGuestUrl(): string {
    const payload = {
      v: 1 as const,
      title: title.value,
      gameMode: gameMode.value || undefined,
      primaryContentType: primaryContentType.value || undefined,
      contentTypes: uniqueValues(contentTypes.value),
      roles: uniqueValues(roles.value),
      groupScales: uniqueValues(groupScales.value),
      playstyles: uniqueValues(playstyles.value),
      difficulty: difficulty.value || undefined,
      budget: budget.value || undefined,
      weaponCategory: equipment.weapon?.shopCategory ?? undefined,
      weaponSubcategory: equipment.weapon?.shopSubcategory ?? undefined,
      equipment: Object.fromEntries(
        Object.entries(equipment).map(([k, v]) => [k, v?.uniqueName ?? null])
      ) as Record<string, string | null>,
      spells: Object.entries(selectedSpells).map(([slot, spell]) => ({
        slot,
        id: spell.id,
      })),
    }
    const json = JSON.stringify(payload)
    const encoded = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/builds/s/${encoded}`
  }

  function reset() {
    for (const k of Object.keys(equipment) as SlotKey[]) equipment[k] = null
    for (const k of Object.keys(selectedSpells)) delete selectedSpells[k]
    for (const k of Object.keys(spellOptions) as SlotKey[]) delete spellOptions[k]
    title.value = 'Mon build'
    description.value = ''
    contentTypes.value = []
    roles.value = []
    groupScales.value = []
    playstyles.value = []
    difficulty.value = null
    budget.value = null
    visibility.value = 'PRIVATE'
    shareCode.value = null
    guestShareUrl.value = null
  }

  return {
    equipment,
    selectedSpells,
    spellOptions,
    title,
    description,
    primaryContentType,
    contentTypes,
    roles,
    groupScales,
    playstyles,
    difficulty,
    budget,
    gameMode,
    visibility,
    isSaving,
    shareCode,
    guestShareUrl,
    activeSlot,
    hasEquipment,
    hasSpells,
    offhandDisabled,
    baseIp,
    spellGroups,
    setItem,
    setSpell,
    saveBuild,
    updateBuild,
    buildGuestUrl,
    reset,
  }
}

function uniqueValues<T extends string>(values: T[]) {
  return [...new Set(values)]
}
