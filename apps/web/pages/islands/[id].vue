<template>
  <div class="page island-detail">
    <div v-if="pending" class="skel-loader">
      <div class="skel" style="height: 40px; width: 200px; margin-bottom: 20px"></div>
      <div class="grid-layout skel" style="height: 500px"></div>
    </div>

    <template v-else-if="island">
      <div class="page-header">
        <NuxtLink to="/islands" class="back-link">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Retour aux îles
        </NuxtLink>
        <div class="header-main">
          <div class="header-title-row">
            <h1 class="t-display">{{ island.name }}</h1>
            <div class="header-actions">
              <button class="ds-btn ghost sm" @click="showIslandEdit = true">Modifier</button>
            </div>
          </div>
          <div class="header-meta">
            <span class="tag gold sm">Niv. {{ island.level }}</span>
            <span class="t-dim">•</span>
            <span class="t-muted">{{ island.location?.name }}</span>
            <span class="t-dim">•</span>
            <span class="t-success" v-if="island.profitability">
              Profit estimé : {{ island.profitability.totalNetProfit.toLocaleString() }} silver/cycle
            </span>
          </div>
        </div>
      </div>

      <div class="island-layout">
        <div class="plots-grid">
          <div 
            v-for="plot in plots" 
            :key="plot.id" 
            class="plot-card panel framed"
            :class="[plot.type.toLowerCase(), { 'is-empty': !plot.plantedItemId && plot.type === 'BUILDING' }]"
            @click="openPlotAction(plot)"
          >
            <div class="plot-header">
              <span class="plot-type">{{ formatPlotType(plot.type) }}</span>
              <span class="plot-pos">#{{ plot.position + 1 }}</span>
            </div>
            
            <div class="plot-content">
              <!-- Agricultural Content (Farm, Herb, Pasture, Kennel) -->
              <template v-if="isAgricultural(plot.type)">
                <template v-if="plot.plantedItemId">
                  <div class="item-visual">
                    <AoItemImage :unique-name="plot.plantedItemId" :display-name="plot.itemName" />
                  </div>
                  <div class="item-info">
                    <h4>{{ plot.itemName }}</h4>
                    <div class="status-indicator">
                      <div class="growth-bar">
                        <div class="bar-fill" :style="{ width: getGrowthPercent(plot) + '%' }"></div>
                      </div>
                      <span class="t-dim" style="font-size: 10px">{{ getGrowthText(plot) }}</span>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="empty-plot">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    <span>Planter</span>
                  </div>
                </template>
              </template>

              <!-- Building Content (House, Crafting, Refining) -->
              <template v-else>
                <div class="building-visual">
                  <div class="b-icon">
                    <svg v-if="plot.type === 'HOUSE'" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <svg v-else-if="plot.type === 'CRAFTING'" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/></svg>
                    <svg v-else viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/></svg>
                  </div>
                  <div class="b-info">
                    <h4>{{ plot.type === 'BUILDING' ? 'Emplacement vide' : formatPlotType(plot.type) }}</h4>
                    <span class="t-dim" style="font-size: 11px">Niveau {{ plot.level }}</span>
                    <div v-if="plot.nutrition !== null" class="nutrition-status">
                      <div class="nut-bar">
                        <div class="nut-fill" :style="{ width: plot.nutrition + '%' }"></div>
                      </div>
                      <span style="font-size: 9px">Nourriture: {{ plot.nutrition }}%</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div class="plot-footer">
              <template v-if="isAgricultural(plot.type) && plot.plantedItemId">
                <span class="t-success">+{{ Math.round(island.profitability?.plots[plot.position]?.netProfit ?? 0).toLocaleString() }} silver</span>
              </template>
              <template v-else-if="plot.type === 'HOUSE'">
                <span class="t-dim">{{ plot.laborers?.length ?? 0 }} travailleurs</span>
              </template>
              <template v-else-if="plot.type === 'BUILDING'">
                <span class="t-gold">Construire →</span>
              </template>
            </div>
          </div>
        </div>

        <div class="island-sidebar">
          <div class="panel parchment framed">
            <div class="panel-header"><h3>Résumé de production</h3></div>
            <div class="panel-body">
              <div class="sidebar-stat">
                <span class="label">Profit total</span>
                <span class="val t-success">{{ island.profitability?.totalNetProfit.toLocaleString() }}</span>
              </div>
              <div class="sidebar-stat">
                <span class="label">Parcelles agricoles</span>
                <span class="val">{{ island.plots.filter((p: any) => isAgricultural(p.type)).length }}</span>
              </div>
              <div class="sidebar-stat">
                <span class="label">Bâtiments</span>
                <span class="val">{{ island.plots.filter((p: any) => !isAgricultural(p.type) && p.type !== 'BUILDING').length }}</span>
              </div>
            </div>
          </div>

          <div class="panel parchment framed" style="margin-top: 16px">
            <div class="panel-header"><h3>Prochaines échéances</h3></div>
            <div class="panel-body">
              <div v-if="upcomingEvents.length === 0" class="t-dim" style="font-size: 13px">Rien de prévu prochainement.</div>
              <div v-else class="event-list">
                <div v-for="event in upcomingEvents" :key="event.id" class="event-item">
                  <span class="event-time">{{ event.timeText }}</span>
                  <span class="event-label">{{ event.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Plot Action Modal -->
    <div v-if="activePlot" class="modal-overlay" @click.self="activePlot = null">
      <div class="modal panel parchment framed">
        <div class="modal-header">
          <h3>{{ activePlot.type === 'BUILDING' ? 'Construire sur la parcelle' : 'Gérer la parcelle' }} #{{ activePlot.position + 1 }}</h3>
          <button class="close-btn" @click="activePlot = null">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Build Selection for empty plots -->
          <div v-if="activePlot.type === 'BUILDING'" class="build-options">
            <div v-for="type in availableBuildTypes" :key="type.id" class="build-opt" @click="updatePlotType(type.id)">
              <div class="opt-icon" v-html="type.icon"></div>
              <div class="opt-meta">
                <div class="opt-title">{{ type.name }}</div>
                <div class="opt-desc">{{ type.desc }}</div>
              </div>
            </div>
          </div>

          <!-- Management for existing buildings -->
          <div v-else class="manage-options">
            <div class="form-group">
              <label>Changer le type de bâtiment</label>
              <select :value="activePlot.type" class="ds-select" @change="(e: any) => updatePlotType((e.target as HTMLSelectElement).value)">
                <option v-for="t in allPlotTypes" :key="t" :value="t">{{ formatPlotType(t) }}</option>
              </select>
            </div>
            
            <div v-if="isAgricultural(activePlot.type)" class="agri-manage">
              <div class="form-group">
                <label>Plante / Animal</label>
                <div class="item-search-wrap">
                  <input 
                    v-model="itemSearch" 
                    type="text" 
                    class="ds-input" 
                    placeholder="Rechercher une plante ou un animal..." 
                    @input="onItemSearch"
                  />
                  <div v-if="searchingItems" class="search-loader">Chargement...</div>
                </div>

                <!-- Search Results -->
                <div v-if="searchResults.length > 0" class="search-results-list">
                  <div 
                    v-for="item in searchResults" 
                    :key="item.uniqueName" 
                    class="search-result-item"
                    @click="plantItem(item.uniqueName)"
                  >
                    <AoItemImage :unique-name="item.uniqueName" :display-name="item.name" style="width: 32px; height: 32px" />
                    <div class="sr-meta">
                      <span class="sr-name">{{ item.name }}</span>
                      <span class="sr-tier t-dim">T{{ item.tier }}</span>
                    </div>
                  </div>
                </div>
                <div v-else-if="itemSearch.length >= 2 && !searchingItems" class="t-dim" style="font-size: 12px; margin-top: 8px">
                  Aucun résultat trouvé.
                </div>
              </div>

              <div v-if="activePlot.plantedItemId" class="current-planted">
                <label>Actuellement planté</label>
                <div class="cp-info">
                  <AoItemImage :unique-name="activePlot.plantedItemId" :display-name="activePlot.itemName" style="width: 32px; height: 32px" />
                  <span>{{ activePlot.itemName }}</span>
                  <button class="ds-btn ghost sm danger" @click="plantItem(null)">Réinitialiser</button>
                </div>
              </div>
            </div>

            <div v-if="activePlot.type === 'HOUSE'" class="house-manage">
              <p>Gestion des travailleurs coming soon...</p>
            </div>

            <div class="modal-actions">
              <button class="ds-btn danger ghost sm" @click="updatePlotType('BUILDING')">Détruire le bâtiment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: islandRaw, pending, refresh } = await useFetch(`/api/v1/islands/${id}`)
const island = computed(() => (islandRaw.value as any)?.data ?? null)
const plots = computed(() => island.value?.plots ?? [])

const activePlot = ref<any>(null)
const showIslandEdit = ref(false)

const itemSearch = ref('')
const searchResults = ref<any[]>([])
const searchingItems = ref(false)
let searchTimeout: any = null

const allPlotTypes = ['FARM', 'HERB_GARDEN', 'PASTURE', 'KENNEL', 'HOUSE', 'REFINING', 'CRAFTING', 'BUILDING']

const availableBuildTypes = [
  { id: 'FARM', name: 'Ferme', desc: 'Pour cultiver des légumes et céréales.', icon: '🌾' },
  { id: 'HERB_GARDEN', name: 'Jardin aromatique', desc: 'Pour cultiver des herbes alchimiques.', icon: '🌿' },
  { id: 'PASTURE', name: 'Pâturage', desc: 'Pour élever du bétail.', icon: '🐄' },
  { id: 'KENNEL', name: 'Chenil', desc: 'Pour élever des montures.', icon: '🐺' },
  { id: 'HOUSE', name: 'Maison', desc: 'Pour loger des travailleurs.', icon: '🏠' },
  { id: 'REFINING', name: 'Atelier de raffinage', desc: 'Scierie, Fonderie, etc.', icon: '⚒️' },
  { id: 'CRAFTING', name: 'Atelier de craft', desc: 'Forge, Tour de mage, etc.', icon: '⚔️' },
]

function isAgricultural(type: string) {
  return ['FARM', 'HERB_GARDEN', 'PASTURE', 'KENNEL'].includes(type)
}

function formatPlotType(type: string) {
  const map: Record<string, string> = {
    'FARM': 'Ferme',
    'HERB_GARDEN': 'Jardin aromatique',
    'PASTURE': 'Pâturage',
    'KENNEL': 'Chenil',
    'HOUSE': 'Maison',
    'REFINING': 'Raffinage',
    'CRAFTING': 'Crafting',
    'BUILDING': 'Parcelle'
  }
  return map[type] || type
}

function openPlotAction(plot: any) {
  activePlot.value = { ...plot }
  itemSearch.value = ''
  searchResults.value = []
}

async function updatePlotType(newType: string) {
  if (!activePlot.value) return
  
  try {
    await $fetch(`/api/v1/plots/${activePlot.value.id}`, {
      method: 'PATCH',
      body: { type: newType, plantedItemId: null, plantedAt: null }
    })
    activePlot.value = null
    await refresh()
  } catch (err) {
    console.error('Failed to update plot:', err)
  }
}

async function onItemSearch() {
  if (itemSearch.value.length < 2) {
    searchResults.value = []
    return
  }

  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    searchingItems.value = true
    try {
      const resp = await $fetch('/api/v1/items', {
        params: {
          itemType: 'FARMABLE',
          q: itemSearch.value,
          limit: 10
        }
      })
      searchResults.value = (resp as any).data
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      searchingItems.value = false
    }
  }, 300)
}

