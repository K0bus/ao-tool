export type SlotKey = 'weapon' | 'offhand' | 'helmet' | 'armor' | 'shoes' | 'cape' | 'bag' | 'food' | 'potion' | 'mount'
export type SpellSlotKey = 'Q' | 'W' | 'E' | 'P1' | 'P2'

export interface EquippedItem {
  uniqueName: string
  name: string
  tier: number
  enchantmentLevel: number
  iconUrl?: string | null
}

export interface SelectedSpell {
  id: string
  name: string
  icon?: string | null
  cooldown?: number | null
  energyCost?: number | null
  spellKind: string
}

export interface SpellOption {
  slotNumber: number | null
  tag?: string | null
  spell: SelectedSpell
}

export interface SlotFilter {
  itemType?: string      // comma-separated ItemType values
  category?: string      // shopCategory filter
  subcategory?: string   // shopSubcategory filter
}

export const EQUIPMENT_SLOTS: { key: SlotKey; label: string; icon: string; filter: SlotFilter }[] = [
  { key: 'helmet',  label: 'Casque',       icon: 'M', filter: { category: 'head' } },
  { key: 'weapon',  label: 'Arme',         icon: 'A', filter: { category: 'weapons' } },
  { key: 'armor',   label: 'Armure',       icon: 'P', filter: { category: 'armors' } },
  { key: 'offhand', label: 'Bouclier',     icon: 'O', filter: { category: 'offhands' } },
  { key: 'shoes',   label: 'Chaussures',   icon: 'C', filter: { category: 'shoes' } },
  { key: 'cape',    label: 'Cape',         icon: 'K', filter: { category: 'capes' } },
  { key: 'bag',     label: 'Sac',          icon: 'S', filter: { category: 'bags' } },
  { key: 'food',    label: 'Nourriture',   icon: 'N', filter: { category: 'consumables', subcategory: 'food' } },
  { key: 'potion',  label: 'Potion',       icon: 'T', filter: { category: 'consumables', subcategory: 'potions' } },
  { key: 'mount',   label: 'Monture',      icon: 'V', filter: { itemType: 'MOUNT' } },
]

export const SPELL_SLOTS: { key: SpellSlotKey; label: string; slotNumber: number | null }[] = [
  { key: 'Q', label: 'Q', slotNumber: 1 },
  { key: 'W', label: 'W', slotNumber: 2 },
  { key: 'E', label: 'E', slotNumber: 3 },
  { key: 'P1', label: 'Passif 1', slotNumber: null },
  { key: 'P2', label: 'Passif 2', slotNumber: null },
]

export function useBuildCreator() {
  const equipment = reactive<Record<SlotKey, EquippedItem | null>>({
    weapon: null, offhand: null, helmet: null, armor: null, shoes: null,
    cape: null, bag: null, food: null, potion: null, mount: null,
  })

  const selectedSpells = reactive<Partial<Record<SpellSlotKey, SelectedSpell>>>({})
  const spellOptions = reactive<Partial<Record<SlotKey, SpellOption[]>>>({})

  const title = ref('Mon build')
  const description = ref('')
  const gameMode = ref('')
  const visibility = ref<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>('PRIVATE')

  const isSaving = ref(false)
  const shareCode = ref<string | null>(null)
  const guestShareUrl = ref<string | null>(null)

  const activeSlot = ref<SlotKey | null>(null)

  async function setItem(slot: SlotKey, item: EquippedItem | null) {
    equipment[slot] = item
    // Nettoie les spells si l'item est retiré
    if (!item) {
      spellOptions[slot] = []
      return
    }
    // Charge les spells disponibles pour cet item
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

  function setSpell(slotKey: SpellSlotKey, spell: SelectedSpell | null) {
    if (spell) selectedSpells[slotKey] = spell
    else delete selectedSpells[slotKey]
  }

  // Toutes les options pour un slot de spell (Q/W/E = slotNumber 1/2/3, P1/P2 = null)
  function getSpellOptionsForSlot(spellSlot: SpellSlotKey): SpellOption[] {
    const { slotNumber } = SPELL_SLOTS.find((s) => s.key === spellSlot)!
    const all: SpellOption[] = []
    for (const slot of Object.keys(spellOptions) as SlotKey[]) {
      const opts = spellOptions[slot] ?? []
      all.push(...opts.filter((o) => o.slotNumber === slotNumber))
    }
    // Déduplique par spell.id
    const seen = new Set<string>()
    return all.filter((o) => { if (seen.has(o.spell.id)) return false; seen.add(o.spell.id); return true })
  }

  const hasEquipment = computed(() => Object.values(equipment).some(Boolean))
  const hasSpells = computed(() => Object.keys(selectedSpells).length > 0)

  async function saveBuild() {
    isSaving.value = true
    try {
      const body = {
        title: title.value,
        description: description.value || undefined,
        gameMode: gameMode.value || undefined,
        visibility: visibility.value,
        equipment: Object.fromEntries(
          Object.entries(equipment).map(([k, v]) => [k, v?.uniqueName ?? null])
        ),
        spells: Object.entries(selectedSpells).map(([slotKey, spell]) => ({
          slotKey,
          spellId: spell!.id,
        })),
      }
      const res = await $fetch<{ data: { shareCode: string } }>('/api/v1/builds', {
        method: 'POST',
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
      equipment: Object.fromEntries(
        Object.entries(equipment).map(([k, v]) => [k, v?.uniqueName ?? null])
      ) as Record<string, string | null>,
      spells: Object.entries(selectedSpells).map(([slot, spell]) => ({
        slot,
        id: spell!.id,
      })),
    }
    const json = JSON.stringify(payload)
    const encoded = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/builds/s/${encoded}`
  }

  function reset() {
    for (const k of Object.keys(equipment) as SlotKey[]) equipment[k] = null
    for (const k of Object.keys(selectedSpells) as SpellSlotKey[]) delete selectedSpells[k]
    title.value = 'Mon build'
    description.value = ''
    gameMode.value = ''
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
    gameMode,
    visibility,
    isSaving,
    shareCode,
    guestShareUrl,
    activeSlot,
    hasEquipment,
    hasSpells,
    setItem,
    setSpell,
    getSpellOptionsForSlot,
    saveBuild,
    buildGuestUrl,
    reset,
  }
}
