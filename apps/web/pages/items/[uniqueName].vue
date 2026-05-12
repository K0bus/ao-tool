<template>
  <div class="page item-detail">
    <!-- Loading -->
    <template v-if="pending">
      <div class="page-header">
        <div class="skel" style="width:140px;height:14px;border-radius:4px;margin-bottom:12px" />
        <div class="skel" style="width:300px;height:28px;border-radius:4px" />
      </div>
      <div class="panel" style="padding:24px;display:flex;gap:20px;align-items:flex-start">
        <div class="skel" style="width:240px;height:240px;border-radius:8px;flex-shrink:0" />
        <div style="flex:1;display:flex;flex-direction:column;gap:10px">
          <div class="skel" style="width:220px;height:22px;border-radius:4px" />
          <div class="skel" style="width:160px;height:14px;border-radius:4px" />
          <div class="skel" style="width:120px;height:14px;border-radius:4px" />
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="panel" style="padding:48px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">✦</div>
      <p style="font-size:16px;font-weight:600;color:var(--text-0);margin-bottom:4px">Item introuvable</p>
      <p class="t-mono t-dim" style="font-size:12px;margin-bottom:20px">{{ route.params.uniqueName }}</p>
      <NuxtLink to="/items" class="ds-btn ghost">← Retour aux items</NuxtLink>
    </div>
    
    <!-- Content -->
    <template v-else-if="item">
      <!-- Page header -->
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span><NuxtLink to="/items">Items</NuxtLink><span class="sep">/</span>{{ item.name }}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <NuxtLink v-if="item.isCraftable" :to="`/crafting?id=${item.uniqueName}`" class="ds-btn primary">
            Crafting tree
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Hero panel -->
      <div class="panel parchment framed item-hero-panel" style="margin-bottom:24px">
        <div class="item-hero-body">
          <!-- Item image -->
          <div :class="`item-frame q-${qualityFrameClass} item-hero-img`">
            <AoItemImage
              :unique-name="item.uniqueName"
              :display-name="item.name"
              :alt="item.name"
              loading="eager"
              :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
            />
            <span class="corner">T·{{ item.tier }}<span v-if="item.enchantmentLevel > 0">.{{ item.enchantmentLevel }}</span></span>
          </div>

          <!-- Item meta -->
          <div class="item-hero-meta">
            <!-- Tags row -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
              <span :class="`tier-badge t${item.tier}`">T{{ item.tier }}</span>
              <span class="tag">{{ item.shopSubcategory ?? item.shopCategory ?? item.itemType }}</span>
              <span v-if="item.isCraftable" class="tag success">Craftable</span>
              <span v-if="item.isRefinable" class="tag info">Raffinable</span>
              <span class="t-dim t-mono" style="font-size:11px">{{ item.uniqueName }}</span>
            </div>

            <h1 style="font-size:28px;margin:4px 0 6px;color:var(--text-0);font-family:var(--font-display)">{{ item.name }}</h1>

            <p v-if="description" class="t-muted" style="max-width:640px;margin-bottom:12px;font-size:13px;line-height:1.6">
              {{ description }}
            </p>

            <!-- Quality switch -->
            <div class="qual-switch">
              <span class="t-eyebrow">Qualité</span>
              <button
                v-for="(label, qi) in qualityLabels"
                :key="qi + 1"
                :class="['qchip', selectedQuality === qi + 1 && 'active']"
                @click="selectedQuality = qi + 1"
              >
                <span :class="`quality-dot q-${qualityDotClasses[qi]}`"></span>
                {{ label }}
              </button>
            </div>

            <!-- Quick stats grid -->
            <div class="qstats">
              <!-- Tier — always -->
              <div class="qst">
                <span class="qst-k">Tier</span>
                <span class="qst-v t-mono">T{{ item.tier }}</span>
              </div>
              <!-- Enchantement -->
              <div v-if="item.enchantmentLevel > 0" class="qst">
                <span class="qst-k">Enchant</span>
                <span class="qst-v t-mono">.{{ item.enchantmentLevel }}</span>
              </div>
              <!-- Item Power -->
              <div v-if="item.stats?.itemPower" class="qst">
                <span class="qst-k">IP</span>
                <span class="qst-v t-mono">{{ item.stats.itemPower }}</span>
              </div>
              <!-- Durabilité -->
              <div v-if="item.stats?.durability" class="qst">
                <span class="qst-k">Durabilité</span>
                <span class="qst-v t-mono">{{ item.stats.durability }}</span>
              </div>
              <!-- Poids -->
              <div v-if="item.weight" class="qst">
                <span class="qst-k">Poids</span>
                <span class="qst-v t-mono">{{ item.weight }}<span style="font-size:11px;color:var(--text-3)"> kg</span></span>
              </div>
              <!-- Stack max -->
              <div v-if="item.maxStackSize > 1" class="qst">
                <span class="qst-k">Stack</span>
                <span class="qst-v t-mono">{{ item.maxStackSize.toLocaleString('fr-FR') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Price heatmap -->
      <ItemPriceHeatmap
        :prices="item.resolvedPrices ?? []"
        style="margin-bottom:24px"
      />

      <!-- Two-column info grid -->
      <div class="id-grid">
        <!-- LEFT column -->
        <div class="id-col">
          <!-- Price chart panel -->
          <div class="panel">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
              <h3>Historique des prix</h3>
              <div style="display:flex;gap:4px">
                <button
                  v-for="period in chartPeriods"
                  :key="period.days"
                  :class="['ds-btn ghost', chartDays === period.days && 'active']"
                  style="padding:3px 8px;font-size:11px"
                  @click="chartDays = period.days"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
            <div style="padding:16px 18px">
              <ItemSvgChart
                :unique-name="item.uniqueName"
                :quality="selectedQuality"
                :days="chartDays"
              />
            </div>
          </div>

          <!-- City prices panel -->
          <div class="panel">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
              <h3>Marché par cité</h3>
              <span v-if="latestUpdate" class="tag" style="font-size:11px">{{ latestUpdate }}</span>
            </div>
            <div v-if="!filteredPrices.length" style="padding:24px 18px;text-align:center;color:var(--text-3);font-size:13px">
              Aucun prix de marché disponible pour cette qualité
            </div>
            <div v-else style="overflow-x:auto">
              <table class="ds-table" style="width:100%">
                <thead>
                  <tr>
                    <th>Cité</th>
                    <th style="text-align:right">Vente</th>
                    <th style="text-align:right">Achat</th>
                    <th style="text-align:right">Spread</th>
                    <th style="text-align:right">MAJ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="price in filteredPrices" :key="price.locationId">
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span
                          style="width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block"
                          :style="{ background: cityColor(price.location) }"
                        ></span>
                        {{ price.location?.name ?? price.locationId }}
                      </div>
                    </td>
                    <td style="text-align:right;color:var(--gold);font-family:var(--font-mono);font-size:13px">
                      {{ price.sellPrice > 0 ? price.sellPrice.toLocaleString('fr-FR') : '—' }}
                    </td>
                    <td style="text-align:right;font-family:var(--font-mono);font-size:13px;color:var(--text-2)">
                      {{ price.buyPrice > 0 ? price.buyPrice.toLocaleString('fr-FR') : '—' }}
                    </td>
                    <td style="text-align:right;font-family:var(--font-mono);font-size:12px" :class="spreadClass(price)">
                      {{ spread(price) }}
                    </td>
                    <td style="text-align:right;font-size:11px;color:var(--text-3)">
                      {{ formatRelative(price.updatedAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT column -->
        <div class="id-col">
          <!-- Item stats panel -->
          <div class="panel">
            <div class="panel-header"><h3>Statistiques</h3></div>
            <div v-if="hasStats" style="display:flex;flex-direction:column">
              <div
                v-for="stat in statRows"
                :key="stat.key"
                class="stat-row"
                style="display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:1px solid var(--border-divider)"
              >
                <span style="font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;font-family:var(--font-display)">{{ stat.label }}</span>
                <span style="font-size:14px;color:var(--text-1);font-family:var(--font-mono)">{{ stat.value }}</span>
              </div>
            </div>
            <div v-else style="padding:24px 18px;text-align:center;color:var(--text-3);font-size:13px">
              Aucune statistique disponible
            </div>
          </div>

          <!-- Recipe mini panel (only if craftable) -->
          <div v-if="item.craftingRecipe" class="panel parchment">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
              <h3>Recette · synthèse</h3>
              <NuxtLink :to="`/crafting?id=${item.uniqueName}`" class="t-gold" style="font-size:12px">
                Tree complet →
              </NuxtLink>
            </div>
            <div class="recipe-mini">
              <div
                v-for="ing in item.craftingRecipe.ingredients"
                :key="ing.itemId"
                class="rmi"
              >
                <div class="item-frame q-normal" style="width:44px;height:44px;flex-shrink:0">
                  <AoItemImage
                    :unique-name="ing.itemId"
                    :display-name="ing.item?.name"
                    :alt="ing.item?.name ?? ing.itemId"
                    :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
                  />
                </div>
                <div class="rmi-meta">
                  <div class="rmi-name">{{ ing.item?.name ?? ing.itemId }}</div>
                  <div class="rmi-id">{{ ing.item?.uniqueName ?? ing.itemId }}</div>
                </div>
                <div class="rmi-qty">×{{ ing.quantity }}</div>
              </div>
            </div>
            <div class="panel-footer" style="padding:10px 18px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border-divider);font-size:12px;color:var(--text-3)">
              <span>Nutrition requise</span>
              <span v-if="item.craftingRecipe.silverCost > 0" class="t-mono" style="color:var(--gold)">{{ item.craftingRecipe.silverCost.toLocaleString('fr-FR') }}</span>
              <span v-else class="t-muted">—</span>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import ItemSvgChart from '~/components/items/ItemSvgChart.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const uniqueName = computed(() => route.params.uniqueName as string)

const { data: item, pending, error } = await useFetch(
  () => `/api/v1/items/${encodeURIComponent(uniqueName.value)}`,
  {
    key: () => `item-${uniqueName.value}`,
    transform: (res: { data: any }) => res.data,
  }
)

const description = computed(() =>
  item.value?.localizations?.find((l: any) => l.locale === 'EN-US')?.description ?? null
)

// Quality selection (1-5)
const selectedQuality = ref(1)

// Chart period
const chartDays = ref(30)
const chartPeriods = [
  { label: '7j', days: 7 },
  { label: '30j', days: 30 },
  { label: '90j', days: 90 },
  { label: '1a', days: 365 },
]

// Quality labels and dot classes
const qualityLabels = ['Normale', 'Bonne', 'Remarquable', 'Excellente', "Chef-d'œuvre"]
const qualityDotClasses = ['normal', 'good', 'outstanding', 'excellent', 'masterpiece']

// Hero image quality frame class (based on selectedQuality)
const qualityFrameClass = computed(() => {
  return qualityDotClasses[selectedQuality.value - 1] ?? 'normal'
})

// City prices filtered by selectedQuality
const filteredPrices = computed(() => {
  if (!item.value?.resolvedPrices) return []
  return item.value.resolvedPrices.filter(
    (p: any) => p.quality === selectedQuality.value && (p.sellPrice > 0 || p.buyPrice > 0)
  )
})

// Latest update time across filtered prices
const latestUpdate = computed(() => {
  if (!filteredPrices.value.length) return null
  const dates = filteredPrices.value.map((p: any) => new Date(p.updatedAt).getTime()).filter(Boolean)
  if (!dates.length) return null
  return formatRelative(new Date(Math.max(...dates)).toISOString())
})

// City color mapping
function cityColor(location: any): string {
  if (!location) return '#5aab8a'
  const name = location.name ?? ''
  const type = location.type ?? ''
  if (name === 'Black Market') return '#4a4a4a'
  const royalColors: Record<string, string> = {
    Caerleon: '#c9a14a',
    Bridgewatch: '#c9614a',
    Lymhurst: '#7da04a',
    'Fort Sterling': '#6a9ec0',
    Martlock: '#8b72c8',
    Thetford: '#c47a3a',
  }
  if (type === 'ROYAL_CITY' && royalColors[name]) return royalColors[name]
  if (type === 'ROYAL_CITY') return '#c9a14a'
  return '#5aab8a'
}

// Spread calculation
function spread(price: any): string {
  if (!price.sellPrice || !price.buyPrice || price.sellPrice <= 0 || price.buyPrice <= 0) return '—'
  const pct = ((price.sellPrice - price.buyPrice) / price.buyPrice) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function spreadClass(price: any): string {
  if (!price.sellPrice || !price.buyPrice || price.sellPrice <= 0 || price.buyPrice <= 0) return 't-muted'
  const pct = ((price.sellPrice - price.buyPrice) / price.buyPrice) * 100
  return pct >= 0 ? 't-success' : 't-danger'
}

// Relative time
function formatRelative(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

// Stats section
const statKeyLabels: Record<string, string> = {
  slotType: 'Slot',
  itemPower: 'Item Power',
  durability: 'Durabilité',
  abilityPower: 'Puissance',
  craftingCategory: 'Catégorie craft',
}

const statRows = computed(() => {
  const rows: { key: string; label: string; value: string }[] = []
  const stats = item.value?.stats
  if (stats) {
    for (const [k, v] of Object.entries(stats)) {
      if (v !== null && v !== undefined) {
        rows.push({ key: k, label: statKeyLabels[k] ?? k, value: String(v) })
      }
    }
  }
  if (item.value?.weight) {
    rows.push({ key: 'weight', label: 'Poids', value: `${item.value.weight} kg` })
  }
  if (item.value?.maxStackSize > 1) {
    rows.push({ key: 'stack', label: 'Stack max', value: item.value.maxStackSize.toLocaleString('fr-FR') })
  }
  if (item.value?.enchantmentLevel !== undefined) {
    rows.push({ key: 'enchant', label: 'Enchantement', value: `.${item.value.enchantmentLevel}` })
  }
  return rows
})

const hasStats = computed(() => statRows.value.length > 0)


useHead(() => ({
  title: item.value ? `${item.value.name} — Albion Codex` : 'Item — Albion Codex',
  meta: [{ name: 'description', content: item.value ? `${item.value.name} T${item.value.tier} — Craft, raffinage, marché` : '' }],
}))
</script>
