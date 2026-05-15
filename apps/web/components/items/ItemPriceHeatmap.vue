<template>
  <div class="panel">
    <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <h3>Heatmap des prix</h3>
        <span class="tag info" title="Prix consolidés via l'historique si nécessaire">Consolidé</span>
      </div>
      <div style="display:flex;gap:4px">
        <button
          :class="['ds-btn ghost', mode === 'sell' && 'active']"
          style="padding:3px 10px;font-size:11px"
          @click="mode = 'sell'"
        >Vente</button>
        <button
          :class="['ds-btn ghost', mode === 'buy' && 'active']"
          style="padding:3px 10px;font-size:11px"
          @click="mode = 'buy'"
        >Achat</button>
      </div>
    </div>

    <div v-if="!activeCities.length" style="padding:24px 18px;text-align:center;color:var(--text-3);font-size:13px">
      Aucun prix de marché disponible
    </div>

    <div v-else style="overflow-x:auto">
      <table class="hm-table">
        <thead>
          <tr>
            <th class="hm-th-qual">Qualité</th>
            <th v-for="city in activeCities" :key="city.id" class="hm-th-city">
              <div class="hm-city-inner">
                <span class="hm-city-dot" :style="{ background: cityColor(city.name) }"></span>
                {{ city.shortName }}
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="q in qualities" :key="q.value" class="hm-row">
            <td class="hm-td-qual">
              <div class="hm-qual-inner">
                <span :class="`quality-dot q-${q.dotClass}`"></span>
                <span>{{ q.label }}</span>
              </div>
            </td>
            <td
              v-for="city in activeCities"
              :key="city.id"
              class="hm-cell"
              :style="cellStyle(q.value, city.id)"
            >
              <template v-if="cellPrice(q.value, city.id) > 0">
                <span class="hm-price t-mono">{{ cellPrice(q.value, city.id).toLocaleString('fr-FR') }}</span>
                <span class="hm-age">{{ cellAgeText(q.value, city.id) }}</span>
              </template>
              <span v-else class="hm-empty">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeCities.length" class="hm-legend">
      <span class="hm-legend-label">
        {{ mode === 'sell' ? 'Vert = prix de vente le plus bas' : "Vert = prix d'achat le plus haut" }}
      </span>
      <div class="hm-legend-grad" :style="legendGradStyle"></div>
      <span class="hm-legend-label">max</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ResolvedMarketPrice {
  locationId: string
  quality: number
  sellPrice: number
  buyPrice: number
  updatedAt: string
  location?: { name: string; type?: string }
}

interface Props {
  prices: ResolvedMarketPrice[]
  maxQuality?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxQuality: 5
})

const mode = ref<'sell' | 'buy'>('sell')

const qualities = computed(() => {
  const all = [
    { value: 1, label: 'Normale',     dotClass: 'normal' },
    { value: 2, label: 'Bonne',       dotClass: 'good' },
    { value: 3, label: 'Remarquable', dotClass: 'outstanding' },
    { value: 4, label: 'Excellente',  dotClass: 'excellent' },
    { value: 5, label: "Chef-d'œuvre", dotClass: 'masterpiece' },
  ]
  return all.filter(q => q.value <= props.maxQuality)
})

const CITY_ORDER = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Martlock', 'Thetford', 'Black Market']

const CITY_SHORT: Record<string, string> = {
  'Fort Sterling': 'Ft. Sterling',
  'Black Market':  'Black Mkt',
}

const CITY_COLORS: Record<string, string> = {
  Caerleon:       '#c9a14a',
  Bridgewatch:    '#c9614a',
  Lymhurst:       '#7da04a',
  'Fort Sterling':'#6a9ec0',
  Martlock:       '#8b72c8',
  Thetford:       '#c47a3a',
  'Black Market': '#5a5a5a',
}

