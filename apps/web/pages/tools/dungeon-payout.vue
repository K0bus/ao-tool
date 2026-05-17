<template>
  <div class="py-10 px-4">
    <div class="max-w-5xl mx-auto mb-6">
      <NuxtLink 
        to="/" 
        class="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Retour à l'accueil
      </NuxtLink>
    </div>
    
    <DungeonPayoutCalculator />
  </div>
</template>

<script setup lang="ts">
import DungeonPayoutCalculator from '~/components/dungeon/DungeonPayoutCalculator.vue'

useSeoMeta({
  title: 'Calculateur de Payout de Donjon de Groupe - Albion SilverMind',
  description: 'Outil expert pour diviser équitablement le butin et redistribuer les gains en argent d\'un donjon de groupe dans Albion Online.',
})
</script>
