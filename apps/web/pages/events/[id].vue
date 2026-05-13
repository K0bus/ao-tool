<template>
  <div class="page">
    <template v-if="event">
      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        class="slot-tooltip"
        :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
      >
        <div class="slot-tooltip-title">{{ tooltip.title }}</div>
        <div v-if="tooltip.badge" class="slot-tooltip-badge">{{ tooltip.badge }}</div>
        <div v-for="line in tooltip.lines" :key="line" class="slot-tooltip-line">{{ line }}</div>
      </div>

      <div class="page-header">
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink>
          <span>·</span>
          <NuxtLink to="/killboard">Killboard</NuxtLink>
          <span>·</span>
          <span>Kill #{{ event.EventId }}</span>
        </div>
        <div class="event-meta-row">
          <span class="t-dim" style="font-size:13px">{{ fullDate(event.TimeStamp) }}</span>
          <span v-if="event.Location" class="t-dim" style="font-size:13px">· {{ event.Location }}</span>
          <span v-if="(event.numberOfParticipants ?? 0) > 2" class="t-dim" style="font-size:13px">
            · {{ event.numberOfParticipants }} participants
          </span>
        </div>
      </div>

      <!-- Comparaison côte à côte -->
      <div class="kill-vs">

        <!-- Gagnant (Killer) -->
        <div class="vs-side winner">
          <div class="vs-player-header">
            <div class="vs-avatar winner-avatar">
              {{ event.Killer.Name[0]?.toUpperCase() }}
            </div>
            <div class="vs-player-info">
              <NuxtLink :to="`/players/${event.Killer.Id}`" class="vs-name t-success">
                {{ event.Killer.Name }}
              </NuxtLink>
              <NuxtLink v-if="event.Killer.GuildId" :to="`/guilds/${event.Killer.GuildId}`" class="vs-guild t-dim">
                {{ event.Killer.GuildName }}
              </NuxtLink>
              <NuxtLink v-if="event.Killer.AllianceId" :to="`/alliances/${event.Killer.AllianceId}`" class="vs-alliance t-dim">
                [{{ event.Killer.AllianceName }}]
              </NuxtLink>
            </div>
            <div class="vs-ip">
              <span class="ip-label t-eyebrow">IP</span>
              <span class="ip-value t-mono">{{ event.Killer.AverageItemPower.toFixed(0) }}</span>
            </div>
          </div>

          <div class="vs-equipment">
            <div
              v-for="slot in killerSlots"
              :key="slot.key"
              class="eq-row"
              :class="slot.qualityClass"
              @mouseenter="showTooltip($event, slot)"
              @mousemove="moveTooltip"
              @mouseleave="hideTooltip"
            >
              <div class="eq-row-icon">
                <AoItemImage
                  v-if="slot.type"
                  :unique-name="slot.type"
                  :display-name="slot.displayName"
                  :alt="slot.displayName || slot.type"
                />
                <span v-else class="eq-row-empty">·</span>
              </div>
              <div class="eq-row-info">
                <span class="eq-row-slot t-eyebrow">{{ slot.label }}</span>
                <span v-if="slot.type" class="eq-row-name">{{ slot.displayName }}</span>
                <span v-else class="eq-row-none t-dim">—</span>
              </div>
              <div v-if="slot.type" class="eq-row-right">
                <span class="eq-row-ip t-gold t-mono">{{ slot.ip }} IP</span>
                <span class="eq-row-quality" :style="{ color: slot.qualityColor }">{{ slot.qualityLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Séparateur central -->
        <div class="vs-center">
          <div class="vs-badge">
            <img src="/images/icons/icon_versus.png" alt="VS" class="vs-icon" />
          </div>
          <div class="vs-fame">
            <span class="fame-label t-eyebrow">Kill Fame</span>
            <span class="fame-value t-gold t-mono">{{ formatFame(event.TotalVictimKillFame) }}</span>
          </div>
          <div v-if="assists.length" class="vs-assists">
            <span class="assists-label t-eyebrow">Assistants</span>
            <NuxtLink v-for="a in assists" :key="a.Id" :to="`/players/${a.Id}`" class="assist-name t-dim">
              {{ a.Name }}
            </NuxtLink>
          </div>
        </div>

        <!-- Perdant (Victim) -->
        <div class="vs-side loser">
          <div class="vs-player-header loser-header">
            <div class="vs-ip">
              <span class="ip-label t-eyebrow">IP</span>
              <span class="ip-value t-mono">{{ event.Victim.AverageItemPower.toFixed(0) }}</span>
            </div>
            <div class="vs-player-info loser-info">
              <NuxtLink :to="`/players/${event.Victim.Id}`" class="vs-name t-danger">
                {{ event.Victim.Name }}
              </NuxtLink>
              <NuxtLink v-if="event.Victim.GuildId" :to="`/guilds/${event.Victim.GuildId}`" class="vs-guild t-dim">
                {{ event.Victim.GuildName }}
              </NuxtLink>
              <NuxtLink v-if="event.Victim.AllianceId" :to="`/alliances/${event.Victim.AllianceId}`" class="vs-alliance t-dim">
                [{{ event.Victim.AllianceName }}]
              </NuxtLink>
            </div>
            <div class="vs-avatar loser-avatar">
              {{ event.Victim.Name[0]?.toUpperCase() }}
            </div>
          </div>

          <div class="vs-equipment loser-eq">
            <div
              v-for="slot in victimSlots"
              :key="slot.key"
              class="eq-row eq-row--reversed"
              :class="slot.qualityClass"
              @mouseenter="showTooltip($event, slot)"
              @mousemove="moveTooltip"
              @mouseleave="hideTooltip"
            >
              <div v-if="slot.type" class="eq-row-right eq-row-right--left">
                <span class="eq-row-ip t-gold t-mono">{{ slot.ip }} IP</span>
                <span class="eq-row-quality" :style="{ color: slot.qualityColor }">{{ slot.qualityLabel }}</span>
              </div>
              <div class="eq-row-info loser-info-cell">
                <span class="eq-row-slot t-eyebrow">{{ slot.label }}</span>
                <span v-if="slot.type" class="eq-row-name">{{ slot.displayName }}</span>
                <span v-else class="eq-row-none t-dim">—</span>
              </div>
              <div class="eq-row-icon">
                <AoItemImage
                  v-if="slot.type"
                  :unique-name="slot.type"
                  :display-name="slot.displayName"
                  :alt="slot.displayName || slot.type"
                />
                <span v-else class="eq-row-empty">·</span>
              </div>
            </div>
          </div>

          <!-- Inventaire perdu (sous la victime) -->
          <div v-if="victimInventory.length" class="loser-inventory panel parchment framed">
            <div class="panel-header">
              <h3>Inventaire perdu</h3>
              <span class="t-dim t-mono" style="font-size: 11px">{{ victimInventory.length }} items</span>
            </div>
            <div class="panel-body inv-grid">
              <div
                v-for="item in victimInventory"
                :key="item.id"
                class="inv-item"
                :class="item.qualityClass"
                @mouseenter="showTooltip($event, item)"
                @mousemove="moveTooltip"
                @mouseleave="hideTooltip"
              >
                <div class="inv-img-wrap">
                  <AoItemImage :unique-name="item.type" :alt="item.displayName" />
                  <span v-if="item.count > 1" class="inv-count">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="status === 'error'" class="page-error">
      <h2>Évènement introuvable</h2>
      <p class="t-dim">Cet évènement n'existe pas ou n'est plus disponible.</p>
      <NuxtLink to="/killboard" class="ds-btn" style="margin-top:16px">← Killboard</NuxtLink>
    </div>

    <div v-else class="page-loading t-dim">Chargement…</div>
  </div>
</template>

<script setup lang="ts">
import type { KillEvent, KillEventEquipment } from '@albion-tool/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const { data, status } = useAsyncData(
  () => `pvp-event-${id.value}`,
  async () => {
    const event = await $fetch<{ data: KillEvent }>(`/api/v1/pvp/events/${id.value}`).then(r => r.data)
    const types = new Set<string>()
    for (const side of [event.Killer, event.Victim]) {
      for (const item of Object.values(side.Equipment)) {
        if (item?.Type) types.add(item.Type)
      }
    }
    const inventoryItems: { uniqueName: string; quality: number }[] = []
    if (event.Victim.Inventory) {
      for (const item of event.Victim.Inventory) {
        if (item?.Type) {
          types.add(item.Type)
          inventoryItems.push({ uniqueName: item.Type, quality: item.Quality })
        }
      }
    }
    const typeList = [...types]
    let names: Record<string, string> = {}
    if (typeList.length) {
      const res = await $fetch<{ data: Record<string, string> }>('/api/v1/pvp/items/names', {
        method: 'POST',
        body: { ids: typeList },
      })
      names = res.data
    }

    return { event, names }
  },
  { watch: [id] }
)

const event = computed(() => data.value?.event ?? null)
const itemNamesMap = computed(() => data.value?.names ?? {})

useHead(() => ({
  title: event.value ? `Kill #${event.value.EventId} — Albion Tool` : 'Kill Event — Albion Tool',
}))

const SLOT_LABELS: Record<keyof KillEventEquipment, string> = {
  MainHand: 'Arme', OffHand: 'Secondaire', Head: 'Casque', Armor: 'Armure',
  Shoes: 'Bottes', Bag: 'Sac', Cape: 'Cape', Mount: 'Monture', Potion: 'Potion', Food: 'Nourriture',
}
const QUALITY_LABELS = ['', 'Normal', 'Good', 'Outstanding', 'Excellent', 'Masterpiece']
const QUALITY_COLORS_CSS = ['', 'var(--q-normal)', 'var(--q-good)', 'var(--q-outstanding)', 'var(--q-excellent)', 'var(--q-masterpiece)']
const QUALITY_CLASSES = ['', '', 'q-good', 'q-outstanding', 'q-excellent', 'q-masterpiece']
const SLOT_ORDER = ['MainHand', 'OffHand', 'Head', 'Armor', 'Shoes', 'Bag', 'Cape', 'Mount', 'Potion', 'Food'] as const

function buildSlots(equipment: KillEventEquipment) {
  const names = itemNamesMap.value
  return SLOT_ORDER.map((key) => {
    const item = equipment[key]
    if (!item?.Type) {
      return { key, label: SLOT_LABELS[key], type: null as string | null, displayName: '', tierLabel: '', ip: 0, qualityClass: '', qualityLabel: '', qualityColor: '', tier: 0, enchantmentLevel: 0, quality: 0 }
    }
    const type = item.Type
    const t = itemTier(type)
    const e = itemEnchant(type)
    const tierLabel = e > 0 ? `T${t}.${e}` : `T${t}`
    const baseName = names[type] ?? ''
    return {
      key,
      label: SLOT_LABELS[key],
      type,
      displayName: baseName ? `${baseName} ${tierLabel}` : tierLabel,
      tierLabel,
      ip: calcItemPower(type, item.Quality),
      qualityClass: QUALITY_CLASSES[item.Quality] ?? '',
      qualityLabel: QUALITY_LABELS[item.Quality] ?? '',
      qualityColor: QUALITY_COLORS_CSS[item.Quality] ?? '',
      tier: t,
      enchantmentLevel: e,
      quality: item.Quality,
      name: baseName || type
    }
  })
}

const killerSlots = computed(() => event.value ? buildSlots(event.value.Killer.Equipment) : [])
const victimSlots = computed(() => event.value ? buildSlots(event.value.Victim.Equipment) : [])

const victimInventory = computed(() => {
  if (!event.value?.Victim.Inventory) return []
  const names = itemNamesMap.value
  return event.value.Victim.Inventory
    .filter(item => !!item && !!item.Type)
    .map((item, idx) => {
      const type = item.Type
      const t = itemTier(type)
      const e = itemEnchant(type)
      const tierLabel = e > 0 ? `T${t}.${e}` : `T${t}`
      const baseName = names[type] ?? ''
      return {
        id: `${type}-${idx}`,
        type,
        count: item.Count,
        displayName: baseName ? `${baseName} ${tierLabel}` : tierLabel,
        qualityClass: QUALITY_CLASSES[item.Quality] ?? '',
        tier: t,
        enchantmentLevel: e,
        quality: item.Quality,
        name: baseName || type
      }
    })
})

// Tooltip logic
const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  badge: '',
  lines: [] as string[]
})

