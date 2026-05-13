<template>
  <div class="page">
    <template v-if="build">
      <div class="page-header">
        <div>
          <div class="crumbs">
            <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>
            <NuxtLink to="/builds">Builds</NuxtLink><span class="sep">/</span>
            {{ build.title }}
          </div>
          <h1 style="display:flex;align-items:center;gap:10px">
            {{ build.title }}
            <span v-if="modeLabel" class="build-mode-badge">{{ modeLabel }}</span>
          </h1>
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            <span class="t-muted" style="font-size:13px">
              {{ build.viewCount }} vues · {{ formatDate(build.createdAt) }}
            </span>
            <span class="vis-tag" :class="build.visibility.toLowerCase()">
              {{ visLabel(build.visibility) }}
            </span>
          </div>
          <div v-if="buildMetaTags.length" class="build-meta-tags">
            <span v-for="tag in buildMetaTags" :key="tag" class="build-meta-tag">{{ tag }}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <NuxtLink v-if="canManageBuild" :to="`/builds/create?edit=${build.shareCode}`" class="ds-btn">
            Modifier
          </NuxtLink>
          <button v-if="canManageBuild" class="ds-btn danger-btn" :disabled="deleting" @click="deleteBuild">
            {{ deleting ? 'Suppression…' : 'Supprimer' }}
          </button>
          <button class="ds-btn" @click="copyLink">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            {{ copied ? 'Copié !' : 'Partager' }}
          </button>
          <NuxtLink to="/builds/create" class="ds-btn primary">Créer le mien</NuxtLink>
        </div>
      </div>

      <ConfirmationModal
        :open="showDeleteConfirm"
        eyebrow="Suppression"
        title="Supprimer ce build ?"
        :message="deleteMessage"
        confirm-label="Supprimer"
        cancel-label="Annuler"
        loading-label="Suppression…"
        :loading="deleting"
        variant="danger"
        @cancel="showDeleteConfirm = false"
        @confirm="confirmDeleteBuild"
      />

      <div class="build-detail-body">
        <div v-if="equippedItems.length > 0" class="panel">
          <div class="panel-header"><h3>Équipement & sorts</h3></div>
          <div class="panel-body">
            <div class="detail-layout">
              <div class="detail-col equipment-col">
                <div class="detail-col-title">Équipement</div>
                <div class="detail-slot-grid">
                  <div
                    v-for="(column, columnIndex) in SLOT_COLUMNS"
                    :key="`slot-col-${columnIndex}`"
                    class="detail-slot-column"
                    :class="{ center: columnIndex === 1 }"
                  >
                    <div
                      v-for="slotKey in column"
                      :key="slotKey"
                      class="detail-slot-wrap"
                    >
                      <BuildSlot
                        :label="slotDef(slotKey)?.label ?? slotKey"
                        :item="slotItem(slotKey)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-col">
                <div class="detail-col-title">Sorts actifs</div>
                <div class="spell-grid">
                  <div
                    v-for="spellEntry in activeSpells"
                    :key="spellEntry.slotKey"
                    class="spell-cell"
                    @mouseenter="showSpellTooltip($event, spellEntry)"
                    @mousemove="moveTooltip"
                    @mouseleave="hideTooltip"
                  >
                    <div class="spell-cell-icon">
                      <img
                        :src="spellIconUrl(spellEntry.spell)"
                        :alt="displaySpellName(spellEntry)"
                        @error="handleSpellImgError"
                      />
                      <span class="spell-fallback">{{ spellShortLabel(spellEntry.slotKey) }}</span>
                    </div>
                    <span class="spell-key-badge">{{ spellSlotLabel(spellEntry.slotKey) }}</span>
                  </div>
                </div>
                <div v-if="activeSpells.length === 0" class="spell-empty-state">Aucun sort actif sélectionné</div>
              </div>

              <div class="detail-col">
                <div class="detail-col-title">Sorts passifs</div>
                <div class="spell-grid">
                  <div
                    v-for="spellEntry in passiveSpells"
                    :key="spellEntry.slotKey"
                    class="spell-cell"
                    @mouseenter="showSpellTooltip($event, spellEntry)"
                    @mousemove="moveTooltip"
                    @mouseleave="hideTooltip"
                  >
                    <div class="spell-cell-icon">
                      <img
                        :src="spellIconUrl(spellEntry.spell)"
                        :alt="displaySpellName(spellEntry)"
                        @error="handleSpellImgError"
                      />
                      <span class="spell-fallback">{{ spellShortLabel(spellEntry.slotKey) }}</span>
                    </div>
                    <span class="spell-key-badge">{{ spellSlotLabel(spellEntry.slotKey) }}</span>
                  </div>
                </div>
                <div v-if="passiveSpells.length === 0" class="spell-empty-state">Aucun sort passif sélectionné</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="build.description" class="panel">
          <div class="panel-header"><h3>Description</h3></div>
          <div class="panel-body">
            <p style="font-size:13px;line-height:1.7;color:var(--text-1);white-space:pre-line">{{ build.description }}</p>
          </div>
        </div>
      </div>

      <div
        v-if="tooltip.visible"
        class="build-hover-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <div class="build-hover-tooltip-title">{{ tooltip.title }}</div>
        <div v-if="tooltip.badge" class="build-hover-tooltip-badge">{{ tooltip.badge }}</div>
        <div v-for="line in tooltip.lines" :key="line" class="build-hover-tooltip-line" v-html="parseAoDescription(line)"></div>
      </div>
    </template>

    <div v-else-if="error" class="panel empty-state" style="padding:64px;text-align:center">
      <p class="t-muted">Build introuvable ou accès refusé.</p>
      <NuxtLink to="/builds" class="ds-btn" style="margin-top:12px">← Retour aux builds</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { buildTagLabel, type BuildBudget, type BuildContentType, type BuildDifficulty, type BuildGroupScale, type BuildPlaystyle, type BuildRole } from '@albion-tool/types'
