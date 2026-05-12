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
          <button class="ds-btn" @click="copyLink">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            {{ copied ? 'Copié !' : 'Partager' }}
          </button>
          <NuxtLink to="/builds/create" class="ds-btn primary">Créer le mien</NuxtLink>
        </div>
      </div>

      <div class="build-detail-body">
        <!-- Équipement -->
        <div v-if="build.spells.length > 0" class="panel">
          <div class="panel-header"><h3>Équipement</h3></div>
          <div class="panel-body">
          <div class="spell-lines">
            <div v-for="row in spellRows" :key="row.slot.key" class="spell-line">
              <div
                class="spell-line-item"
                @mouseenter="showItemTooltip($event, row)"
                @mousemove="moveTooltip"
                @mouseleave="hideTooltip"
              >
                <NuxtLink :to="`/items/${row.item}`" class="spell-line-item-icon">
                  <AoItemImage
                    :unique-name="row.item"
                    :alt="row.slot.label"
                  />
                </NuxtLink>
                <div class="spell-line-item-meta">
                  <div class="spell-line-item-title-row">
                    <span class="spell-line-item-name">{{ row.name }}</span>
                    <span :class="['tier-badge', `t${row.tier}`]">
                      {{ row.tierLabel }}
                    </span>
                  </div>
                  <span class="spell-line-item-label">{{ row.slot.label }}</span>
                </div>
              </div>

              <div class="spell-line-spells">
                <div
                  v-for="bs in row.spells"
                  :key="bs.slotKey"
                  class="spell-cell"
                  @mouseenter="showSpellTooltip($event, row, bs)"
                  @mousemove="moveTooltip"
                  @mouseleave="hideTooltip"
                >
                  <div class="spell-cell-icon">
                    <img
                      :src="spellIconUrl(bs.spell)"
                      :alt="displaySpellName(bs)"
                      @error="handleSpellImgError"
                    />
                    <span class="spell-fallback">{{ spellShortLabel(bs.slotKey) }}</span>
                  </div>
                  <span class="spell-key-badge">{{ spellSlotLabel(bs.slotKey) }}</span>
                  <span class="spell-cell-name">{{ displaySpellName(bs) }}</span>
                  <span v-if="bs.spell.cooldown" class="spell-cell-cd">{{ bs.spell.cooldown }}s</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Description -->
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
        <div v-for="line in tooltip.lines" :key="line" class="build-hover-tooltip-line">{{ line }}</div>
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
import { EQUIPMENT_SLOTS } from '~/composables/useBuildCreator'
import { labelWeaponCategory, labelWeaponSubcategory } from '~/utils/buildTaxonomy'
import { itemTier, itemTierLabel } from '~/utils/pvp'

const route = useRoute()
const code = route.params.code as string

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
}

