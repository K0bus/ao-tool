<template>
  <div class="page tools-page">
    <!-- Standard Page Header (identical to items / profit pages) -->
    <div class="page-header">
      <div>
        <div class="breadcrumb">
          <NuxtLink to="/">Accueil</NuxtLink>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <span>Outils</span>
        </div>
        <h1 class="page-title">Simulateurs & Outils</h1>
        <p class="page-sub">Optimisez votre économie sur Albion Online avec nos calculateurs et simulateurs exclusifs.</p>
      </div>
    </div>

    <!-- Tools Grid Wrapper -->
    <div class="tools-grid-container" style="margin-top: 24px">
      <div class="tools-grid">
        <!-- Dungeon Payout Card -->
        <NuxtLink to="/tools/dungeon-payout" class="tool-card">
          <div class="card-head">
            <div class="tool-icon bg-yellow">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span class="tool-badge badge-yellow">Groupe & Payout</span>
          </div>
          <div class="card-content">
            <h3 class="tool-name">Calculateur de Payout de Donjon</h3>
            <p class="tool-desc">Répartissez équitablement le butin d'un donjon. Déduisez ou compensez automatiquement les sacs d'argent récupérés individuellement.</p>
          </div>
          <div class="card-footer">
            <span>Lancer l'outil</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </NuxtLink>

        <!-- Crafting Tree Card -->
        <NuxtLink to="/crafting" class="tool-card">
          <div class="card-head">
            <div class="tool-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <span class="tool-badge">Production & Craft</span>
          </div>
          <div class="card-content">
            <h3 class="tool-name">Arbre de Craft</h3>
            <p class="tool-desc">Visualisez la cascade complète de fabrication des items. Suivez les dépendances de ressources brutes et raffinées pour vos recettes.</p>
          </div>
          <div class="card-footer">
            <span>Lancer l'outil</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </NuxtLink>

        <!-- Profit Analysis Card -->
        <NuxtLink to="/items/profit" class="tool-card">
          <div class="card-head">
            <div class="tool-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2zm5-18v18" /></svg>
            </div>
            <span class="tool-badge">Commerce & Marge</span>
          </div>
          <div class="card-content">
            <h3 class="tool-name">Analyse de profit direct</h3>
            <p class="tool-desc">Suivez en temps réel les profits générés par l'artisanat. Repérez et triez les items par marge moyenne et meilleure ville de revente.</p>
          </div>
          <div class="card-footer">
            <span>Lancer l'outil</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </NuxtLink>

        <!-- Inter-city Flip Card -->
        <NuxtLink to="/items/flip" class="tool-card">
          <div class="card-head">
            <div class="tool-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </div>
            <span class="tool-badge">Arbitrage & Marché</span>
          </div>
          <div class="card-content">
            <h3 class="tool-name">Flip inter-cités</h3>
            <p class="tool-desc">Comparez les opportunités d'arbitrage de prix entre les cités d'Albion. Achetez bas à un endroit, transportez et vendez haut pour un profit maximum.</p>
          </div>
          <div class="card-footer">
            <span>Lancer l'outil</span>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Outils & Simulateurs - Albion SilverMind',
  description: 'Portail des outils d\'analyse et de simulation pour Albion Online. Calculateur de payout de donjon, simulateur de craft, flip inter-cités et calculs de profit en temps réel.',
})
</script>

<style scoped>
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}

.tool-card:hover {
  border-color: rgba(201, 161, 74, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: var(--bg-3);
  border: 1px solid var(--border-subtle);
  color: var(--text-2);
  transition: color 0.15s, background 0.15s;
}

.tool-card:hover .tool-icon {
  background: var(--bg-4);
  color: var(--text-0);
}

.tool-icon.bg-yellow {
  background: rgba(201, 161, 74, 0.08);
  border-color: rgba(201, 161, 74, 0.2);
  color: var(--gold);
}

.tool-card:hover .tool-icon.bg-yellow {
  background: rgba(201, 161, 74, 0.15);
  color: var(--gold);
}

.tool-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--bg-3);
  border: 1px solid var(--border-subtle);
  color: var(--text-3);
}

.tool-badge.badge-yellow {
  background: rgba(201, 161, 74, 0.05);
  border-color: rgba(201, 161, 74, 0.1);
  color: var(--gold);
}

.card-content {
  flex-grow: 1;
}

.tool-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-0);
  margin: 0 0 8px 0;
  transition: color 0.15s;
}

.tool-card:hover .tool-name {
  color: var(--gold);
}

.tool-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-3);
  margin: 0;
}

.card-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  margin-top: 20px;
  transition: color 0.15s;
}

.tool-card:hover .card-footer {
  color: var(--gold);
}

.card-footer svg {
  transition: transform 0.15s;
}

.tool-card:hover .card-footer svg {
  transform: translateX(2px);
}
</style>