import { EQUIPMENT_SLOTS, type EquippedItem, type SlotKey } from '~/composables/useBuildCreator'
import { labelWeaponCategory, labelWeaponSubcategory } from '~/utils/buildTaxonomy'
import { parseAoDescription } from '~/utils/aoRender'

const auth = useAuth()
const router = useRouter()
const route = useRoute()
const code = route.params.code as string
const SLOT_COLUMNS: SlotKey[][] = [
  ['bag', 'weapon', 'potion'],
  ['helmet', 'armor', 'shoes', 'mount'],
  ['cape', 'offhand', 'food'],
]
const ACTIVE_ORDER = ['Q', 'W', 'E', 'R', 'D', 'F', '1', '2']

interface BuildDetail {
  id: string
  shareCode: string
  title: string
  description?: string | null
  gameMode?: string | null
  visibility: string
  equipment: Record<string, string | null>
  primaryContentType?: BuildContentType | null
  contentTypes: BuildContentType[]
  roles: BuildRole[]
  groupScales: BuildGroupScale[]
  playstyles: BuildPlaystyle[]
  difficulty?: BuildDifficulty | null
  budget?: BuildBudget | null
  weaponCategory?: string | null
  weaponSubcategory?: string | null
  spells: Array<{
    slotKey: string
    spell: {
      id: string
      name: string
      description?: string | null
      icon?: string | null
      cooldown?: number | null
      energyCost?: number | null
      castTime?: number | null
      channelDuration?: number | null
      range?: number | null
      category?: string | null
      uiType?: string | null
      spellKind?: string | null
    }
  }>
  viewCount: number
  createdAt: string
  userId?: string | null
}

interface HoverTooltipState {
  visible: boolean
  x: number
  y: number
  key: string
  title: string
  badge: string
  lines: string[]
}

interface SpellDetail {
  id: string
  name: string
  description?: string | null
  cooldown?: number | null
  energyCost?: number | null
  castTime?: number | null
  channelDuration?: number | null
  range?: number | null
  category?: string | null
  uiType?: string | null
  spellKind?: string | null
}

