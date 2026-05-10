<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Builds
        </div>
        <h1>Builds publics</h1>
        <p class="t-muted" style="margin-top:6px">Découvrez les setups de la communauté</p>
      </div>
      <NuxtLink to="/builds/create" class="ds-btn primary">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Créer un build
      </NuxtLink>
    </div>

    <!-- Filtres game mode -->
    <div class="builds-filters">
      <div class="filter-pillbox">
        <span class="fpl">Mode</span>
        <button
          v-for="mode in GAME_MODES"
          :key="mode"
          class="filter-pill"
          :class="{ active: activeMode === mode }"
          @click="setMode(mode)"
        >{{ mode }}</button>
        <button v-if="activeMode" class="filter-pill" style="color:var(--text-3)" @click="setMode(null)">✕ Tous</button>
      </div>
    </div>

    <!-- Grille -->
    <div v-if="pending" class="builds-grid">
      <div v-for="i in 12" :key="i" class="skel" style="height:160px;border-radius:var(--radius-lg)" />
    </div>

    <div v-else-if="builds.length === 0" class="panel empty-state">
      <div class="es-icon">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
      </div>
      <p style="font-size:15px;color:var(--text-1)">Aucun build pour ce mode</p>
      <p class="t-muted" style="font-size:13px">Soyez le premier à partager votre setup</p>
      <NuxtLink to="/builds/create" class="ds-btn primary" style="margin-top:12px">Créer le premier →</NuxtLink>
    </div>

    <div v-else class="builds-grid">
      <BuildCard v-for="build in builds" :key="build.shareCode" :build="build" />
    </div>

    <div v-if="nextCursor" style="margin-top:24px;text-align:center">
      <button class="ds-btn" :disabled="loadingMore" @click="loadMore">
        {{ loadingMore ? 'Chargement…' : 'Charger plus' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const GAME_MODES = ['Solo PvP', 'ZvZ', 'Ganking', 'HCE', 'Corrupted', 'Gathering']

const route = useRoute()
const router = useRouter()
const activeMode = ref<string | null>((route.query.gameMode as string) || null)

interface Build {
  shareCode: string
  title: string
  gameMode?: string | null
  visibility: string
  equipment: Record<string, string | null>
  viewCount: number
  createdAt: string
}

const builds = ref<Build[]>([])
const nextCursor = ref<string | undefined>()
const loadingMore = ref(false)

const { data, pending, refresh } = await useFetch('/api/v1/builds', {
  query: computed(() => ({
    limit: 24,
    ...(activeMode.value ? { gameMode: activeMode.value } : {}),
  })),
  default: () => ({ data: [], meta: {} }),
})

watchEffect(() => {
  const d = data.value as { data?: Build[]; meta?: { nextCursor?: string } } | null
  builds.value = d?.data ?? []
  nextCursor.value = d?.meta?.nextCursor
})

function setMode(mode: string | null) {
  activeMode.value = mode
  router.replace({ query: mode ? { gameMode: mode } : {} })
  refresh()
}

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const res = await $fetch<{ data: Build[]; meta: { nextCursor?: string } }>('/api/v1/builds', {
      query: {
        limit: 24,
        cursor: nextCursor.value,
        ...(activeMode.value ? { gameMode: activeMode.value } : {}),
      },
    })
    builds.value.push(...res.data)
    nextCursor.value = res.meta.nextCursor
  } finally {
    loadingMore.value = false
  }
}

useSeoMeta({ title: 'Builds — Albion Codex' })
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.builds-filters {
  margin-bottom: 20px;
}

.builds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.empty-state {
  padding: 64px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.es-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--bg-3);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  margin-bottom: 8px;
}
</style>
