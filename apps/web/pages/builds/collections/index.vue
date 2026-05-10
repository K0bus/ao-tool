<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>
          <NuxtLink to="/builds">Builds</NuxtLink><span class="sep">/</span>
          Collections
        </div>
        <h1>Collections</h1>
        <p class="t-muted" style="margin-top:6px">Sélections thématiques de la communauté</p>
      </div>
    </div>

    <div v-if="pending" class="collections-grid">
      <div v-for="i in 8" :key="i" class="skel" style="height:120px;border-radius:var(--radius-lg)" />
    </div>

    <div v-else-if="collections.length === 0" class="panel empty-state" style="padding:64px;text-align:center">
      <p class="t-muted">Aucune collection publique pour l'instant.</p>
    </div>

    <div v-else class="collections-grid">
      <NuxtLink
        v-for="col in collections"
        :key="col.shareCode"
        :to="`/builds/collections/${col.shareCode}`"
        class="collection-card"
      >
        <div class="cc-header">
          <h3 class="cc-title">{{ col.title }}</h3>
          <span class="cc-count">{{ col.buildCount }} build{{ col.buildCount > 1 ? 's' : '' }}</span>
        </div>
        <div class="cc-footer">
          <span class="t-dim" style="font-size:11px">{{ col.viewCount }} vues · {{ formatDate(col.createdAt) }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Collection {
  shareCode: string
  title: string
  buildCount: number
  viewCount: number
  createdAt: string
}

const { data, pending } = await useFetch('/api/v1/builds/collections', {
  default: () => ({ data: [] }),
})

const collections = computed(() => (data.value as any)?.data ?? [] as Collection[])

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

useSeoMeta({ title: 'Collections de builds — Albion Codex' })
</script>

<style scoped>
.page-header { margin-bottom: 20px }
.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.collection-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
}
.collection-card:hover {
  border-color: var(--border-strong);
  background: var(--bg-3);
}

.cc-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.cc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-0);
  margin: 0;
  line-height: 1.3;
}
.cc-count {
  font-size: 11px;
  color: var(--gold);
  background: rgba(201,161,74,0.1);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 2px 7px;
  white-space: nowrap;
  flex-shrink: 0;
}
.cc-footer { margin-top: auto }
</style>