const { data, error } = await useFetch<{ data: BuildDetail }>(`/api/v1/builds/${code}`)
const build = computed(() => data.value?.data ?? null)
const deleting = ref(false)
const showDeleteConfirm = ref(false)
const canManageBuild = computed(() => Boolean(build.value?.userId && auth.user.value?.id === build.value.userId))
const deleteMessage = computed(() =>
  build.value
    ? `Le build "${build.value.title}" sera supprimé définitivement. Cette action est irréversible.`
    : 'Ce build sera supprimé définitivement.'
)
const primaryContentLabel = computed(() => buildTagLabel('contentType', build.value?.primaryContentType))
const modeLabel = computed(() => primaryContentLabel.value ?? build.value?.gameMode ?? null)
const buildMetaTags = computed(() => {
  if (!build.value) return []

  return [
    labelWeaponSubcategory(build.value.weaponSubcategory),
    labelWeaponCategory(build.value.weaponCategory),
    ...build.value.roles.map((role) => buildTagLabel('role', role)),
    ...build.value.groupScales.map((scale) => buildTagLabel('groupScale', scale)),
    ...build.value.playstyles.map((playstyle) => buildTagLabel('playstyle', playstyle)),
    buildTagLabel('difficulty', build.value.difficulty),
    buildTagLabel('budget', build.value.budget),
  ].filter((value): value is string => Boolean(value))
})

const equipment = computed(() => build.value?.equipment ?? {})
const equipmentItemIds = computed(() =>
  Object.values(equipment.value).filter((item): item is string => Boolean(item))
)

const { data: itemNames } = await useAsyncData(`build-item-names:${code}`, async () => {
  if (equipmentItemIds.value.length === 0) return {}

  const res = await $fetch<{ data: Record<string, string> }>('/api/v1/pvp/items/names', {
    method: 'POST',
    body: { ids: equipmentItemIds.value, locale: 'FR-FR' },
  })

  return res.data
})

const spellIds = computed(() =>
  build.value?.spells.map(({ spell }) => spell.id) ?? []
)

const { data: spellNames } = await useAsyncData(`build-spell-details:${code}`, async () => {
  const ids = spellIds.value
  if (ids.length === 0) return {}

  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await $fetch<{ data: SpellDetail }>(`/api/v1/spells/${id}`, {
          query: { locale: 'FR-FR' },
        })
        return [id, res.data] as const
      } catch {
        return [id, null] as const
      }
    })
  )

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, SpellDetail] => entry[1] !== null))
})

const equippedItems = computed(() =>
  EQUIPMENT_SLOTS.filter((slot) => Boolean(build.value?.equipment[slot.key]))
)
const isTwoHandedWeapon = computed(() => {
  const weapon = build.value?.equipment.weapon
  return Boolean(weapon && (weapon.includes('_2H_') || weapon.includes('_MAIN_')))
})
const activeSpells = computed(() => {
  const selectedByHotkey = new Map<string, BuildDetail['spells'][number]>()

  for (const buildSpell of build.value?.spells ?? []) {
    const hotkey = activeSpellHotkey(buildSpell.slotKey)
    if (!hotkey || selectedByHotkey.has(hotkey)) continue
    selectedByHotkey.set(hotkey, buildSpell)
  }

  return [...selectedByHotkey.values()]
    .sort((a, b) => activeSpellRank(a.slotKey) - activeSpellRank(b.slotKey))
})
const passiveSpells = computed(() =>
  [...(build.value?.spells ?? [])]
    .filter(({ slotKey, spell }) => parseSpellSlotKey(slotKey).spellSlot === 'passive' || spell.spellKind === 'passive')
)

const tooltip = reactive<HoverTooltipState>({
  visible: false,
  x: 0,
  y: 0,
  key: '',
  title: '',
  badge: '',
  lines: [],
})
const spellDetails = reactive<Record<string, SpellDetail | undefined>>({})

watchEffect(() => {
  const details = spellNames.value ?? {}
  for (const [id, detail] of Object.entries(details)) {
    spellDetails[id] = detail
  }
})

const copied = ref(false)
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

function deleteBuild() {
  if (!build.value || deleting.value) return
  showDeleteConfirm.value = true
}

async function confirmDeleteBuild() {
  if (!build.value || deleting.value) return

  deleting.value = true
  try {
    await $fetch(`/api/v1/builds/${build.value.shareCode}` as any, { method: 'DELETE' })
    showDeleteConfirm.value = false
    await router.push('/builds/me')
  } catch (e: any) {
    alert(e?.data?.message ?? 'Erreur lors de la suppression')
  } finally {
    deleting.value = false
  }
}

