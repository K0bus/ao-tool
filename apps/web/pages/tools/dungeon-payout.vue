<template>
  <div class="page dungeon-payout-page">
    <!-- Standard Page Header -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">
          <NuxtLink to="/">Accueil</NuxtLink>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <NuxtLink to="/tools">Outils</NuxtLink>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <span>Calculateur de Payout</span>
        </div>
        <h1 class="page-title">Calculateur de Payout de Donjon</h1>
        <p class="page-sub">Gérez et divisez équitablement le butin d'une session de donjon de groupe.</p>
      </div>
    </div>

    <!-- Dungeon Calculator Wrapper Component -->
    <div style="margin-top: 24px">
      <DungeonPayoutCalculator />
    </div>
  </div>
</template>

<script setup lang="ts">
import DungeonPayoutCalculator from '~/components/dungeon/DungeonPayoutCalculator.vue'

definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Calculateur de Payout de Donjon - Albion SilverMind',
  description: 'Outil de répartition de butin de donjon de groupe dans Albion Online. Divisez équitablement les loots et compensez les sacs d\'argent.',
})
</script>
