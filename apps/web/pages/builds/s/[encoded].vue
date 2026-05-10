<template>
  <div class="page">
    <template v-if="payload">
      <div class="page-header">
        <div>
          <div class="crumbs">
            <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>
            <NuxtLink to="/builds">Builds</NuxtLink><span class="sep">/</span>
            Partage rapide
          </div>
          <h1 style="display:flex;align-items:center;gap:10px">
            {{ payload.title }}
            <span v-if="payload.gameMode" class="build-mode-badge">{{ payload.gameMode }}</span>
          </h1>
          <p class="t-muted" style="font-size:12px;margin-top:6px">Build partagé sans compte · lecture seule</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="ds-btn" @click="copyLink">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            {{ copied ? 'Copié !' : 'Copier le lien' }}
          </button>
          <NuxtLink to="/builds/create" class="ds-btn primary">Créer le mien</NuxtLink>
        </div>
      </div>

      <div class="panel guest-notice">
        <p style="font-size:12px;color:var(--text-2)">
          Ce build a été partagé sans compte. Pour sauvegarder vos propres builds,
          <NuxtLink to="/auth/register" class="t-gold">créez un compte gratuitement</NuxtLink>.
        </p>
      </div>

      <!-- Équipement -->
      <div class="panel">
        <div class="panel-header"><h3>Équipement</h3></div>
        <div class="panel-body">
        <div class="eq-grid">
          <div v-for="slot in EQUIPMENT_SLOTS" :key="slot.key" class="eq-cell">
            <NuxtLink v-if="payload.equipment[slot.key]" :to="`/items/${payload.equipment[slot.key]}`" class="eq-icon filled">
              <img :src="`https://render.albiononline.com/v1/item/${payload.equipment[slot.key]}.png`" :alt="slot.label" loading="lazy" />
            </NuxtLink>
            <div v-else class="eq-icon empty" />
            <span class="eq-label">{{ slot.label }}</span>
          </div>
        </div>
        </div>
      </div>

      <!-- Spells -->
      <div v-if="payload.spells.length > 0" class="panel">
        <div class="panel-header"><h3>Spells</h3></div>
        <div class="panel-body">
        <div class="spells-row">
          <div v-for="s in payload.spells" :key="s.slot" class="spell-cell">
            <div class="spell-cell-icon">
              <span class="spell-fallback">{{ s.slot }}</span>
            </div>
            <span class="spell-key-badge">{{ s.slot }}</span>
            <span class="spell-cell-name">{{ s.id }}</span>
          </div>
        </div>
        </div>
      </div>
    </template>

    <div v-else class="panel empty-state" style="padding:64px;text-align:center">
      <p class="t-muted">Lien de partage invalide ou expiré.</p>
      <NuxtLink to="/builds" class="ds-btn" style="margin-top:12px">← Retour aux builds</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EQUIPMENT_SLOTS } from '~/composables/useBuildCreator'
import type { GuestBuildPayload } from '@albion-tool/types'

const route = useRoute()
const encoded = route.params.encoded as string

function decodeGuestBuild(enc: string): GuestBuildPayload | null {
  try {
    const base64 = enc.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64)
    const data = JSON.parse(json) as GuestBuildPayload
    return data.v === 1 ? data : null
  } catch {
    return null
  }
}

const payload = computed(() => decodeGuestBuild(encoded))

const copied = ref(false)
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

useSeoMeta({
  title: computed(() => payload.value ? `${payload.value.title} — Albion Codex` : 'Build partagé — Albion Codex'),
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

.guest-notice {
  margin-bottom: 12px;
  padding: 10px 14px;
  background: rgba(201,161,74,0.04);
  border-color: rgba(201,161,74,0.18);
}

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
  display: flex;
  align-items: center;
  justify-content: center;
}

.spell-fallback {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-3);
  font-family: var(--font-mono);
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
  font-family: var(--font-mono);
}
</style>
