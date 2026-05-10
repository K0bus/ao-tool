<template>
  <div class="chart-wrap">
    <!-- Loading -->
    <div v-if="pending" style="height:240px;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:13px">
      Chargement…
    </div>

    <!-- Empty -->
    <div v-else-if="!chartPoints.length" style="height:240px;display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:13px">
      Aucun historique de prix disponible
    </div>

    <!-- Chart -->
    <template v-else>
      <!-- Meta row -->
      <div class="chart-meta">
        <div>
          <div class="cm-k">Prix actuel</div>
          <div class="cm-v t-gold">{{ formatNum(currentPrice) }}</div>
        </div>
        <div>
          <div class="cm-k">Variation</div>
          <div class="cm-v" :class="delta >= 0 ? 't-success' : 't-danger'">
            {{ delta >= 0 ? '+' : '' }}{{ delta.toFixed(1) }}%
          </div>
        </div>
        <div>
          <div class="cm-k">Min · Max</div>
          <div class="cm-v t-muted" style="font-size:14px">{{ formatNum(minVal) }} · {{ formatNum(maxVal) }}</div>
        </div>
        <div>
          <div class="cm-k">Points</div>
          <div class="cm-v t-muted">{{ chartPoints.length }}</div>
        </div>
      </div>

      <!-- SVG -->
      <svg
        class="price-chart"
        viewBox="0 0 720 240"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="g-area-chart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#c9a14a" stop-opacity="0.32" />
            <stop offset="100%" stop-color="#c9a14a" stop-opacity="0" />
          </linearGradient>
        </defs>

        <!-- Area fill -->
        <polygon
          :points="areaPts"
          fill="url(#g-area-chart)"
        />

        <!-- Line -->
        <polyline
          :points="linePts"
          fill="none"
          stroke="#c9a14a"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- Last point vertical dashed line -->
        <line
          :x1="lastX"
          y1="16"
          :x2="lastX"
          :y2="H - PAD.b"
          stroke="#c9a14a"
          stroke-width="1"
          stroke-dasharray="4 3"
          stroke-opacity="0.4"
        />

        <!-- Last point dot -->
        <circle
          :cx="lastX"
          :cy="lastY"
          r="4"
          fill="#c9a14a"
          stroke="var(--bg-1)"
          stroke-width="2"
        />

        <!-- Y-axis ticks -->
        <g font-family="'JetBrains Mono', monospace" font-size="10" fill="var(--text-3)" text-anchor="end">
          <text v-for="tick in yTicks" :key="tick.v" :x="PAD.l - 6" :y="ys(tick.v) + 4">{{ tick.label }}</text>
        </g>

        <!-- Y-axis grid lines -->
        <g>
          <line
            v-for="tick in yTicks"
            :key="'g-' + tick.v"
            :x1="PAD.l"
            :y1="ys(tick.v)"
            :x2="W - PAD.r"
            :y2="ys(tick.v)"
            stroke="var(--border-divider)"
            stroke-width="1"
            stroke-dasharray="3 4"
          />
        </g>

        <!-- X-axis date labels -->
        <g font-family="'JetBrains Mono', monospace" font-size="10" fill="var(--text-3)" text-anchor="middle">
          <text
            v-for="xl in xLabels"
            :key="xl.i"
            :x="xs(xl.i)"
            :y="H - 6"
          >{{ xl.label }}</text>
        </g>
      </svg>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  uniqueName: string
  quality: number
  days: number
}>()

const W = 720
const H = 240
const PAD = { l: 56, r: 16, t: 16, b: 28 }

const { data: historyData, pending } = useFetch(
  () => `/api/v1/items/${encodeURIComponent(props.uniqueName)}/market/history`,
  {
    query: computed(() => ({ days: props.days, quality: props.quality })),
    watch: [() => props.uniqueName, () => props.quality, () => props.days],
    transform: (res: any) => res.data as Array<{ sellPriceMin: number; buyPriceMax: number; timestamp: string }>,
  }
)

// Use only sellPriceMin > 0, ordered chronologically — last known sell price above zero
const chartPoints = computed(() => {
  if (!historyData.value?.length) return []
  return historyData.value
    .filter(d => d.sellPriceMin > 0)
    .map(d => ({ v: d.sellPriceMin, ts: d.timestamp }))
})

const values = computed(() => chartPoints.value.map(d => d.v))
const n = computed(() => values.value.length)
const minVal = computed(() => Math.min(...values.value))
const maxVal = computed(() => Math.max(...values.value))
const currentPrice = computed(() => values.value[n.value - 1] ?? 0)
const firstPrice = computed(() => values.value[0] ?? 0)
const delta = computed(() => {
  if (!firstPrice.value) return 0
  return ((currentPrice.value - firstPrice.value) / firstPrice.value) * 100
})

// SVG coordinate functions
function xs(i: number): number {
  if (n.value <= 1) return PAD.l
  return PAD.l + (i / (n.value - 1)) * (W - PAD.l - PAD.r)
}

function ys(v: number): number {
  const range = maxVal.value - minVal.value
  if (!range) return PAD.t + (H - PAD.t - PAD.b) / 2
  return PAD.t + (1 - (v - minVal.value) / range) * (H - PAD.t - PAD.b)
}

const linePts = computed(() =>
  values.value.map((v, i) => `${xs(i)},${ys(v)}`).join(' ')
)

const areaPts = computed(() => {
  if (!n.value) return ''
  const bottom = H - PAD.b
  return `${xs(0)},${bottom} ${linePts.value} ${xs(n.value - 1)},${bottom}`
})

const lastX = computed(() => xs(n.value - 1))
const lastY = computed(() => ys(currentPrice.value))

// Y-axis ticks (4-5)
const yTicks = computed(() => {
  if (!n.value) return []
  const count = 5
  const range = maxVal.value - minVal.value
  const ticks: { v: number; label: string }[] = []
  for (let i = 0; i < count; i++) {
    const v = minVal.value + (range * i) / (count - 1)
    ticks.push({ v, label: shortFmt(v) })
  }
  return ticks
})

// X-axis date labels (spaced)
const xLabels = computed(() => {
  if (!n.value) return []
  const step = Math.max(1, Math.floor(n.value / 6))
  const labels: { i: number; label: string }[] = []
  for (let i = 0; i < n.value; i += step) {
    const d = new Date(chartPoints.value[i].ts)
    const label = `${d.getDate()}/${d.getMonth() + 1}`
    labels.push({ i, label })
  }
  return labels
})

function shortFmt(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`
  return String(Math.round(v))
}

function formatNum(v: number): string {
  return v.toLocaleString('fr-FR')
}
</script>