function visLabel(v: string) {
  return { PUBLIC: 'Public', UNLISTED: 'Non listé', PRIVATE: 'Privé' }[v] ?? v
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function slotDef(slot: SlotKey) {
  return EQUIPMENT_SLOTS.find((entry) => entry.key === slot) ?? null
}

function slotItem(slot: SlotKey): EquippedItem | null {
  const uniqueName = build.value?.equipment[slot]
  if (!uniqueName) return null

  return {
    uniqueName,
    name: itemNames.value?.[uniqueName] ?? uniqueName,
    tier: extractTier(uniqueName),
    enchantmentLevel: extractEnchantment(uniqueName),
    twoHanded: slot === 'weapon' ? isTwoHandedWeapon.value : false,
  }
}

function extractTier(uniqueName: string) {
  const match = uniqueName.match(/^T(\d+)/)
  return match ? Number(match[1]) : 0
}

function extractEnchantment(uniqueName: string) {
  const match = uniqueName.match(/@(\d+)/)
  return match ? Number(match[1]) : 0
}

function parseSpellSlotKey(slotKey: string) {
  const [slot, spellSlot] = slotKey.split(':')
  return { slot, spellSlot }
}

function spellSlotLabel(slotKey: string) {
  const { spellSlot } = parseSpellSlotKey(slotKey)
  if (spellSlot === 'passive') return 'Passif'
  return activeSpellHotkey(slotKey) ?? slotKey
}

function spellShortLabel(slotKey: string) {
  const label = spellSlotLabel(slotKey)
  return label === 'Passif' ? 'P' : label
}

function activeSpellRank(slotKey: string) {
  const label = activeSpellHotkey(slotKey)
  const index = label ? ACTIVE_ORDER.indexOf(label) : -1
  return index >= 0 ? index : ACTIVE_ORDER.length + 1
}

function activeSpellHotkey(slotKey: string) {
  const { slot, spellSlot } = parseSpellSlotKey(slotKey)
  if (spellSlot === 'passive') return null

  if (slot === 'weapon') {
    return {
      q: 'Q',
      w: 'W',
      e: 'E',
    }[spellSlot] ?? null
  }

  if (spellSlot !== 'q') return null

  return {
    armor: 'R',
    helmet: 'D',
    shoes: 'F',
    potion: '1',
    food: '2',
  }[slot] ?? null
}

function spellIconUrl(spell: { id: string }) {
  return `https://render.albiononline.com/v1/spell/${spell.id}.png`
}

function handleSpellImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.parentElement?.querySelector('.spell-fallback') as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}

function moveTooltip(event: MouseEvent) {
  tooltip.x = event.clientX + 14
  tooltip.y = event.clientY + 18
}

function hideTooltip() {
  tooltip.visible = false
  tooltip.key = ''
}

async function showSpellTooltip(event: MouseEvent, buildSpell: BuildDetail['spells'][number]) {
  moveTooltip(event)
  tooltip.key = `spell:${buildSpell.spell.id}`

  applySpellTooltip(buildSpell.slotKey, buildSpell.spell)
  tooltip.visible = true

  if (!spellDetails[buildSpell.spell.id]) {
    try {
      const res = await $fetch<{ data: SpellDetail }>(`/api/v1/spells/${buildSpell.spell.id}`, {
        query: { locale: 'FR-FR' },
      })
      spellDetails[buildSpell.spell.id] = res.data
    } catch {
      spellDetails[buildSpell.spell.id] = buildSpell.spell
    }
  }

  if (tooltip.visible && tooltip.key === `spell:${buildSpell.spell.id}`) {
    applySpellTooltip(buildSpell.slotKey, spellDetails[buildSpell.spell.id] ?? buildSpell.spell)
  }
}

function displaySpellName(buildSpell: BuildDetail['spells'][number]) {
  return spellDetails[buildSpell.spell.id]?.name
    ?? spellNames.value?.[buildSpell.spell.id]?.name
    ?? buildSpell.spell.name
}

function applySpellTooltip(
  slotKey: string,
  spell: SpellDetail | BuildDetail['spells'][number]['spell'],
) {
  const slot = parseSpellSlotKey(slotKey).slot as SlotKey
  const slotLabel = slotDef(slot)?.label ?? slot
  const item = slotItem(slot)
  const lines = [`${slotLabel} · ${spellSlotLabel(slotKey)}`]
  if (item?.name) lines.push(item.name)
  const stats = formatSpellStats(spell)
  if (stats.length > 0) lines.push(stats.join(' · '))
  if (spell.description) lines.push(spell.description)
  if (spell.category || spell.uiType || spell.spellKind) {
    lines.push([
      spell.spellKind && `Type: ${spell.spellKind}`,
      spell.uiType && `UI: ${spell.uiType}`,
      spell.category && `Catégorie: ${spell.category}`,
    ].filter(Boolean).join(' · '))
  }

  tooltip.title = spell.name
  tooltip.badge = spellSlotLabel(slotKey)
  tooltip.lines = lines
}

