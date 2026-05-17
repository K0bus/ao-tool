<template>
  <div class="page dungeon-payout-page">
    <!-- Standard Page Header -->
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span><NuxtLink to="/tools">Outils</NuxtLink><span class="sep">/</span>Calculateur de Payout
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
