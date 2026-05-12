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
        <span class="fpl">Contenu</span>
        <button
          v-for="option in BUILD_CONTENT_TYPE_OPTIONS"
          :key="option.value"
          class="filter-pill"
          :class="{ active: activeContentType === option.value }"
          @click="setContentType(option.value)"
        >{{ option.label }}</button>
        <button v-if="activeContentType" class="filter-pill" style="color:var(--text-3)" @click="setContentType(null)">✕ Tous</button>
      </div>
      <div class="filter-pillbox">
        <span class="fpl">Arme</span>
        <select v-model="activeWeaponFamily" class="family-select">
          <option value="">Toutes les armes</option>
          <option v-for="family in weaponFamilies" :key="family.value" :value="family.value">{{ family.label }}</option>
        </select>
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
import { BUILD_CONTENT_TYPE_OPTIONS, type BuildContentType, type BuildGroupScale, type BuildPlaystyle, type BuildRole } from '@albion-tool/types'
import type { BuildTaxonomyResponse } from '~/utils/buildTaxonomy'

const route = useRoute()
const router = useRouter()
const activeContentType = ref<BuildContentType | null>((route.query.primaryContentType as BuildContentType) || null)
const activeWeaponFamily = ref<string>((route.query.weaponSubcategory as string) || '')

interface Build {
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
}

const { data: taxonomyData } = await useFetch<{ data: BuildTaxonomyResponse }>('/api/v1/build-taxonomy', {
  default: () => ({ data: { slots: { weapon: { families: [] } } as any } }),
})

const weaponFamilies = computed(() => taxonomyData.value?.data?.slots.weapon.families ?? [])

const builds = ref<Build[]>([])
const nextCursor = ref<string | undefined>()
const loadingMore = ref(false)

const { data, pending, refresh } = await useFetch('/api/v1/builds', {
  query: computed(() => ({
    limit: 24,
    ...(activeContentType.value ? { primaryContentType: activeContentType.value } : {}),
    ...(activeWeaponFamily.value ? { weaponSubcategory: activeWeaponFamily.value } : {}),
  })),
  default: () => ({ data: [], meta: {} }),
})

watchEffect(() => {
  const d = data.value as { data?: Build[]; meta?: { nextCursor?: string } } | null
  builds.value = d?.data ?? []
  nextCursor.value = d?.meta?.nextCursor
})

watch(activeWeaponFamily, () => {
  router.replace({
    query: {
      ...(activeContentType.value ? { primaryContentType: activeContentType.value } : {}),
      ...(activeWeaponFamily.value ? { weaponSubcategory: activeWeaponFamily.value } : {}),
    },
  })
  refresh()
})

function setContentType(contentType: BuildContentType | null) {
  activeContentType.value = contentType
  refresh()
  router.replace({
    query: {
      ...(contentType ? { primaryContentType: contentType } : {}),
      ...(activeWeaponFamily.value ? { weaponSubcategory: activeWeaponFamily.value } : {}),
    },
  })
}

async function loadMore() {
  if (!nextCursor.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const res = await $fetch<{ data: Build[]; meta: { nextCursor?: string } }>('/api/v1/builds', {
      query: {
        limit: 24,
        cursor: nextCursor.value,
        ...(activeContentType.value ? { primaryContentType: activeContentType.value } : {}),
        ...(activeWeaponFamily.value ? { weaponSubcategory: activeWeaponFamily.value } : {}),
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
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.family-select {
  min-width: 220px;
  background: var(--bg-1);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-0);
  padding: 8px 10px;
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
