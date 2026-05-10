<template>
  <NuxtLink :to="`/events/${event.EventId}`" class="kill-row">
    <span class="kr-time t-mono t-dim">{{ relativeTime(event.TimeStamp) }}</span>

    <div class="kr-actors">
      <div class="kr-side victim">
        <span class="kr-name t-danger">{{ event.Victim.Name }}</span>
        <span v-if="event.Victim.GuildName" class="kr-guild t-dim">{{ event.Victim.GuildName }}</span>
      </div>

      <span class="kr-arrow">→</span>

      <div class="kr-side killer">
        <span class="kr-name t-success">{{ event.Killer.Name }}</span>
        <span v-if="event.Killer.GuildName" class="kr-guild t-dim">{{ event.Killer.GuildName }}</span>
      </div>
    </div>

    <span class="kr-fame t-gold t-mono">{{ formatFame(event.TotalVictimKillFame) }}</span>

    <div class="kr-eq">
      <KillEventEquipmentGrid :equipment="event.Victim.Equipment" size="sm" />
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { KillEvent } from '@albion-tool/types'

defineProps<{ event: KillEvent }>()
</script>

<style scoped>
.kill-row {
  display: grid;
  grid-template-columns: 80px 1fr 72px auto;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-divider);
  text-decoration: none;
  transition: background 0.12s;
  cursor: pointer;
}
.kill-row:last-child { border-bottom: none; }
.kill-row:hover { background: var(--bg-3); }

.kr-time {
  font-size: 11px;
  white-space: nowrap;
}

.kr-actors {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.kr-side {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kr-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kr-guild {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.kr-arrow {
  color: var(--text-4);
  font-size: 13px;
  flex-shrink: 0;
}

.kr-fame {
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
}

.kr-eq { flex-shrink: 0; }
</style>
