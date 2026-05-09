<template>
  <div class="page market-page">
    <div class="page-header">
      <div>
        <div class="crumbs"><NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Marché</div>
        <h1>Marché en direct</h1>
        <p class="t-muted" style="margin-top:6px">184 320 prix collectés sur la dernière heure · 7 cités surveillées</p>
      </div>
      <span class="status live">Live</span>
    </div>

    <!-- KPIs -->
    <div class="market-top">
      <div v-for="s in kpis" :key="s.k" class="panel mkt-stat">
        <div class="ms-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="s.iconPaths" />
        </div>
        <div class="ms-body">
          <div class="ms-k">{{ s.k }}</div>
          <div class="ms-v t-mono">{{ s.v }}</div>
          <div class="ms-d">{{ s.d }}</div>
        </div>
      </div>
    </div>

    <!-- Dual: arbitrage + heatmap -->
    <div class="market-dual">
      <!-- Arbitrage table -->
      <div class="panel">
        <div class="panel-header">
          <h3>Arbitrages · top 8</h3>
          <div class="row" style="gap:6px">
            <button v-for="f in ['Tous','T6+','T7+','T8']" :key="f" class="ds-btn sm" :class="{ primary: f === 'Tous' }">{{ f }}</button>
          </div>
        </div>
        <table class="ds-table">
          <thead>
            <tr>
              <th>Item</th><th>Achat</th><th>Vente</th><th>Marge</th><th>Volume</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in arbitrage" :key="r.id">
              <td>
                <NuxtLink :to="`/items/${r.id}`" style="display:flex;align-items:center;gap:10px">
                  <div class="item-frame" style="width:32px;height:32px;flex-shrink:0">
                    <img :src="`https://render.albiononline.com/v1/item/${r.id}.png`" :alt="r.name" loading="lazy" />
                  </div>
                  <div>
                    <div>{{ r.name }}</div>
                    <div class="t-dim t-mono" style="font-size:10px">{{ r.id }}</div>
                  </div>
                </NuxtLink>
              </td>
              <td>
                <div style="font-size:12px;color:var(--text-2)">{{ r.buyCity }}</div>
                <div class="num t-mono t-dim">{{ r.buy.toLocaleString('fr-FR') }}</div>
              </td>
              <td>
                <div style="font-size:12px;color:var(--text-2)">{{ r.sellCity }}</div>
                <div class="num t-mono">{{ r.sell.toLocaleString('fr-FR') }}</div>
              </td>
              <td class="num"><span class="t-gold t-mono">+{{ r.margin.toFixed(1) }}%</span></td>
              <td class="num t-mono t-muted">{{ r.vol }}/j</td>
              <td class="num"><NuxtLink :to="`/items/${r.id}`" class="ds-btn sm">Voir</NuxtLink></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- City heatmap -->
      <div class="panel">
        <div class="panel-header">
          <h3>Heatmap · prix relatifs</h3>
          <span class="t-dim" style="font-size:11px">vert = bas · or = haut</span>
        </div>
        <div style="padding:0 18px 18px;overflow-x:auto">
          <div class="heatmap-grid" :style="`grid-template-columns: 180px repeat(${cities.length}, 1fr)`">
            <div class="hm-corner"></div>
            <div v-for="c in cities" :key="c" class="hm-col">{{ c }}</div>
            <template v-for="row in heatmapData" :key="row.id">
              <div class="hm-row-label">
                <div class="item-frame" style="width:28px;height:28px;flex-shrink:0">
                  <img :src="`https://render.albiononline.com/v1/item/${row.id}.png`" :alt="row.name" loading="lazy" />
                </div>
                <span>{{ row.name }}</span>
              </div>
              <div v-for="(cell, ci) in row.cells" :key="ci" class="hm-cell" :style="{ background: cell.bg }">
                {{ cell.val.toLocaleString('fr-FR') }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Watchlist -->
    <div class="panel" style="margin-top:20px">
      <div class="panel-header">
        <h3>Ma watchlist</h3>
        <button class="ds-btn primary sm">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Ajouter
        </button>
      </div>
      <div class="watchlist">
        <NuxtLink v-for="w in watchlist" :key="w.id" :to="`/items/${w.id}`" class="wl-card">
          <div class="item-frame" style="width:48px;height:48px;flex-shrink:0">
            <img :src="`https://render.albiononline.com/v1/item/${w.id}.png`" :alt="w.name" loading="lazy" />
          </div>
          <div class="wl-meta">
            <div class="wl-name">{{ w.name }}</div>
            <div class="wl-price">{{ w.price.toLocaleString('fr-FR') }} ◇</div>
          </div>
          <svg :viewBox="`0 0 120 36`" width="120" height="36" style="flex-shrink:0">
            <polyline :points="w.sparkline" fill="none" :stroke="w.delta >= 0 ? 'var(--success)' : 'var(--danger)'" stroke-width="1.5" />
          </svg>
          <div :class="`wl-delta ${w.delta >= 0 ? 't-success' : 't-danger'}`">{{ w.delta >= 0 ? '+' : '' }}{{ w.delta.toFixed(1) }}%</div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const kpis = [
  { k: 'Volume 24h', v: '12.4 M ◇', d: '+8.2% vs hier', iconPaths: '<circle cx="8" cy="8" r="6"/><path d="M18.1 9a6 6 0 0 1 0 9.8M16 18.5a6 6 0 0 1-7.2.8"/>' },
  { k: 'Items suivis', v: '3 481', d: 'auto-priorisés', iconPaths: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>' },
  { k: 'Arbitrages détectés', v: '184', d: 'marge > 15%', iconPaths: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/>' },
  { k: 'Latence moy.', v: '4 m 12 s', d: 'P50 sur 7 cités', iconPaths: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>' },
]

const arbitrage = [
  { id: 'T8_2H_AXE_AVALON', name: 'Hache Avalonienne', buyCity: 'Bridgewatch', buy: 421000, sellCity: 'Caerleon', sell: 562000, vol: 24, margin: ((562000-421000)/421000)*100 },
  { id: 'T7_2H_BOW_KEEPER', name: 'Arc des Druides', buyCity: 'Lymhurst', buy: 184000, sellCity: 'Caerleon', sell: 248000, vol: 47, margin: ((248000-184000)/184000)*100 },
  { id: 'T6_PLANKS', name: 'Planches Vieilles', buyCity: 'Lymhurst', buy: 1240, sellCity: 'Bridgewatch', sell: 1690, vol: 14820, margin: ((1690-1240)/1240)*100 },
  { id: 'T8_HEAD_PLATE_SET3', name: 'Heaume du Champion', buyCity: 'Martlock', buy: 92400, sellCity: 'Caerleon', sell: 124100, vol: 36, margin: ((124100-92400)/92400)*100 },
  { id: 'T6_METALBAR', name: 'Lingot d\'Acier-Titane', buyCity: 'Bridgewatch', buy: 1820, sellCity: 'Lymhurst', sell: 2380, vol: 9420, margin: ((2380-1820)/1820)*100 },
  { id: 'T7_MEAL_OMELETTE', name: 'Omelette du Maître', buyCity: 'Thetford', buy: 6240, sellCity: 'Caerleon', sell: 8120, vol: 1240, margin: ((8120-6240)/6240)*100 },
  { id: 'T8_2H_HAMMER', name: 'Grand Marteau', buyCity: 'Fort Sterling', buy: 312000, sellCity: 'Caerleon', sell: 398000, vol: 18, margin: ((398000-312000)/312000)*100 },
  { id: 'T5_2H_TOOL_PICK', name: 'Pioche Adepte', buyCity: 'Lymhurst', buy: 4820, sellCity: 'Bridgewatch', sell: 6240, vol: 480, margin: ((6240-4820)/4820)*100 },
]

const cities = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Martlock', 'Thetford']
const heatItems = [
  { id: 'T8_2H_AXE_AVALON', name: 'Hache T8', base: 490000 },
  { id: 'T6_PLANKS', name: 'Planches T6', base: 1450 },
  { id: 'T6_METALBAR', name: 'Lingot T6', base: 2100 },
  { id: 'T7_MEAL_OMELETTE', name: 'Omelette T7', base: 7200 },
]

const heatmapData = heatItems.map(item => {
  const seed = [...item.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  const vals = cities.map((_, i) => Math.round(item.base * (0.85 + ((seed + i * 17) % 50) / 100)))
  const min = Math.min(...vals), max = Math.max(...vals)
  return {
    id: item.id, name: item.name,
    cells: vals.map(v => {
      const norm = (v - min) / (max - min || 1)
      return { val: v, bg: `rgba(201, 161, 74, ${0.05 + norm * 0.4})` }
    })
  }
})

function sparkline(id: string, delta: number) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)
  const pts = Array.from({ length: 14 }, (_, i) => {
    const y = 18 + Math.sin((seed + i) * 0.6) * 12 + (delta > 0 ? -i * 0.5 : i * 0.5)
    return `${(i / 13) * 120},${Math.max(2, Math.min(34, y))}`
  }).join(' ')
  return pts
}

const watchlist = [
  { id: 'T8_2H_AXE_AVALON', name: 'Hache Avalonienne', price: 562000, delta: 4.2 },
  { id: 'T7_2H_BOW_KEEPER', name: 'Arc des Druides', price: 248000, delta: -1.8 },
  { id: 'T8_MAIN_NATURESTAFF_KEEPER', name: 'Bâton Sauvage', price: 184000, delta: 2.1 },
  { id: 'T6_PLANKS', name: 'Planches T6', price: 1690, delta: 7.3 },
].map(w => ({ ...w, sparkline: sparkline(w.id, w.delta) }))
</script>
