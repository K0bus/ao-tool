<template>
  <div class="page crafting-page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Crafting Tree
        </div>
        <h1>Calculateur de craft</h1>
        <p class="t-muted" style="margin-top:6px">Visualisez chaque étape, ajustez les paramètres, calculez la marge.</p>
      </div>
    </div>

    <div class="crafting-layout">
      <!-- Left: tree col -->
      <div class="crafting-tree-col">

        <!-- Item selector -->
        <div class="panel">
          <div class="panel-header">
            <h3>Item à crafter</h3>
            <span v-if="selectedItem" class="tag">T{{ selectedItem.tier }}</span>
          </div>
          <div class="panel-body">
            <div v-if="selectedItem" class="selected-item">
              <div class="item-frame q-masterpiece" style="width:72px;height:72px;position:relative;flex-shrink:0">
                <img :src="`https://render.albiononline.com/v1/item/${selectedItem.uniqueName}.png`" :alt="selectedItem.name" />
                <span :class="`tier-badge t${selectedItem.tier}`" style="position:absolute;left:4px;top:4px">T{{ selectedItem.tier }}</span>
              </div>
              <div class="si-meta">
                <div class="si-name">{{ selectedItem.name }}</div>
                <div class="si-id t-dim t-mono">{{ selectedItem.uniqueName }}</div>
                <button class="ds-btn ghost sm" style="margin-top:8px" @click="clearItem">Changer d'item</button>
              </div>
              <div class="si-spacer"></div>
              <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end">
                <div class="field" style="margin:0;min-width:72px">
                  <label class="field-label">Quantité</label>
                  <input v-model.number="quantity" class="ds-input" type="number" min="1" max="9999" style="width:80px" />
                </div>
                <div class="field" style="margin:0;min-width:140px">
                  <label class="field-label">Cité d'achat</label>
                  <select v-model="city" class="ds-input">
                    <option v-for="c in CITIES" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-else>
              <div class="field" style="position:relative;margin:0">
                <label class="field-label">Rechercher un item craftable</label>
                <div style="position:relative">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gold);pointer-events:none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    v-model="itemSearch"
                    class="ds-input"
                    style="padding-left:32px"
                    type="text"
                    placeholder="Ex : Hache Avalonienne T8…"
                    @input="onItemSearch"
                  />
                </div>
                <div v-if="searchResults.length" class="search-dropdown">
                  <div
                    v-for="r in searchResults"
                    :key="r.uniqueName"
                    class="sd-row"
                    @click="selectItem(r)"
                  >
                    <img :src="`https://render.albiononline.com/v1/item/${r.uniqueName}.png`" :alt="r.name" width="28" height="28" style="border-radius:3px;background:var(--bg-2);flex-shrink:0" />
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;color:var(--text-0)">{{ r.name }}</div>
                      <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">{{ r.uniqueName }}</div>
                    </div>
                    <span class="tag">T{{ r.tier }}</span>
                  </div>
                </div>
              </div>
              <p style="font-size:12px;color:var(--text-3);margin-top:12px">
                Cherchez un item craftable pour visualiser son arbre de recette.
              </p>
            </div>
          </div>
        </div>

        <!-- Tree panel -->
        <div class="panel">
          <div class="panel-header">
            <h3>Arbre de craft</h3>
            <label class="view-toggle" :class="{ checked: listMode }" @click.prevent="listMode = !listMode">
              <input type="checkbox" class="vt-input" :checked="listMode" readonly />
              <span class="vt-track"><span class="vt-thumb"></span></span>
              <span class="vt-label">Vue liste</span>
            </label>
          </div>
          <div class="tree-body" :class="{ 'list-mode': listMode }">

            <!-- Empty -->
            <div v-if="!selectedItem" class="tree-empty">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/>
                <circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>
              </svg>
              <span>Sélectionnez un item craftable pour afficher son arbre de recette</span>
            </div>

            <!-- Loading -->
            <div v-else-if="treePending" class="tree-empty">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold);animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span>Chargement de l'arbre…</span>
            </div>

            <!-- No recipe -->
            <div v-else-if="!layoutData" class="tree-empty">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--text-3)"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <span>Aucune recette de craft trouvée pour cet item.</span>
            </div>

            <!-- Tree view -->
            <div v-else-if="!listMode" class="tree-wrap">
              <div class="tree-stage" :style="{ width: layoutData.totalW + 'px', height: layoutData.totalH + 'px' }">
                <svg class="tree-svg" :width="layoutData.totalW" :height="layoutData.totalH">
                  <path
                    v-for="(d, i) in layoutData.connectors"
                    :key="i"
                    :d="d"
                    fill="none"
                    stroke="rgba(201,161,74,0.35)"
                    stroke-width="1.4"
                  />
                </svg>
                <div
                  v-for="(node, i) in layoutData.allNodes"
                  :key="i"
                  class="tree-node"
                  :class="{ root: node.isRoot, leaf: node.isLeaf }"
                  :style="{ left: node.x + 'px', top: node.y + 'px', width: NODE_W + 'px', height: NODE_H + 'px' }"
                >
                  <div class="tn-img">
                    <img :src="`https://render.albiononline.com/v1/item/${node.uniqueName}.png`" :alt="node.name" loading="lazy" />
                    <span :class="`tier-badge t${node.tier}`" style="position:absolute;left:4px;top:4px">T{{ node.tier }}</span>
                  </div>
                  <div class="tn-meta">
                    <div class="tn-name">{{ node.name }}</div>
                    <div class="tn-qty t-mono">× {{ fmtQty(node.qty) }}</div>
                    <div class="tn-price t-mono">{{ node.marketPrice > 0 ? fmt(node.marketPrice * node.qty) + ' ◇' : '—' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- List view -->
            <div v-else class="tree-list">
              <CraftTreeListNode :node="layoutData.root" :depth="0" />
            </div>

          </div>
        </div>

      </div>

      <!-- Right: side col -->
      <div class="crafting-side-col">

        <!-- Parameters -->
        <div class="panel">
          <div class="panel-header"><h3>Paramètres</h3></div>
          <div class="panel-body params-body">
            <div class="param">
              <div class="param-head">
                <label>Frais de craft (cité)</label>
                <span class="t-mono t-gold">{{ craftFee }}%</span>
              </div>
              <input v-model.number="craftFee" type="range" class="range" min="0" max="30" step="0.5" />
            </div>
            <div class="param">
              <div class="param-head">
                <label>Bonus station</label>
                <span class="t-mono t-gold">{{ stationIP }} IP</span>
              </div>
              <input v-model.number="stationIP" type="range" class="range" min="0" max="100" step="1" />
            </div>
            <div class="param">
              <div class="param-head">
                <label>Spec maître artisan</label>
                <span class="t-mono t-gold">{{ masterSpec }} spé.</span>
              </div>
              <input v-model.number="masterSpec" type="range" class="range" min="0" max="150" step="1" />
            </div>
            <div class="param">
              <div class="param-head">
                <label>Taux de retour matières</label>
                <span class="t-mono t-gold">{{ returnRate }}%</span>
              </div>
              <input v-model.number="returnRate" type="range" class="range" min="0" max="50" step="0.1" />
            </div>

            <div class="param-toggles">
              <div class="toggle-row">
                <span class="label">Utiliser focus point</span>
                <label class="ds-switch">
                  <input v-model="useFocus" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb"></span></span>
                </label>
              </div>
              <div class="toggle-row">
                <span class="label">Inclure marge consommables</span>
                <label class="ds-switch">
                  <input v-model="includeConsumable" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb"></span></span>
                </label>
              </div>
              <div class="toggle-row">
                <span class="label">Marge nette (après taxe 4%)</span>
                <label class="ds-switch">
                  <input v-model="netMarginEnabled" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb"></span></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Economic summary -->
        <div class="panel framed">
          <div class="panel-header">
            <h3>Résumé économique</h3>
            <span v-if="layoutData" class="tag gold">Profit estimé</span>
          </div>
          <div class="summary-body">
            <div v-if="!layoutData" style="padding:20px 0;text-align:center;color:var(--text-3);font-size:13px">
              Sélectionnez un item pour voir le résumé
            </div>
            <template v-else>
              <div class="stat-row">
                <span class="label">Coût matières brut</span>
                <span class="val">{{ fmt(totalMaterialCost) }} ◇</span>
              </div>
              <div class="stat-row">
                <span class="label">Frais de craft ({{ craftFee }}%)</span>
                <span class="val t-danger">+{{ fmt(craftFeeAmount) }} ◇</span>
              </div>
              <div class="stat-row">
                <span class="label">Retour matières ({{ returnRate }}%)</span>
                <span class="val t-success">−{{ fmt(returnSavings) }} ◇</span>
              </div>
              <div class="stat-row hl">
                <span class="label">Coût net de production</span>
                <span class="val">{{ fmt(netCost) }} ◇</span>
              </div>
              <div class="stat-row">
                <span class="label">Prix de vente ({{ city }})</span>
                <span class="val">{{ sellPrice > 0 ? fmt(sellPrice) + ' ◇' : '—' }}</span>
              </div>
              <div v-if="netMarginEnabled" class="stat-row">
                <span class="label">Taxe marché (4%)</span>
                <span class="val t-danger">−{{ fmt(tax) }} ◇</span>
              </div>

              <div v-if="sellPrice > 0" class="profit-block">
                <div>
                  <div class="t-eyebrow">Profit net</div>
                  <div class="profit-val t-mono" :style="{ color: profit < 0 ? 'var(--danger)' : 'var(--success)' }">
                    {{ profit >= 0 ? '+' : '−' }}{{ fmt(Math.abs(profit)) }} ◇
                  </div>
                </div>
                <div style="text-align:right">
                  <div class="t-eyebrow">Marge</div>
                  <div class="margin-val t-mono" :style="{ color: margin < 0 ? 'var(--danger)' : 'var(--gold)' }">
                    {{ margin.toFixed(1) }}%
                  </div>
                </div>
              </div>
              <div v-else class="profit-block" style="justify-content:center">
                <span style="font-size:12px;color:var(--text-3)">Prix de vente non disponible pour {{ city }}</span>
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>

    <!-- Shopping list -->
    <div v-if="layoutData && shoppingList.length" class="panel" style="margin-top:20px">
      <div class="panel-header">
        <h3>Liste de courses · ressources brutes</h3>
        <span class="t-dim" style="font-size:12px">{{ city }} · {{ quantity }}×</span>
      </div>
      <div class="shop-grid">
        <div v-for="mat in shoppingList" :key="mat.node.uniqueName" class="shop-card">
          <div class="item-frame" style="width:44px;height:44px;flex-shrink:0">
            <img :src="`https://render.albiononline.com/v1/item/${mat.node.uniqueName}.png`" :alt="mat.node.name" loading="lazy" />
          </div>
          <div class="sc-meta">
            <div class="sc-name">{{ mat.node.name }}</div>
            <div class="sc-id t-dim t-mono">{{ mat.node.uniqueName }}</div>
          </div>
          <div class="sc-qty t-mono">× {{ fmtQty(mat.qty) }}</div>
          <div class="sc-price t-mono t-gold">{{ mat.node.marketPrice > 0 ? fmt(mat.node.marketPrice * mat.qty) + ' ◇' : '—' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Crafting Tree — Albion Codex' })

const route = useRoute()

onMounted(async () => {
  const id = route.query.id as string | undefined
  if (!id) return
  try {
    const res = await $fetch(`/api/v1/items/${encodeURIComponent(id)}`) as any
    if (res?.data) selectItem(res.data)
  } catch { /* item not found, ignore */ }
})

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Martlock', 'Thetford']
const NODE_W = 200
const NODE_H = 96
const GAP_X = 28
const GAP_Y = 64

// State
const itemSearch = ref('')
const searchResults = ref<any[]>([])
const selectedItem = ref<any>(null)
const quantity = ref(1)
const city = ref('Caerleon')
const craftFee = ref(8.5)
const stationIP = ref(53)
const masterSpec = ref(120)
const returnRate = ref(24.8)
const useFocus = ref(true)
const includeConsumable = ref(true)
const netMarginEnabled = ref(true)
const listMode = ref(false)
const treeData = ref<any>(null)
const treePending = ref(false)

// Search
let searchTimer: ReturnType<typeof setTimeout>

function onItemSearch() {
  clearTimeout(searchTimer)
  if (!itemSearch.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const res = await $fetch('/api/v1/items', { query: { q: itemSearch.value, craftable: 'true', limit: 8 } }) as any
      searchResults.value = res.data || []
    } catch { searchResults.value = [] }
  }, 280)
}

function selectItem(item: any) {
  selectedItem.value = item
  itemSearch.value = ''
  searchResults.value = []
  loadTree()
}

function clearItem() {
  selectedItem.value = null
  treeData.value = null
  itemSearch.value = ''
}

async function loadTree() {
  if (!selectedItem.value) return
  treePending.value = true
  treeData.value = null
  try {
    const res = await $fetch(`/api/v1/items/${encodeURIComponent(selectedItem.value.uniqueName)}/recipe/tree`) as any
    treeData.value = res.data
  } catch { treeData.value = null }
  finally { treePending.value = false }
}

// Market price
function getMarketPrice(marketPrices: any[], targetCity: string): number {
  if (!marketPrices?.length) return 0
  const cityPrices = marketPrices.filter((p: any) =>
    p.location?.name === targetCity && p.quality === 1 && p.sellPriceMin > 0
  )
  if (cityPrices.length) return Math.min(...cityPrices.map((p: any) => p.sellPriceMin))
  const fallback = marketPrices.filter((p: any) => p.quality === 1 && p.sellPriceMin > 0)
  if (fallback.length) return Math.min(...fallback.map((p: any) => p.sellPriceMin))
  return 0
}

// Tree building
interface DisplayNode {
  uniqueName: string
  name: string
  tier: number
  type: string
  qty: number
  isLeaf: boolean
  isRoot: boolean
  children: DisplayNode[]
  x: number
  y: number
  subtreeW: number
  marketPrice: number
}

const MAX_TREE_DEPTH = 5

function buildDisplayNode(apiNode: any, targetQty: number, targetCity: string, depth: number): DisplayNode {
  const hasRecipe = depth < MAX_TREE_DEPTH && apiNode.recipe?.ingredients?.length > 0
  const children: DisplayNode[] = []

  if (hasRecipe) {
    const resultCount = apiNode.recipe.resultCount || 1
    const runs = targetQty / resultCount
    for (const ing of apiNode.recipe.ingredients) {
      children.push(buildDisplayNode(ing, ing.quantity * runs, targetCity, depth + 1))
    }
  }

  return {
    uniqueName: apiNode.uniqueName,
    name: apiNode.name,
    tier: apiNode.tier,
    type: apiNode.type,
    qty: targetQty,
    isLeaf: children.length === 0,
    isRoot: depth === 0,
    children,
    x: 0, y: 0, subtreeW: 0,
    marketPrice: getMarketPrice(apiNode.marketPrices, targetCity)
  }
}

function applyLayout(node: DisplayNode, depth: number, startX: number): number {
  node.y = depth * (NODE_H + GAP_Y)
  if (!node.children.length) {
    node.x = startX
    node.subtreeW = NODE_W
    return NODE_W
  }
  let cursor = startX
  let totalW = 0
  node.children.forEach((c, i) => {
    const cw = applyLayout(c, depth + 1, cursor)
    cursor += cw + GAP_X
    totalW += cw + (i > 0 ? GAP_X : 0)
  })
  node.subtreeW = Math.max(totalW, NODE_W)
  node.x = startX + (node.subtreeW - NODE_W) / 2
  return node.subtreeW
}

function flattenNodes(node: DisplayNode, out: DisplayNode[] = []): DisplayNode[] {
  out.push(node)
  node.children.forEach(c => flattenNodes(c, out))
  return out
}

const layoutData = computed(() => {
  if (!treeData.value || !treeData.value.recipe) return null
  const root = buildDisplayNode(treeData.value, quantity.value, city.value, 0)
  const totalW = applyLayout(root, 0, 0)
  const allNodes = flattenNodes(root)
  const maxDepth = Math.max(...allNodes.map(n => Math.round(n.y / (NODE_H + GAP_Y))))
  const totalH = (maxDepth + 1) * (NODE_H + GAP_Y) - GAP_Y + 20
  const connectors = allNodes.flatMap(n =>
    n.children.map(c => {
      const x1 = n.x + NODE_W / 2
      const y1 = n.y + NODE_H
      const x2 = c.x + NODE_W / 2
      const y2 = c.y
      const my = (y1 + y2) / 2
      return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`
    })
  )
  return { root, totalW: Math.max(totalW, NODE_W), totalH, allNodes, connectors }
})

const shoppingList = computed(() => {
  if (!layoutData.value) return []
  const acc = new Map<string, { node: DisplayNode; qty: number }>()
  function collectLeaves(node: DisplayNode) {
    if (node.isLeaf) {
      const existing = acc.get(node.uniqueName)
      if (existing) existing.qty += node.qty
      else acc.set(node.uniqueName, { node, qty: node.qty })
    } else {
      node.children.forEach(collectLeaves)
    }
  }
  collectLeaves(layoutData.value.root)
  return Array.from(acc.values())
})

// Economics
const totalMaterialCost = computed(() =>
  shoppingList.value.reduce((sum, mat) => sum + mat.node.marketPrice * mat.qty, 0)
)
const craftFeeAmount = computed(() => totalMaterialCost.value * (craftFee.value / 100))
const returnSavings = computed(() => totalMaterialCost.value * (returnRate.value / 100))
const netCost = computed(() => totalMaterialCost.value + craftFeeAmount.value - returnSavings.value)
const sellPrice = computed(() => treeData.value ? getMarketPrice(treeData.value.marketPrices, city.value) : 0)
const tax = computed(() => netMarginEnabled.value ? sellPrice.value * 0.04 : 0)
const profit = computed(() => sellPrice.value > 0 ? sellPrice.value - tax.value - netCost.value : 0)
const margin = computed(() => netCost.value > 0 && sellPrice.value > 0 ? (profit.value / netCost.value) * 100 : 0)

function fmt(v: number) {
  if (!v) return '0'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'k'
  return Math.round(v).toLocaleString('fr-FR')
}

function fmtQty(v: number) {
  if (!v) return '0'
  return Number.isInteger(v) ? v.toString() : v.toFixed(1)
}
</script>