async function plantItem(itemUniqueName: string | null) {
  if (!activePlot.value) return

  try {
    await $fetch(`/api/v1/plots/${activePlot.value.id}`, {
      method: 'PATCH',
      body: { 
        plantedItemId: itemUniqueName,
        plantedAt: itemUniqueName ? new Date().toISOString() : null
      }
    })
    activePlot.value = null
    await refresh()
  } catch (err) {
    console.error('Planting failed:', err)
  }
}

function getGrowthPercent(plot: any) {
  if (!plot.plantedAt) return 0
  const total = 22 * 60 * 60 * 1000 // 22h
  const elapsed = Date.now() - new Date(plot.plantedAt).getTime()
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

function getGrowthText(plot: any) {
  const percent = getGrowthPercent(plot)
  if (percent >= 100) return 'Prêt !'
  return `En croissance (${Math.round(percent)}%)`
}

const upcomingEvents = computed(() => {
  const events = []
  if (!plots.value) return []
  for (const plot of plots.value) {
    if (plot.plantedAt) {
      const readyAt = new Date(new Date(plot.plantedAt).getTime() + 22 * 60 * 60 * 1000)
      if (readyAt > new Date()) {
        events.push({
          id: plot.id,
          label: `Récolte: ${plot.itemName}`,
          time: readyAt,
          timeText: formatRelative(readyAt)
        })
      }
    }
  }
  return events.sort((a, b) => a.time.getTime() - b.time.getTime()).slice(0, 5)
})

function formatRelative(date: Date) {
  const diff = date.getTime() - Date.now()
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hrs > 0) return `dans ${hrs}h ${mins}m`
  return `dans ${mins}m`
}

