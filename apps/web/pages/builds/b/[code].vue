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
            <span v-if="build.gameMode" class="build-mode-badge">{{ build.gameMode }}</span>
          </h1>
          <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
            <span class="t-muted" style="font-size:13px">
              {{ build.viewCount }} vues · {{ formatDate(build.createdAt) }}
            </span>
            <span class="vis-tag" :class="build.visibility.toLowerCase()">
              {{ visLabel(build.visibility) }}
            </span>
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
        <div class="panel">
          <div class="panel-header"><h3>Équipement</h3></div>
          <div class="panel-body">
          <div class="eq-grid">
            <div v-for="slot in EQUIPMENT_SLOTS" :key="slot.key" class="eq-cell">
              <NuxtLink v-if="equipment[slot.key]" :to="`/items/${equipment[slot.key]}`" class="eq-icon filled">
                <AoItemImage
                  :unique-name="equipment[slot.key]!"
                  :alt="slot.label"
                />
              </NuxtLink>
              <div v-else class="eq-icon empty" />
              <span class="eq-label">{{ slot.label }}</span>
            </div>
          </div>
          </div>
        </div>

        <!-- Spells sélectionnés -->
        <div v-if="build.spells.length > 0" class="panel">
          <div class="panel-header"><h3>Spells</h3></div>
          <div class="panel-body">
          <div class="spells-row">
            <div v-for="bs in build.spells" :key="bs.slotKey" class="spell-cell">
              <div class="spell-cell-icon">
                <img
                  v-if="bs.spell.icon"
                  :src="`https://render.albiononline.com/v1/spell/${bs.spell.icon}.png`"
                  :alt="bs.spell.name"
                  @error="(e) => { (e.target as HTMLImageElement).style.display = 'none' }"
                />
                <span v-else class="spell-fallback">{{ bs.slotKey }}</span>
              </div>
              <span class="spell-key-badge">{{ bs.slotKey }}</span>
              <span class="spell-cell-name">{{ bs.spell.name }}</span>
              <span v-if="bs.spell.cooldown" class="spell-cell-cd">{{ bs.spell.cooldown }}s</span>
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
    </template>

    <div v-else-if="error" class="panel empty-state" style="padding:64px;text-align:center">
      <p class="t-muted">Build introuvable ou accès refusé.</p>
      <NuxtLink to="/builds" class="ds-btn" style="margin-top:12px">← Retour aux builds</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EQUIPMENT_SLOTS } from '~/composables/useBuildCreator'

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
  spells: Array<{
    slotKey: string
    spell: { id: string; name: string; icon?: string | null; cooldown?: number | null; energyCost?: number | null }
  }>
  viewCount: number
  createdAt: string
}

const { data, error } = await useFetch<{ data: BuildDetail }>(`/api/v1/builds/${code}`)
const build = computed(() => data.value?.data ?? null)

const equipment = computed(() => build.value?.equipment ?? {})

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

.build-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Equipment grid */
.eq-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.eq-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.eq-icon {
  width: 72px;
  height: 72px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s;
}
.eq-icon.filled:hover {
  border-color: var(--border-strong);
}
.eq-icon.empty {
  border-style: dashed;
  border-color: var(--border-subtle);
  opacity: 0.35;
}
.eq-icon img { width: 100%; height: 100%; object-fit: cover; }

.eq-label {
  font-size: 10px;
  color: var(--text-3);
  text-align: center;
}

/* Spells */
.spells-row {
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

@media (max-width: 640px) {
  .eq-grid {
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .eq-icon {
    width: 56px;
    height: 56px;
  }
}
</style>
