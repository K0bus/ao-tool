<template>
  <div class="page">
    <template v-if="event">
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
            <div v-for="slot in killerSlots" :key="slot.key" class="eq-row" :class="slot.qualityClass">
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
          <div class="vs-fame">
            <span class="fame-label t-eyebrow">Kill Fame</span>
            <span class="fame-value t-gold t-mono">{{ formatFame(event.TotalVictimKillFame) }}</span>
          </div>
          <div class="vs-badge">VS</div>
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
            <div v-for="slot in victimSlots" :key="slot.key" class="eq-row eq-row--reversed" :class="slot.qualityClass">
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
      return { key, label: SLOT_LABELS[key], type: null as string | null, displayName: '', tierLabel: '', ip: 0, qualityClass: '', qualityLabel: '', qualityColor: '' }
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
    }
  })
}

const killerSlots = computed(() => event.value ? buildSlots(event.value.Killer.Equipment) : [])
const victimSlots = computed(() => event.value ? buildSlots(event.value.Victim.Equipment) : [])

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
  overflow: hidden;
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
  padding: 20px 8px;
  gap: 12px;
  background: var(--bg-2);
  border-left: 1px solid var(--border-divider);
  border-right: 1px solid var(--border-divider);
}

.vs-fame { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.fame-label { font-size: 9px; color: var(--text-4); }
.fame-value { font-size: 14px; font-weight: 700; text-align: center; }

.vs-badge { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-4); letter-spacing: 0.1em; }

.vs-assists { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; }
.assists-label { font-size: 9px; color: var(--text-4); }
.assist-name { font-size: 11px; text-decoration: none; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100px; }
.assist-name:hover { color: var(--text-1); }

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
