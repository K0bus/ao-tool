<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>
          <NuxtLink to="/builds">Builds</NuxtLink><span class="sep">/</span>
          Mes builds
        </div>
        <h1>Mes builds</h1>
      </div>
      <NuxtLink to="/builds/create" class="ds-btn primary">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Nouveau build
      </NuxtLink>
    </div>

    <div v-if="!auth.isAuthenticated.value" class="panel empty-state" style="padding:64px;text-align:center">
      <p class="t-muted">Connectez-vous pour sauvegarder et retrouver vos builds.</p>
      <NuxtLink to="/auth/login" class="ds-btn primary" style="margin-top:12px">Se connecter</NuxtLink>
    </div>

    <template v-else>
      <div v-if="pending" class="builds-grid">
        <div v-for="i in 6" :key="i" class="skel" style="height:160px;border-radius:var(--radius-lg)" />
      </div>
      <div v-else-if="builds.length === 0" class="panel empty-state" style="padding:64px;text-align:center">
        <p class="t-muted">Vous n'avez pas encore de build sauvegardé.</p>
        <NuxtLink to="/builds/create" class="ds-btn primary" style="margin-top:12px">Créer mon premier build →</NuxtLink>
      </div>
      <div v-else class="builds-grid">
        <BuildCard v-for="build in builds" :key="build.shareCode" :build="build" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()

const { data, pending } = await useFetch('/api/v1/me/builds', {
  default: () => ({ data: [] }),
})

const builds = computed(() => (data.value as any)?.data ?? [])

useSeoMeta({ title: 'Mes builds — Albion Codex' })
</script>

<style scoped>
.page-header { display:flex;align-items:flex-start;justify-content:space-between;gap:16px }
.builds-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px }
.empty-state { display:flex;flex-direction:column;align-items:center;gap:8px }
</style>