const activeCities = computed(() => {
  const seen = new Map<string, { id: string; name: string; shortName: string }>()
  for (const p of props.prices) {
    if (!p.location || seen.has(p.locationId)) continue
    seen.set(p.locationId, {
      id: p.locationId,
      name: p.location.name,
      shortName: CITY_SHORT[p.location.name] ?? p.location.name,
    })
  }
  return [...seen.values()].sort((a, b) => {
    const ai = CITY_ORDER.indexOf(a.name)
    const bi = CITY_ORDER.indexOf(b.name)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})

const priceIndex = computed(() => {
  const m = new Map<string, ResolvedMarketPrice>()
  for (const p of props.prices) {
    m.set(`${p.quality}:${p.locationId}`, p)
  }
  return m
})

const rowRanges = computed(() => {
  const ranges = new Map<number, { min: number; max: number }>()
  for (const q of qualities.value) {
    let min = Infinity
    let max = -Infinity
    for (const city of activeCities.value) {
      const p = priceIndex.value.get(`${q.value}:${city.id}`)
      if (!p) continue
      const val = cellPrice(q.value, city.id)
      if (val > 0) { min = Math.min(min, val); max = Math.max(max, val) }
    }
    if (min !== Infinity) ranges.set(q.value, { min, max })
  }
  return ranges
})

function cellPrice(quality: number, cityId: string): number {
  const p = priceIndex.value.get(`${quality}:${cityId}`)
  if (!p) return 0
  if (mode.value === 'sell') {
    return p.sellPrice
  } else {
    return p.buyPrice
  }
}

function cellAgeText(quality: number, cityId: string): string {
  const p = priceIndex.value.get(`${quality}:${cityId}`)
  if (!p?.updatedAt) return ''
  const diff = Date.now() - new Date(p.updatedAt).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

// green [93,155,77] → red [176,74,50]
const GREEN = [93, 155, 77]
const RED   = [176, 74, 50]

function cellStyle(quality: number, cityId: string): Record<string, string> {
  const price = cellPrice(quality, cityId)
  if (price <= 0) return {}
  const range = rowRanges.value.get(quality)
  if (!range) return {}
  const { min, max } = range

  const t = min === max ? 0.5 : (price - min) / (max - min)
  // sell: low price is best → 0 = green ; buy: high price is best → 0 = green
  const norm = mode.value === 'sell' ? t : 1 - t

  const col = GREEN.map((c, i) => Math.round(c + (RED[i] - c) * norm))
  const alpha  = (0.10 + norm * 0.28).toFixed(2)
  const border = (0.15 + norm * 0.35).toFixed(2)

  return {
    background:  `rgba(${col},${alpha})`,
    borderColor: `rgba(${col},${border})`,
  }
}

function cityColor(name: string): string {
  return CITY_COLORS[name] ?? '#6f8080'
}

const legendGradStyle = computed(() => {
  const from = mode.value === 'sell' ? 'rgba(93,155,77,0.6)' : 'rgba(176,74,50,0.6)'
  const to   = mode.value === 'sell' ? 'rgba(176,74,50,0.6)' : 'rgba(93,155,77,0.6)'
  return { background: `linear-gradient(to right, ${from}, ${to})` }
})
</script>

<style scoped>
.hm-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  padding: 8px 12px 10px;
}

.hm-th-qual {
  text-align: left;
  padding: 4px 10px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
  font-family: var(--font-display);
  min-width: 130px;
  white-space: nowrap;
}

.hm-th-city {
  text-align: center;
  padding: 4px 4px 8px;
  min-width: 88px;
}

.hm-city-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-2);
  font-family: var(--font-display);
  white-space: nowrap;
}

.hm-city-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
}

.hm-td-qual {
  padding: 3px 8px;
}

.hm-qual-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
  font-family: var(--font-display);
  white-space: nowrap;
}

.hm-cell {
  text-align: center;
  padding: 7px 4px 5px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: filter 0.12s;
  cursor: default;
}

.hm-cell:hover { filter: brightness(1.18); }

.hm-price {
  display: block;
  font-size: 12px;
  color: var(--text-0);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.hm-empty {
  display: block;
  font-size: 14px;
  color: var(--text-4);
  line-height: 2;
}

.hm-age {
  display: block;
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}

.hm-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px 12px;
  border-top: 1px solid var(--border-divider);
}

.hm-legend-label {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
}

.hm-legend-grad {
  flex: 1;
  max-width: 120px;
  height: 6px;
  border-radius: 3px;
  margin-left: auto;
}
</style>

<style scoped>
.hm-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  padding: 8px 12px 10px;
}

.hm-th-qual {
  text-align: left;
  padding: 4px 10px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
  font-family: var(--font-display);
  min-width: 130px;
  white-space: nowrap;
}

.hm-th-city {
  text-align: center;
  padding: 4px 4px 8px;
  min-width: 88px;
}

.hm-city-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-2);
  font-family: var(--font-display);
  white-space: nowrap;
}

.hm-city-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.3);
}

.hm-td-qual {
  padding: 3px 8px;
}

.hm-qual-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
  font-family: var(--font-display);
  white-space: nowrap;
}

.hm-cell {
  text-align: center;
  padding: 7px 4px 5px;
  border-radius: 4px;
  border: 1px solid transparent;
  transition: filter 0.12s;
  cursor: default;
}

.hm-cell:hover { filter: brightness(1.18); }

.hm-price {
  display: block;
  font-size: 12px;
  color: var(--text-0);
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.hm-empty {
  display: block;
  font-size: 14px;
  color: var(--text-4);
  line-height: 2;
}

.hm-age {
  display: block;
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}

.hm-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px 12px;
  border-top: 1px solid var(--border-divider);
}

.hm-legend-label {
  font-size: 11px;
  color: var(--text-3);
  white-space: nowrap;
}

.hm-legend-grad {
  flex: 1;
  max-width: 120px;
  height: 6px;
  border-radius: 3px;
  margin-left: auto;
}
</style>