interface SpellRow {
  slot: typeof EQUIPMENT_SLOTS[number]
  item: string
  spells: BuildDetail['spells']
  tier: number
  tierLabel: string
  name: string
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

const spellRows = computed<SpellRow[]>(() => {
  if (!build.value) return []

  return EQUIPMENT_SLOTS
    .map<SpellRow | null>((slot) => {
      const item = build.value?.equipment[slot.key]
      const spells = build.value?.spells.filter(({ slotKey }) => parseSpellSlotKey(slotKey).slot === slot.key) ?? []
      const tier = item ? itemTier(item) : 0
      const tierLabel = item ? itemTierLabel(item) : '?'
      const name = item ? itemNames.value?.[item] ?? item : slot.label

      return item && spells.length > 0
        ? { slot, item, spells, tier, tierLabel, name }
        : null
    })
    .filter((row): row is SpellRow => row !== null)
})

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

function visLabel(v: string) {
  return { PUBLIC: 'Public', UNLISTED: 'Non listé', PRIVATE: 'Privé' }[v] ?? v
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function parseSpellSlotKey(slotKey: string) {
  const [slot, spellSlot] = slotKey.split(':')
  return { slot, spellSlot }
}

function spellSlotLabel(slotKey: string) {
  const { slot, spellSlot } = parseSpellSlotKey(slotKey)
  if (slot === 'helmet' && spellSlot === 'q') return 'D'
  return {
    q: 'Q',
    w: 'W',
    e: 'E',
    passive: 'Passif',
  }[spellSlot] ?? slotKey
}

function spellShortLabel(slotKey: string) {
  const label = spellSlotLabel(slotKey)
  return label === 'Passif' ? 'P' : label
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

function showItemTooltip(event: MouseEvent, row: SpellRow) {
  moveTooltip(event)
  tooltip.title = row.name
  tooltip.badge = row.tierLabel
  tooltip.lines = [row.slot.label, `${row.spells.length} sort${row.spells.length > 1 ? 's' : ''} sélectionné${row.spells.length > 1 ? 's' : ''}`]
  tooltip.visible = true
}

async function showSpellTooltip(event: MouseEvent, row: SpellRow, buildSpell: BuildDetail['spells'][number]) {
  moveTooltip(event)
  tooltip.key = `spell:${buildSpell.spell.id}`

  applySpellTooltip(row, buildSpell.slotKey, buildSpell.spell)
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
    applySpellTooltip(row, buildSpell.slotKey, spellDetails[buildSpell.spell.id] ?? buildSpell.spell)
  }
}

function displaySpellName(buildSpell: BuildDetail['spells'][number]) {
  return spellDetails[buildSpell.spell.id]?.name
    ?? spellNames.value?.[buildSpell.spell.id]?.name
    ?? buildSpell.spell.name
}

function applySpellTooltip(
  row: SpellRow,
  slotKey: string,
  spell: SpellDetail | BuildDetail['spells'][number]['spell'],
) {
  const lines = [`${row.name} · ${spellSlotLabel(slotKey)}`]
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

/* Equipment */
.spell-lines {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.spell-line {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.spell-line:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.spell-line-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 360px;
  min-width: 360px;
}

.spell-line-item-icon {
  width: 92px;
  height: 92px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-1);
  overflow: hidden;
  flex-shrink: 0;
}

.spell-line-item-meta {
  min-width: 0;
}

.spell-line-item-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.spell-line-item-name {
  font-size: 22px;
  color: var(--text-1);
  line-height: 1.35;
}

.spell-line-item-label {
  display: block;
  font-size: 18px;
  color: var(--text-4);
  line-height: 1.3;
}

.spell-line-spells {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.spell-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 64px;
  max-width: 80px;
  text-align: center;
}

.spell-cell-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.spell-cell-icon img { width: 100%; height: 100%; object-fit: contain; }

.spell-fallback {
  display: none;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-3);
}

.spell-key-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--gold);
  background: rgba(201,161,74,0.1);
  border: 1px solid rgba(201,161,74,0.2);
  border-radius: 3px;
  padding: 1px 6px;
}

.spell-cell-name {
  font-size: 10px;
  color: var(--text-2);
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.spell-cell-cd {
  font-size: 10px;
  color: var(--text-4);
  font-family: var(--font-mono);
}

.build-hover-tooltip {
  position: fixed;
  z-index: 50;
  pointer-events: none;
  min-width: 200px;
  max-width: 280px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(201,161,74,0.24);
  background:
    linear-gradient(180deg, rgba(29,24,20,0.98), rgba(17,14,12,0.98));
  box-shadow:
    0 18px 40px rgba(0,0,0,0.4),
    0 0 0 1px rgba(255,255,255,0.03) inset;
}

.build-hover-tooltip-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
  line-height: 1.35;
}

.build-hover-tooltip-badge {
  display: inline-flex;
  align-items: center;
  margin-top: 6px;
  margin-bottom: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: var(--gold);
  background: rgba(201,161,74,0.1);
  border: 1px solid rgba(201,161,74,0.2);
}

.build-hover-tooltip-line {
  font-size: 11px;
  line-height: 1.45;
  color: var(--text-3);
  white-space: pre-line;
}

@media (max-width: 640px) {
  .spell-line {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
  .spell-line-item {
    width: 100%;
    min-width: 0;
  }
  .spell-line-item-icon {
    width: 72px;
    height: 72px;
  }
  .spell-line-item-name {
    font-size: 18px;
  }
  .spell-line-item-label {
    font-size: 14px;
  }
  .spell-line-spells {
    width: 100%;
  }
}
</style>