definePageMeta({ layout: 'default' })
</script>

<style scoped>
.header-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-3);
  font-size: 13px;
  text-decoration: none;
  margin-bottom: 12px;
}

.back-link:hover {
  color: var(--gold);
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.island-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  margin-top: 32px;
}

.plots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-content: flex-start;
}

.plot-card {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.plot-card:hover {
  transform: translateY(-4px);
  border-color: var(--gold);
  box-shadow: 0 12px 24px rgba(0,0,0,0.4);
}

.plot-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.plot-type {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
}

.plot-pos {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-3);
}

.plot-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-visual, .building-visual {
  width: 60px;
  height: 60px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.building-visual {
  flex: 1;
  background: none;
  justify-content: flex-start;
}

.b-icon {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: var(--gold);
}

.item-info h4, .b-info h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
}

.status-indicator {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.growth-bar, .nut-bar {
  width: 100px;
  height: 5px;
  background: rgba(255,255,255,0.05);
  border-radius: 3px;
}

.bar-fill, .nut-fill {
  height: 100%;
  background: var(--success);
  border-radius: 3px;
}

.nut-fill {
  background: var(--info);
}

.empty-plot {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-3);
  opacity: 0.6;
}

.plot-footer {
  margin-top: 10px;
  font-size: 11px;
  font-weight: 600;
  text-align: right;
}