function moveTooltip(event: MouseEvent) {
  tooltip.x = event.clientX + 14
  tooltip.y = event.clientY + 18
}

function hideTooltip() {
  tooltip.visible = false
}

function showTooltip(event: MouseEvent, item: any) {
  if (!item.type) return
  moveTooltip(event)
  tooltip.title = item.name
  tooltip.badge = `T${item.tier}${item.enchantmentLevel > 0 ? `.${item.enchantmentLevel}` : ''}`
  tooltip.lines = [
    `Qualité: ${QUALITY_LABELS[item.quality] || 'Normale'}`,
  ]
  if (item.ip) {
    tooltip.lines.push(`Puissance d'objet: ~${item.ip} IP`)
  }
  if (item.count > 1) {
    tooltip.lines.push(`Quantité: ${item.count}`)
  }
  tooltip.visible = true
}

// Les assistants = participants hors killer et victim
const assists = computed(() => {
  if (!event.value) return []
  const killerId = event.value.Killer.Id
  const victimId = event.value.Victim.Id
  return (event.value.Participants ?? []).filter(
    p => p.Id !== killerId && p.Id !== victimId
  )
})

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

</script>

<style scoped>
.event-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

/* ── Layout VS ─────────────────────────────────────────── */
.kill-vs {
  display: grid;
  grid-template-columns: 1fr 120px 1fr;
  gap: 0;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}