function formatSpellStats(spell: SpellDetail | BuildDetail['spells'][number]['spell']) {
  return [
    spell.cooldown != null ? `Cooldown: ${formatSpellNumber(spell.cooldown)}s` : null,
    spell.energyCost != null ? `Énergie: ${formatSpellNumber(spell.energyCost)}` : null,
    spell.castTime != null ? `Cast: ${formatSpellNumber(spell.castTime)}s` : null,
    spell.channelDuration != null ? `Channel: ${formatSpellNumber(spell.channelDuration)}s` : null,
    spell.range != null ? `Portée: ${formatSpellNumber(spell.range)}m` : null,
  ].filter((value): value is string => Boolean(value))
}

function formatSpellNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

useSeoMeta({
  title: computed(() => build.value ? `${build.value.title} — Albion Codex` : 'Build — Albion Codex'),
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.build-mode-badge {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold);
  background: rgba(201,161,74,0.1);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 8px;
  vertical-align: middle;
}

.vis-tag {
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid var(--border);
  color: var(--text-3);
}
.vis-tag.public { color: var(--success); border-color: rgba(125,154,74,0.3); }
.vis-tag.unlisted { color: var(--warning); }
.danger-btn {
  color: var(--danger);
  border-color: rgba(176,74,50,0.35);
}
.danger-btn:hover {
  background: rgba(176,74,50,0.08);
}

.build-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.build-meta-tag {
  font-size: 12px;
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 9px;
  background: var(--bg-1);
}

.build-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.85fr 0.85fr;
  gap: 0;
  align-items: start;
}

.detail-col {
  min-width: 0;
  padding: 0 18px;
}

.detail-col:first-child {
  padding-left: 0;
}

.detail-col + .detail-col {
  border-left: 1px solid var(--border);
}

.detail-col-title {
  margin-bottom: 10px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-3);
  font-family: var(--font-display);
}

.detail-slot-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.detail-slot-column {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-slot-column.center {
  transform: translateY(calc(-92px / 8));
}

.detail-slot-wrap {
  width: 100%;
}

.detail-slot-grid :deep(.build-slot) {
  min-height: 92px;
  padding: 10px 7px 8px;
  gap: 5px;
}

.detail-slot-grid :deep(.slot-icon) {
  width: 52px;
  height: 52px;
}

.detail-slot-grid :deep(.slot-label) {
  font-size: 9px;
  min-height: calc(9px * 1.3 * 2);
}

.detail-slot-grid :deep(.slot-tier) {
  top: 4px;
  left: 4px;
}

.detail-slot-grid :deep(.slot-remove) {
  display: none;
}

.spell-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spell-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  max-width: 72px;
  text-align: center;
}

.spell-cell-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--bg-1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spell-cell-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.spell-fallback {
  display: none;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-3);
}

.spell-key-badge {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--gold);
  border: 1px solid rgba(201,161,74,0.24);
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(201,161,74,0.08);
}

.spell-empty-state {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-4);
}

.build-hover-tooltip {
  position: fixed;
  z-index: 1200;
  min-width: 180px;
  max-width: 320px;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: rgba(15, 17, 22, 0.96);
  box-shadow: var(--shadow-lg);
  pointer-events: none;
}

.build-hover-tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-0);
}

.build-hover-tooltip-badge {
  display: inline-flex;
  margin-top: 6px;
  font-size: 10px;
  color: var(--gold);
  border: 1px solid rgba(201,161,74,0.25);
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(201,161,74,0.08);
}

.build-hover-tooltip-line {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-2);
}

@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .detail-col {
    padding: 0;
  }

  .detail-col + .detail-col {
    border-left: 0;
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-top: 16px;
  }

  .detail-slot-grid {
    grid-template-columns: 1fr;
  }

  .detail-slot-column.center {
    transform: none;
  }
}
</style>
