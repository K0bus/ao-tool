<template>
  <div class="page crafting">
    <!-- Header -->
    <div class="page-header">
      <div class="breadcrumb">
        <NuxtLink to="/">Accueil</NuxtLink>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        <span>Crafting Tree</span>
      </div>
      <h1 class="page-title">Crafting Tree</h1>
      <p class="page-sub">Calculez le coût total, la marge et les matériaux nécessaires pour crafter n'importe quel item.</p>
    </div>

    <div class="crafting-layout">
      <!-- Left: Item selector + params -->
      <aside class="crafting-side">
        <!-- Item selector -->
        <div class="panel">
          <div class="panel-header"><h3>Item à crafter</h3></div>
          <div class="panel-body">
            <div class="field">
              <label class="field-label">Rechercher</label>
              <div class="search-wrap" style="position:relative">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gold);pointer-events:none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                <input
                  v-model="itemSearch"
                  class="ds-input"
                  style="padding-left:32px"
                  type="text"
                  placeholder="Ex : Hache Avalonienne T8…"
                  @input="onItemSearch"
                />
                <div v-if="searchResults.length" class="search-dropdown">
                  <div
                    v-for="r in searchResults"
                    :key="r.uniqueName"
                    class="sd-row"
                    @click="selectItem(r)"
                  >
                    <img :src="`https://render.albiononline.com/v1/item/${r.uniqueName}.png`" :alt="r.name" width="28" height="28" style="border-radius:3px;background:var(--bg-2);flex-shrink:0" />
                    <div>
                      <div style="font-size:13px;color:var(--text-0)">{{ r.name }}</div>
                      <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">{{ r.uniqueName }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Selected item preview -->
            <div v-if="selectedItem" class="selected-item-preview">
              <div :class="`item-frame q-${qualityClass} sm`">
                <img :src="`https://render.albiononline.com/v1/item/${selectedItem.uniqueName}.png`" :alt="selectedItem.name" />
                <span class="corner">T·{{ selectedItem.tier }}</span>
              </div>
              <div>
                <div style="font-size:14px;font-weight:600;color:var(--text-0)">{{ selectedItem.name }}</div>
                <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">{{ selectedItem.uniqueName }}</div>
              </div>
            </div>

            <div class="field">
              <label class="field-label">Quantité</label>
              <input v-model.number="quantity" class="ds-input" type="number" min="1" max="9999" />
            </div>

            <div class="field">
              <label class="field-label">Ville d'achat des ressources</label>
              <select v-model="city" class="ds-input">
                <option value="Caerleon">Caerleon</option>
                <option value="Bridgewatch">Bridgewatch</option>
                <option value="Lymhurst">Lymhurst</option>
                <option value="Martlock">Martlock</option>
                <option value="Thetford">Thetford</option>
                <option value="Fort Sterling">Fort Sterling</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Parameters -->
        <div class="panel" style="margin-top:12px">
          <div class="panel-header"><h3>Paramètres</h3></div>
          <div class="panel-body">
            <div class="field">
              <div class="field-row">
                <label class="field-label">Frais de craft</label>
                <span class="t-mono" style="font-size:12px;color:var(--gold)">{{ craftFee }}%</span>
              </div>
              <input v-model.number="craftFee" type="range" min="0" max="25" step="0.1" class="ds-range" />
              <div class="range-labels"><span>0%</span><span>25%</span></div>
            </div>

            <div class="field">
              <div class="field-row">
                <label class="field-label">Bonus station (IP)</label>
                <span class="t-mono" style="font-size:12px;color:var(--gold)">{{ stationIP }}</span>
              </div>
              <input v-model.number="stationIP" type="range" min="0" max="400" step="10" class="ds-range" />
              <div class="range-labels"><span>0</span><span>400</span></div>
            </div>

            <div class="field">
              <div class="field-row">
                <label class="field-label">Spécialisation maître-artisan</label>
                <span class="t-mono" style="font-size:12px;color:var(--gold)">{{ masterSpec }}%</span>
              </div>
              <input v-model.number="masterSpec" type="range" min="0" max="100" step="1" class="ds-range" />
              <div class="range-labels"><span>0%</span><span>100%</span></div>
            </div>

            <div class="field">
              <div class="field-row">
                <label class="field-label">Taux de retour</label>
                <span class="t-mono" style="font-size:12px;color:var(--gold)">{{ returnRate }}%</span>
              </div>
              <input v-model.number="returnRate" type="range" min="0" max="53.9" step="0.1" class="ds-range" />
              <div class="range-labels"><span>0%</span><span>53.9%</span></div>
            </div>

            <div style="border-top:1px solid var(--border-divider);padding-top:12px;margin-top:4px;display:flex;flex-direction:column;gap:8px">
              <label class="toggle-row">
                <input v-model="useFocus" type="checkbox" class="ds-checkbox" />
                <span>Utiliser le focus</span>
              </label>
              <label class="toggle-row">
                <input v-model="includeConsumable" type="checkbox" class="ds-checkbox" />
                <span>Inclure la marge consommable</span>
              </label>
              <label class="toggle-row">
                <input v-model="netMargin" type="checkbox" class="ds-checkbox" />
                <span>Marge nette après taxe 4%</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main: tree + summary -->
      <div class="crafting-main">
        <!-- View toggle -->
        <div class="view-toggle-bar">
          <button :class="['ds-btn ghost sm', view === 'tree' && 'active']" @click="view = 'tree'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/></svg>
            Arbre
          </button>
          <button :class="['ds-btn ghost sm', view === 'list' && 'active']" @click="view = 'list'">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            Liste
          </button>
        </div>

        <!-- Tree view -->
        <div v-if="view === 'tree'" class="panel tree-panel">
          <div class="tree-body">
            <div v-if="!selectedItem" class="tree-empty">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3)"><path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/></svg>
              <p>Sélectionnez un item pour afficher son arbre de craft</p>
            </div>

            <template v-else>
              <!-- SVG connector lines -->
              <svg class="tree-svg" :width="treeWidth" :height="treeHeight" style="position:absolute;top:0;left:0;pointer-events:none">
                <path v-for="(c, i) in connectors" :key="i" :d="c" fill="none" stroke="var(--gold-deep)" stroke-width="1.5" stroke-dasharray="4 3" />
              </svg>

              <!-- Root node -->
              <div class="tree-node root" :style="{ left: `${treeNodes[0].x}px`, top: `${treeNodes[0].y}px` }">
                <div :class="`item-frame q-masterpiece sm`">
                  <img :src="`https://render.albiononline.com/v1/item/${selectedItem.uniqueName}.png`" :alt="selectedItem.name" />
                </div>
                <div class="tn-label">{{ selectedItem.name }}</div>
                <div class="tn-cost t-mono">{{ formatSilver(mockTree.cost) }}</div>
              </div>

              <!-- Ingredient nodes -->
              <div
                v-for="(node, i) in treeNodes.slice(1)"
                :key="i"
                class="tree-node"
                :style="{ left: `${node.x}px`, top: `${node.y}px` }"
              >
                <div class="item-frame sm" style="border-color:var(--border-divider)">
                  <img :src="`https://render.albiononline.com/v1/item/${node.id}.png`" :alt="node.label" />
                </div>
                <div class="tn-label">{{ node.label }}</div>
                <div class="tn-qty t-mono">× {{ node.qty }}</div>
              </div>
            </template>
          </div>
        </div>

        <!-- List view -->
        <div v-else class="panel">
          <div v-if="!selectedItem" style="padding:48px;text-align:center;color:var(--text-3)">
            Sélectionnez un item pour afficher sa liste de craft
          </div>
          <template v-else>
            <!-- Root item -->
            <div class="tl-row tl-head">
              <div class="tl-img">
                <img :src="`https://render.albiononline.com/v1/item/${selectedItem.uniqueName}.png`" :alt="selectedItem.name" width="32" height="32" />
              </div>
              <div class="tl-info">
                <span class="tl-name">{{ selectedItem.name }}</span>
                <span class="tl-sub">Item final · {{ quantity }}×</span>
              </div>
              <div class="tl-val t-mono">{{ formatSilver(mockTree.cost * quantity) }}</div>
            </div>

            <!-- Ingredients accordion -->
            <div v-for="(ing, i) in mockTree.ingredients" :key="i" class="tl-group">
              <div class="tl-row tl-ing" @click="toggleIng(i)">
                <div class="tl-img">
                  <img :src="`https://render.albiononline.com/v1/item/${ing.id}.png`" :alt="ing.label" width="28" height="28" />
                </div>
                <div class="tl-info">
                  <span class="tl-name">{{ ing.label }}</span>
                  <span class="tl-sub">{{ ing.type }}</span>
                </div>
                <div class="tl-qty t-mono">× {{ ing.qty * quantity }}</div>
                <div class="tl-val t-mono">{{ formatSilver(ing.price * ing.qty * quantity) }}</div>
                <svg v-if="ing.sub" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: openIngs.includes(i) ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: 'var(--text-3)' }"><path d="m6 9 6 6 6-6"/></svg>
              </div>
              <div v-if="ing.sub && openIngs.includes(i)" class="tl-sub-list">
                <div v-for="(sub, j) in ing.sub" :key="j" class="tl-row tl-sub">
                  <div class="tl-img">
                    <img :src="`https://render.albiononline.com/v1/item/${sub.id}.png`" :alt="sub.label" width="22" height="22" />
                  </div>
                  <div class="tl-info">
                    <span class="tl-name">{{ sub.label }}</span>
                    <span class="tl-sub">Matière première</span>
                  </div>
                  <div class="tl-qty t-mono">× {{ sub.qty * ing.qty * quantity }}</div>
                  <div class="tl-val t-mono">{{ formatSilver(sub.price * sub.qty * ing.qty * quantity) }}</div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Economic summary -->
        <div v-if="selectedItem" class="panel econ-panel" style="margin-top:12px">
          <div class="panel-header"><h3>Résumé économique</h3></div>
          <div class="panel-body econ-body">
            <div class="econ-stat">
              <div class="es-k">Coût matériaux</div>
              <div class="es-v t-mono">{{ formatSilver(mockTree.cost * quantity) }}</div>
            </div>
            <div class="econ-stat">
              <div class="es-k">Frais de craft</div>
              <div class="es-v t-mono">{{ formatSilver(craftFeeAmount) }}</div>
            </div>
            <div class="econ-stat">
              <div class="es-k">Coût total</div>
              <div class="es-v t-mono" style="color:var(--text-0);font-weight:600">{{ formatSilver(totalCost) }}</div>
            </div>
            <div class="econ-divider"></div>
            <div class="econ-stat">
              <div class="es-k">Prix de vente ({{ city }})</div>
              <div class="es-v t-mono">{{ formatSilver(mockSellPrice) }}</div>
            </div>
            <div class="econ-stat">
              <div class="es-k">Marge brute</div>
              <div :class="['es-v t-mono', grossMargin >= 0 ? 'pos' : 'neg']">
                {{ grossMargin >= 0 ? '+' : '' }}{{ formatSilver(grossMargin) }}
                <span style="font-size:11px;margin-left:4px">({{ marginPct.toFixed(1) }}%)</span>
              </div>
            </div>
            <div v-if="netMargin" class="econ-stat">
              <div class="es-k">Marge nette (–4% taxe)</div>
              <div :class="['es-v t-mono', netGrossMargin >= 0 ? 'pos' : 'neg']">
                {{ netGrossMargin >= 0 ? '+' : '' }}{{ formatSilver(netGrossMargin) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Shopping list -->
        <div v-if="selectedItem" class="panel" style="margin-top:12px">
          <div class="panel-header">
            <h3>Liste de courses</h3>
            <span class="t-dim" style="font-size:12px">{{ city }} · {{ quantity }}×</span>
          </div>
          <div class="shopping-grid">
            <div v-for="mat in shoppingList" :key="mat.id" class="shop-card">
              <div class="sc-img">
                <img :src="`https://render.albiononline.com/v1/item/${mat.id}.png`" :alt="mat.label" width="36" height="36" />
              </div>
              <div class="sc-name">{{ mat.label }}</div>
              <div class="sc-qty t-mono">× {{ mat.qty }}</div>
              <div class="sc-price t-mono">{{ formatSilver(mat.price) }}<span style="font-size:10px;color:var(--text-3)">/u</span></div>
              <div class="sc-total t-mono" style="color:var(--gold)">{{ formatSilver(mat.price * mat.qty) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const itemSearch = ref('')
const searchResults = ref<any[]>([])
const selectedItem = ref<any>(null)
const quantity = ref(1)
const city = ref('Caerleon')
const craftFee = ref(8.5)
const stationIP = ref(100)
const masterSpec = ref(40)
const returnRate = ref(15.2)
const useFocus = ref(false)
const includeConsumable = ref(false)
const netMargin = ref(true)
const view = ref<'tree' | 'list'>('tree')
const openIngs = ref<number[]>([])

let searchTimer: ReturnType<typeof setTimeout>

function onItemSearch() {
  clearTimeout(searchTimer)
  if (!itemSearch.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const data = await $fetch('/api/v1/items', { query: { q: itemSearch.value, limit: 6 } }) as any
      searchResults.value = (data.items || []).map((it: any) => ({
        uniqueName: it.uniqueName,
        name: it.localizations?.fr || it.localizations?.en || it.uniqueName,
        tier: it.tier,
      }))
    } catch { searchResults.value = [] }
  }, 280)
}

function selectItem(item: any) {
  selectedItem.value = item
  itemSearch.value = item.name
  searchResults.value = []
}

const qualityClass = computed(() => {
  if (!selectedItem.value) return 'normal'
  const t = selectedItem.value.tier || 1
  if (t <= 3) return 'normal'
  if (t === 4) return 'good'
  if (t === 5) return 'outstanding'
  if (t === 6) return 'excellent'
  if (t === 7) return 'masterpiece'
  return 'masterpiece'
})

// Mock tree data — would come from /api/v1/items/:id/recipe/tree
const mockTree = computed(() => ({
  cost: 185_240,
  ingredients: [
    { id: 'T8_ORE', label: 'Minerai T8', type: 'Ressource brute', qty: 16, price: 3_200, sub: null },
    { id: 'T7_METALBAR', label: 'Lingot de métal T7', type: 'Raffiné', qty: 8, price: 12_400, sub: [
      { id: 'T7_ORE', label: 'Minerai T7', qty: 4, price: 1_800 },
      { id: 'T6_METALBAR', label: 'Lingot T6', qty: 2, price: 4_200 },
    ]},
    { id: 'T8_ARTEFACT_AXE', label: 'Artefact Hache Avalonienne', type: 'Artefact', qty: 1, price: 87_000, sub: null },
    { id: 'T6_PLANKS', label: 'Planches T6', type: 'Raffiné', qty: 4, price: 2_100, sub: [
      { id: 'T6_WOOD', label: 'Bois T6', qty: 3, price: 480 },
    ]},
  ],
}))

const craftFeeAmount = computed(() => mockTree.value.cost * quantity.value * (craftFee.value / 100))
const totalCost = computed(() => mockTree.value.cost * quantity.value + craftFeeAmount.value)
const mockSellPrice = computed(() => totalCost.value * 1.18)
const grossMargin = computed(() => mockSellPrice.value - totalCost.value)
const marginPct = computed(() => (grossMargin.value / totalCost.value) * 100)
const netGrossMargin = computed(() => grossMargin.value * 0.96)

const shoppingList = computed(() => {
  if (!selectedItem.value) return []
  return mockTree.value.ingredients.flatMap((ing: any) => {
    if (ing.sub) return ing.sub.map((s: any) => ({ ...s, qty: s.qty * ing.qty * quantity.value }))
    return [{ id: ing.id, label: ing.label, qty: ing.qty * quantity.value, price: ing.price }]
  })
})

function toggleIng(i: number) {
  const idx = openIngs.value.indexOf(i)
  if (idx === -1) openIngs.value.push(i)
  else openIngs.value.splice(idx, 1)
}

function formatSilver(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1) + 'k'
  return Math.round(v).toLocaleString('fr-FR')
}

// Tree positioning (static demo layout)
const treeWidth = 520
const treeHeight = 340

const treeNodes = computed(() => {
  if (!selectedItem.value) return []
  const ings = mockTree.value.ingredients
  const rootX = treeWidth / 2 - 50
  const nodes = [{ x: rootX, y: 20, id: selectedItem.value.uniqueName, label: selectedItem.value.name, qty: quantity.value }]
  const spacing = treeWidth / (ings.length + 1)
  ings.forEach((ing: any, i: number) => {
    nodes.push({ x: spacing * (i + 1) - 50, y: 200, id: ing.id, label: ing.label, qty: ing.qty })
  })
  return nodes
})

const connectors = computed(() => {
  if (treeNodes.value.length < 2) return []
  const root = treeNodes.value[0]
  const cx = root.x + 50
  const cy = root.y + 70
  return treeNodes.value.slice(1).map(node => {
    const nx = node.x + 50
    const ny = node.y
    const midY = (cy + ny) / 2
    return `M ${cx} ${cy} C ${cx} ${midY}, ${nx} ${midY}, ${nx} ${ny}`
  })
})
</script>
