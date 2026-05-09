<template>
  <div class="page home">
    <!-- Hero -->
    <section class="hero">
      <div class="t-eyebrow" style="text-align:center">❖ &nbsp;ALBION CODEX&nbsp; ❖</div>
      <h1 class="hero-title">La connaissance de l'Albion, à portée de main.</h1>
      <p class="hero-sub">Base de données complète, calculateur de craft, suivi de marché. Construit pour les artisans, marchands et aventuriers.</p>

      <!-- Search -->
      <form class="hero-search" @submit.prevent="goSearch">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold);flex-shrink:0"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          v-model="query"
          class="hero-search-input"
          type="text"
          placeholder="Rechercher un item, une ressource, une recette…"
          autocomplete="off"
        />
        <kbd style="font-family:var(--font-mono);font-size:11px;color:var(--gold);background:rgba(201,161,74,0.1);border:1px solid var(--gold-deep);padding:4px 10px;border-radius:4px">↵</kbd>
      </form>

      <!-- Trending chips -->
      <div class="hero-suggest">
        <span class="t-dim" style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;font-family:var(--font-display)">Tendances</span>
        <NuxtLink v-for="chip in trending" :key="chip.id" :to="`/items/${chip.id}`" class="trend-chip">
          <div class="tc-img">
            <img :src="`https://render.albiononline.com/v1/item/${chip.id}.png`" :alt="chip.label" loading="lazy" />
          </div>
          <span>{{ chip.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- Tools grid -->
    <section class="tools-grid">
      <NuxtLink v-for="tool in tools" :key="tool.route" :to="tool.route" class="tool-card">
        <div class="tc-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="tool.iconPaths" />
        </div>
        <div class="tc-body">
          <div class="tc-head">
            <h3>{{ tool.title }}</h3>
            <span v-if="tool.tag" class="tag gold">{{ tool.tag }}</span>
          </div>
          <p>{{ tool.desc }}</p>
          <div class="tc-cta">Ouvrir <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></div>
        </div>
      </NuxtLink>
    </section>

    <!-- Divider -->
    <div class="divider-orn">❖</div>

    <!-- Lower: featured + stats -->
    <section class="home-lower">
      <!-- Featured item (parchment panel) -->
      <div class="panel parchment framed" style="overflow:hidden">
        <div class="panel-header">
          <h3>Item à la une</h3>
          <span class="tag gold">Artefact · Avalonien</span>
        </div>
        <div class="panel-body featured-body">
          <div class="item-frame q-masterpiece featured-img">
            <img src="https://render.albiononline.com/v1/item/T8_2H_AXE_AVALON.png?quality=5" alt="Hache Avalonienne" />
            <span class="corner">T·VIII</span>
          </div>
          <div class="featured-meta">
            <span class="t-eyebrow">Hache · 2 mains</span>
            <h2 style="font-size:26px;margin:4px 0 4px">Hache du Seigneur des Royaumes</h2>
            <p class="t-muted" style="margin-bottom:12px">Une hache forgée dans l'acier des forêts perdues d'Avalon. Frappes lourdes, charges dévastatrices, requiert l'expertise des plus grands maîtres-armuriers.</p>
            <div class="featured-stats">
              <div v-for="stat in featuredStats" :key="stat.k" class="fst">
                <span class="fst-k">{{ stat.k }}</span>
                <span class="fst-v t-mono">{{ stat.v }}</span>
                <span v-if="stat.d" class="fst-d">{{ stat.d }}</span>
              </div>
            </div>
            <div class="row" style="margin-top:16px;gap:10px">
              <NuxtLink to="/items/T8_2H_AXE_AVALON" class="ds-btn primary">Voir détails <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></NuxtLink>
              <NuxtLink to="/crafting?id=T8_2H_AXE_AVALON" class="ds-btn">Crafting tree</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats panel -->
      <div class="panel">
        <div class="panel-header">
          <h3>État du codex</h3>
          <span class="status live">Synchronisé</span>
        </div>
        <div class="home-stats">
          <div v-for="s in codexStats" :key="s.k" class="home-stat">
            <div class="hs-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="s.iconPaths" />
            </div>
            <div class="hs-meta">
              <div class="hs-k">{{ s.k }}</div>
              <div class="hs-v t-mono">{{ s.v }}</div>
              <div class="hs-d">{{ s.d }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Activity feed -->
    <div class="panel home-activity" style="margin-top:16px">
      <div class="panel-header">
        <h3>Mises à jour récentes</h3>
        <NuxtLink to="/admin" class="ds-btn ghost sm">Tout voir <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg></NuxtLink>
      </div>
      <div style="padding:0">
        <div v-for="act in activity" :key="act.t" class="act-row">
          <span class="t-mono t-dim" style="font-size:11px">{{ act.t }}</span>
          <span :class="`tag ${act.tag}`" style="justify-content:center">{{ act.k }}</span>
          <span style="color:var(--text-1);font-size:13px">{{ act.v }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const router = useRouter()
const query = ref('')

function goSearch() {
  if (!query.value.trim()) return
  router.push({ path: '/items', query: { q: query.value.trim() } })
}

const trending = [
  { id: 'T8_2H_AXE_AVALON', label: 'Hache Avalonienne' },
  { id: 'T7_2H_BOW_KEEPER', label: 'Arc des Druides' },
  { id: 'T6_PLANKS', label: 'Planches T6' },
  { id: 'T7_MEAL_OMELETTE', label: 'Omelette T7' },
]

const tools = [
  {
    title: 'Crafting Tree',
    desc: 'Calculez le coût total et la marge de tous vos crafts.',
    route: '/crafting',
    tag: 'Outil phare',
    iconPaths: '<path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
  },
  {
    title: 'Marché en direct',
    desc: 'Prix par cité, historique et arbitrages détectés.',
    route: '/market',
    tag: 'Live',
    iconPaths: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/>',
  },
  {
    title: 'Base de données',
    desc: '12 480 items indexés, stats, traductions, sets.',
    route: '/items',
    tag: null,
    iconPaths: '<path d="M4 19.5V4a2 2 0 0 1 2-2h13v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2.5z"/><path d="M9 2v18"/>',
  },
  {
    title: 'Administration',
    desc: 'Suivez vos workers et l\'état de la base.',
    route: '/admin',
    tag: null,
    iconPaths: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  },
]

const featuredStats = [
  { k: 'Dégâts', v: '168', d: '+12 vs T7' },
  { k: 'Vitesse', v: '1.21 atk/s', d: null },
  { k: 'Charge', v: '21.4', d: null },
  { k: 'IP requis', v: '1 100', d: null },
]

const codexStats = [
  { k: 'Items indexés', v: '12 480', d: '+24 cette semaine', iconPaths: '<path d="M4 19.5V4a2 2 0 0 1 2-2h13v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2.5z"/><path d="M9 2v18"/>' },
  { k: 'Recettes connues', v: '3 187', d: '100% couvertes', iconPaths: '<path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>' },
  { k: 'Prix collectés / h', v: '184 320', d: '↑ 6.2%', iconPaths: '<circle cx="8" cy="8" r="6"/><path d="M18.1 9a6 6 0 0 1 0 9.8M16 18.5a6 6 0 0 1-7.2.8"/>' },
  { k: 'Workers actifs', v: '8 / 8', d: 'Tous OK', iconPaths: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
]

const activity = [
  { t: 'il y a 2 min', k: 'PRIX', v: '8 421 nouveaux prix synchronisés depuis Caerleon, Bridgewatch, Lymhurst.', tag: 'info' },
  { t: 'il y a 14 min', k: 'BASE', v: 'Patch 27 — 12 nouveaux items + 4 recettes mises à jour.', tag: 'gold' },
  { t: 'il y a 37 min', k: 'TRAD', v: 'Worker translation-fr a complété 320 entrées.', tag: 'success' },
  { t: 'il y a 2 h', k: 'ALERTE', v: 'Worker market-blackmarket a redémarré (timeout API).', tag: 'danger' },
]
</script>