/* Border colors by type */
.farm { border-left: 4px solid #84cc16; }
.herb_garden { border-left: 4px solid #a855f7; }
.pasture { border-left: 4px solid #f59e0b; }
.kennel { border-left: 4px solid #ef4444; }
.house { border-left: 4px solid #3b82f6; }
.refining { border-left: 4px solid #06b6d4; }
.crafting { border-left: 4px solid #f97316; }
.building { border-left: 4px solid #475569; border-style: dashed; }

.sidebar-stat {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sidebar-stat .label {
  color: var(--text-3);
  font-size: 13px;
}

.sidebar-stat .val {
  font-weight: 600;
  font-family: var(--font-mono);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 500px;
  padding: 0;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 24px;
}

.build-options {
  display: grid;
  gap: 12px;
}

.build-opt {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.build-opt:hover {
  background: rgba(201, 161, 74, 0.08);
  border-color: var(--gold);
}

.opt-icon {
  font-size: 24px;
  margin-right: 16px;
  width: 40px;
  text-align: center;
}

.opt-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}

.opt-desc {
  font-size: 12px;
  color: var(--text-3);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-2);
  margin-bottom: 8px;
}

.item-search-wrap {
  position: relative;
}

.search-loader {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: var(--gold);
}

.search-results-list {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-divider);
  border-radius: var(--radius);
  background: var(--bg-1);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:hover {
  background: rgba(201, 161, 74, 0.08);
}

.sr-meta {
  display: flex;
  flex-direction: column;
}

.sr-name {
  font-size: 13px;
  font-weight: 500;
}

.sr-tier {
  font-size: 11px;
}

.current-planted {
  margin-top: 24px;
  padding: 16px;
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius);
}

.cp-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.modal-actions {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.event-list {
  display: grid;
  gap: 10px;
}

.event-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
}

.event-time {
  font-size: 10px;
  color: var(--gold);
  font-weight: 600;
}

.event-label {
  font-size: 12px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-3);
  font-size: 24px;
  cursor: pointer;
}
</style>
