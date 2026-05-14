<template>
  <NuxtLink :to="`/builds/b/${build.shareCode}`" class="build-card">
    <div class="bc-header">
      <span v-if="modeLabel" class="bc-mode">{{ modeLabel }}</span>
      <span class="bc-vis" :class="build.visibility.toLowerCase()">
        <svg v-if="build.visibility === 'PUBLIC'" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
        <svg v-else-if="build.visibility === 'UNLISTED'" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12a2 2 0 0 1 4 0"/><path d="M4 6c-1.3 1.3-2 3-2 6s3 7 10 7 10-3 10-7-1-5-2-6"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
        <svg v-else viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        {{ visLabel }}
      </span>
    </div>

    <h3 class="bc-title">{{ build.title }}</h3>

    <div v-if="secondaryMeta.length" class="bc-tags">
      <span v-for="tag in secondaryMeta" :key="tag" class="bc-tag">{{ tag }}</span>
    </div>

    <!-- Équipement — petites icônes -->
    <div class="bc-items">
      <template v-for="slot in itemSlots" :key="slot.key">
        <div v-if="equipment[slot.key]" class="bc-item-icon" :title="slot.label">
          <AoItemImage
            :unique-name="equipment[slot.key]!"
            :alt="slot.label"
          />
        </div>
        <div v-else class="bc-item-icon empty" :title="slot.label" />
      </template>
    </div>

    <div class="bc-footer">
      <div class="bc-meta-left">
        <span class="bc-views">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          {{ build.viewCount }}
        </span>
        <span v-if="build.user" class="bc-author">
          par {{ build.user.username }}
        </span>
      </div>
      <span class="bc-date">{{ relativeDate }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { buildTagLabel, type BuildContentType, type BuildGroupScale, type BuildPlaystyle, type BuildRole } from '@albion-tool/types'
import { EQUIPMENT_SLOTS } from '~/composables/useBuildCreator'
import { labelWeaponSubcategory } from '~/utils/buildTaxonomy'

const props = defineProps<{
  build: {
    shareCode: string
    title: string
    gameMode?: string | null
    visibility: string
    equipment: Record<string, string | null>
    primaryContentType?: BuildContentType | null
    roles: BuildRole[]
    groupScales: BuildGroupScale[]
    playstyles: BuildPlaystyle[]
    weaponSubcategory?: string | null
    viewCount: number
    createdAt: string
    user?: {
      username: string
    } | null
  }
}>()

const itemSlots = EQUIPMENT_SLOTS.slice(0, 8) // arme, armure, casque, etc. sans food/potion

const equipment = computed(() => props.build.equipment)
const primaryContentLabel = computed(() => buildTagLabel('contentType', props.build.primaryContentType))
const modeLabel = computed(() => primaryContentLabel.value ?? props.build.gameMode ?? null)
const secondaryMeta = computed(() => {
  const tags = [
    labelWeaponSubcategory(props.build.weaponSubcategory),
    props.build.roles[0] ? buildTagLabel('role', props.build.roles[0]) : null,
    props.build.groupScales[0] ? buildTagLabel('groupScale', props.build.groupScales[0]) : null,
  ].filter((value): value is string => Boolean(value))

  return tags.slice(0, 2)
})

const visLabel = computed(() => {
  const map: Record<string, string> = { PUBLIC: 'Public', UNLISTED: 'Non listé', PRIVATE: 'Privé' }
  return map[props.build.visibility] ?? props.build.visibility
})

const relativeDate = computed(() => {
  const d = new Date(props.build.createdAt)
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'À l\'instant'
  if (h < 24) return `il y a ${h}h`
  const days = Math.floor(h / 24)
  if (days < 30) return `il y a ${days}j`
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
})
</script>

<style scoped>
.build-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-decoration: none;
}
.build-card:hover {
  border-color: var(--border-strong);
  background: var(--bg-3);
}

.bc-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bc-mode {
  font-size: 11px;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold);
  background: rgba(201,161,74,0.1);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 1px 6px;
}

.bc-vis {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-3);
  margin-left: auto;
}
.bc-vis.public { color: var(--success); }
.bc-vis.unlisted { color: var(--warning); }

.bc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-0);
  line-height: 1.3;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bc-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bc-tag {
  font-size: 11px;
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 7px;
  background: var(--bg-1);
}

.bc-items {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.bc-item-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-1);
  overflow: hidden;
}
.bc-item-icon.empty {
  opacity: 0.2;
  border-style: dashed;
}
.bc-item-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.bc-meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bc-views {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-3);
}

.bc-author {
  font-size: 11px;
  color: var(--text-4);
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bc-date {
  font-size: 11px;
  color: var(--text-4);
}
</style>
