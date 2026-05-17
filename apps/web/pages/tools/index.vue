<template>
  <div class="py-12 px-4 max-w-6xl mx-auto space-y-8">
    <!-- Header Hero Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-950 to-surface-900 border border-surface-800 p-8 md:p-10 shadow-2xl">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.06),transparent_50%)]" />
      <div class="relative z-10 max-w-2xl space-y-3">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider border border-yellow-500/20">
          ⚙️ Simulateurs & Outils
        </span>
        <h1 class="text-3xl md:text-4xl font-extrabold text-gray-100 tracking-tight">
          Codex <span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Outils & Calculateurs</span>
        </h1>
        <p class="text-sm text-gray-400 leading-relaxed">
          Optimisez votre rendement économique, planifiez vos sessions de groupe, comparez les prix du marché et maximisez vos marges d'artisanat grâce à nos outils spécialisés pour Albion Online.
        </p>
      </div>
    </div>

    <!-- Tools Grid Category -->
    <div class="space-y-4">
      <h2 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Tous les outils disponibles</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Dungeon Payout Calculator Card -->
        <NuxtLink 
          to="/tools/dungeon-payout" 
          class="group relative flex flex-col justify-between p-6 bg-surface-950/40 hover:bg-surface-900/40 border border-surface-800 hover:border-yellow-500/30 rounded-xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/5"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-yellow-500 uppercase tracking-wider bg-yellow-500/5 px-2 py-0.5 rounded border border-yellow-500/10">
                Groupe & Économie
              </span>
              <div class="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-base font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Calculateur de Payout de Donjon</h3>
              <p class="text-xs text-gray-400 leading-relaxed">
                Répartissez équitablement le butin d'une session de donjon. Déduisez ou compensez automatiquement les sacs d'argent récupérés individuellement, et gérez les joueurs exclus.
              </p>
            </div>
          </div>
          <div class="mt-6 flex items-center gap-1 text-[11px] font-bold text-yellow-500/90 group-hover:text-yellow-400">
            Lancer l'outil
            <svg class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Crafting Tree Card -->
        <NuxtLink 
          to="/crafting" 
          class="group relative flex flex-col justify-between p-6 bg-surface-950/40 hover:bg-surface-900/40 border border-surface-800 hover:border-yellow-500/30 rounded-xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/5"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-surface-800 px-2 py-0.5 rounded border border-surface-700">
                Production & Craft
              </span>
              <div class="p-2.5 bg-surface-800 border border-surface-700 rounded-lg text-gray-300 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-base font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Arbre de Craft vertical</h3>
              <p class="text-xs text-gray-400 leading-relaxed">
                Visualisez la cascade complète de fabrication des items. Suivez les dépendances de ressources brutes et raffinées pour vos listes de courses d'artisanat.
              </p>
            </div>
          </div>
          <div class="mt-6 flex items-center gap-1 text-[11px] font-bold text-yellow-500/90 group-hover:text-yellow-400">
            Lancer l'outil
            <svg class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Direct Profit Analysis Card -->
        <NuxtLink 
          to="/items/profit" 
          class="group relative flex flex-col justify-between p-6 bg-surface-950/40 hover:bg-surface-900/40 border border-surface-800 hover:border-yellow-500/30 rounded-xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/5"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-surface-800 px-2 py-0.5 rounded border border-surface-700">
                Commerce & Marge
              </span>
              <div class="p-2.5 bg-surface-800 border border-surface-700 rounded-lg text-gray-300 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm5-18v18" />
                </svg>
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-base font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Analyse de profit direct</h3>
              <p class="text-xs text-gray-400 leading-relaxed">
                Suivez en temps réel les profits générés par la revente directe ou l'artisanat. Triez les items par marge moyenne et repérez les meilleures opportunités.
              </p>
            </div>
          </div>
          <div class="mt-6 flex items-center gap-1 text-[11px] font-bold text-yellow-500/90 group-hover:text-yellow-400">
            Lancer l'outil
            <svg class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>

        <!-- Inter-city Flip Card -->
        <NuxtLink 
          to="/items/flip" 
          class="group relative flex flex-col justify-between p-6 bg-surface-950/40 hover:bg-surface-900/40 border border-surface-800 hover:border-yellow-500/30 rounded-xl transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-yellow-500/5"
        >
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-surface-800 px-2 py-0.5 rounded border border-surface-700">
                Arbitrage & Marché
              </span>
              <div class="p-2.5 bg-surface-800 border border-surface-700 rounded-lg text-gray-300 group-hover:scale-110 transition-transform duration-300">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
            <div class="space-y-2">
              <h3 class="text-base font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">Flip inter-cités</h3>
              <p class="text-xs text-gray-400 leading-relaxed">
                Comparez les opportunités d'arbitrage de prix entre les grandes cités d'Albion Online. Achetez bas à un endroit, transportez et vendez haut pour un profit maximum.
              </p>
            </div>
          </div>
          <div class="mt-6 flex items-center gap-1 text-[11px] font-bold text-yellow-500/90 group-hover:text-yellow-400">
            Lancer l'outil
            <svg class="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Simulateurs & Outils Économiques - Albion SilverMind',
  description: 'Portail des outils d\'analyse et de simulation pour Albion Online. Calculateur de payout de donjon, simulateur de craft, flip inter-cités et calculs de profit en temps réel.',
})
</script>