/* ── Colonne joueur ───────────────────────────────────── */
.vs-side { display: flex; flex-direction: column; }

.vs-player-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border-divider);
  background: var(--bg-3);
}
.loser-header { flex-direction: row-reverse; }

.vs-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}
.winner-avatar { background: rgba(125,154,74,0.2); color: var(--success); border: 1px solid rgba(125,154,74,0.4); }
.loser-avatar  { background: rgba(176,74,50,0.2);  color: var(--danger);  border: 1px solid rgba(176,74,50,0.4); }

.vs-player-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.loser-info { align-items: flex-end; }

.vs-name {
  font-size: 16px;
  font-weight: 700;
  font-family: var(--font-display);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vs-name:hover { text-decoration: underline; }

.vs-guild, .vs-alliance { font-size: 12px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vs-guild:hover, .vs-alliance:hover { color: var(--text-1); }

.vs-ip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
  background: rgba(201,161,74,0.08);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  padding: 6px 10px;
}
.ip-label { font-size: 9px; color: var(--text-4); }
.ip-value { font-size: 16px; font-weight: 700; color: var(--gold); line-height: 1; }

/* ── Lignes équipement ────────────────────────────────── */
.vs-equipment { display: flex; flex-direction: column; flex: 1; }

.eq-row {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 9px 16px 9px 12px;
  border-bottom: 1px solid var(--border-divider);
  border-left: 2px solid transparent;
  transition: background 0.1s;
}
.eq-row:last-child { border-bottom: none; }
.eq-row:hover { background: var(--bg-3); }

.eq-row--reversed {
  grid-template-columns: auto 1fr 44px;
  padding: 9px 12px 9px 16px;
  border-left: none;
  border-right: 2px solid transparent;
}

.eq-row.q-good       { border-color: var(--q-good); }
.eq-row.q-outstanding { border-color: var(--q-outstanding); }
.eq-row.q-excellent  { border-color: var(--q-excellent); }
.eq-row.q-masterpiece { border-color: var(--q-masterpiece); }

.eq-row-icon {
  width: 44px; height: 44px;
  background: var(--bg-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.eq-row-icon img { width: 100%; height: 100%; object-fit: cover; }
.eq-row-empty { font-size: 16px; color: var(--text-4); opacity: 0.25; }

.eq-row-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.loser-info-cell { align-items: flex-end; }

.eq-row-slot { font-size: 9px; color: var(--text-4); text-transform: uppercase; letter-spacing: 0.06em; }
.eq-row-name { font-size: 12px; font-weight: 600; color: var(--text-0); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.eq-row-none { font-size: 12px; }

.eq-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.eq-row-right--left { align-items: flex-start; }

.eq-row-ip { font-size: 12px; font-weight: 700; }
.eq-row-quality { font-size: 9px; font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.05em; }

/* ── Centre VS ────────────────────────────────────────── */
.vs-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px 0;
  gap: 12px;
  background: var(--bg-2);
  border-left: 1px solid var(--border-divider);
  border-right: 1px solid var(--border-divider);
  position: relative;
  z-index: 5;
  overflow: visible;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.4);
}

.vs-fame { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.fame-label { font-size: 9px; color: var(--text-4); }
.fame-value { font-size: 14px; font-weight: 700; text-align: center; }

.vs-badge { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  position: relative;
  width: 120px;
  height: 100px;
  z-index: 10;
  margin-top: -5px;
  overflow: visible;
}
.vs-icon { 
  width: 240px; 
  height: 160px; 
  max-width: none;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  object-fit: contain; 
  filter: drop-shadow(0 6px 20px rgba(0,0,0,0.7));
  pointer-events: none;
}

.vs-assists { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; }
.assists-label { font-size: 9px; color: var(--text-4); }
.assist-name { font-size: 11px; text-decoration: none; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
.assist-name:hover { color: var(--text-1); }

/* ── Tooltip ─────────────────────────────────────────── */
.slot-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  background: rgba(11, 10, 8, 0.95);
  border: 1px solid var(--gold-deep);
  border-radius: 4px;
  padding: 10px 14px;
  min-width: 180px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.slot-tooltip-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 4px;
}

.slot-tooltip-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  background: var(--gold-deep);
  color: #000;
  padding: 1px 6px;
  border-radius: 2px;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.slot-tooltip-line {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 2px;
}

/* ── Inventory ────────────────────────────────────────── */
.loser-inventory {
  margin-top: 16px;
  border-right: none;
  border-left: 2px solid var(--danger-deep);
}

.inv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 52px);
  gap: 8px;
  padding: 12px;
  justify-content: center;
}

.inv-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  width: 52px;
  height: 52px;
  cursor: help;
}

.inv-img-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  flex-shrink: 0;
  background: var(--bg-1);
  border-radius: 3px;
  overflow: hidden;
}

.inv-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inv-count {
  position: absolute;
  bottom: 0;
  right: 1px;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  pointer-events: none;
}

.inv-meta {
  min-width: 0;
  overflow: hidden;
}

.inv-name {
  display: block;
  font-size: 11px;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Quality overrides for inventory items */
.inv-item.q-good        { border-color: var(--q-good); }
.inv-item.q-outstanding { border-color: var(--q-outstanding); }
.inv-item.q-excellent   { border-color: var(--q-excellent); }
.inv-item.q-masterpiece { border-color: var(--q-masterpiece); }

/* ── Error / loading ──────────────────────────────────── */
.page-error, .page-loading { padding: 48px 0; text-align: center; }
.page-error h2 { font-family: var(--font-display); color: var(--text-0); margin-bottom: 8px; }

@media (max-width: 900px) {
  .kill-vs { grid-template-columns: 1fr; }
  .vs-center { flex-direction: row; justify-content: center; border: none; border-top: 1px solid var(--border-divider); border-bottom: 1px solid var(--border-divider); padding: 12px 16px; }
  .loser-header { flex-direction: row; }
  .loser-info { align-items: flex-start; }
  .eq-row--reversed { grid-template-columns: 44px 1fr auto; padding: 9px 16px 9px 12px; border-left: 2px solid transparent; border-right: none; }
  .eq-row-right--left { align-items: flex-end; }
  .loser-info-cell { align-items: flex-start; }
}
</style>
