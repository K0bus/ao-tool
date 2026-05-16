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
              <button class="ds-btn ghost sm" @click="openAddBuilding">Ajouter un bâtiment</button>
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
          <!-- Building Cards -->
          <div 
            v-for="building in island.buildings" 
            :key="building.id" 
            class="plot-card panel framed"
            :class="getBuildingClass(building)"
            @click="openEditBuilding(building)"
          >
            <div class="plot-header">
              <span class="plot-type">{{ building.building?.name || 'Bâtiment' }}</span>
              <span class="plot-tier t-dim">T{{ building.tier || '?' }}</span>
              <div class="plot-actions" @click.stop>
                 <button class="ds-btn ghost xs icon-only danger" @click="deleteBuilding(building.id)">
                   <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                 </button>
              </div>
            </div>
            
            <div class="plot-content">
               <div class="b-visual-main">
                  <img v-if="building.buildingIcon" :src="building.buildingIcon" class="b-icon-img" />
                  <div v-else class="b-placeholder">T{{ building.tier }}</div>
               </div>
               
               <div class="b-status-area">
                  <!-- Resources List (Summary) -->
                  <div v-if="building.resources.length > 0" class="mini-resources">
                     <div v-for="res in building.resources.slice(0, 3)" :key="res.id" class="mini-res">
                        <AoItemImage :unique-name="res.itemId" size="xs" />
                        <span>x{{ res.count }}</span>
                     </div>
                     <span v-if="building.resources.length > 3" class="t-dim">...</span>
                  </div>
                  <div v-else class="t-dim" style="font-size: 11px">Aucune production</div>

                  <div v-if="building.nutrition !== null" class="nut-status">
                     <div class="nut-bar"><div class="nut-fill" :style="{ width: building.nutrition + '%' }"></div></div>
                     <span style="font-size: 9px">{{ building.nutrition }}% nut.</span>
                  </div>
               </div>
            </div>

            <div class="plot-footer">
               <span class="t-success" v-if="getBuildingProfit(building.id) > 0">
                 +{{ Math.round(getBuildingProfit(building.id)).toLocaleString() }} silver
               </span>
               <span class="t-gold" v-else>Gérer →</span>
            </div>
          </div>

          <!-- Add Building Placeholder -->
          <div class="plot-card panel framed building is-empty" @click="openAddBuilding">
             <div class="empty-plot">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>
                <span>Ajouter un bâtiment</span>
             </div>
          </div>
        </div>

        <div class="island-sidebar">
          <div class="panel parchment framed">
            <div class="panel-header"><h3>Résumé de production</h3></div>
            <div class="panel-body">
              <div class="sidebar-stat">
                <span class="label">Profit total</span>
                <span class="val t-success">{{ island.profitability?.totalNetProfit.toLocaleString() }} silver</span>
              </div>
              <div class="sidebar-stat">
                <span class="label">Bâtiments</span>
                <span class="val">{{ island.buildings.length }}</span>
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

    <!-- Modals -->
    
    <!-- Building & Resource Management Modal -->
    <div v-if="activeBuilding" class="modal-overlay" @click.self="activeBuilding = null">
      <div class="modal panel parchment framed">
        <div class="modal-header">
          <h3>Gérer {{ activeBuilding.building?.name || 'le bâtiment' }}</h3>
          <button class="close-btn" @click="activeBuilding = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="b-mgmt-header">
             <img v-if="activeBuilding.buildingIcon" :src="activeBuilding.buildingIcon" style="width: 48px" />
             <div class="b-mgmt-title">
                <strong>{{ activeBuilding.building?.name }}</strong>
                <span class="t-dim">Tier {{ activeBuilding.tier }}</span>
             </div>
          </div>

          <div class="form-group" style="margin-top: 20px">
            <label>Nutrition (%)</label>
            <div class="nut-input-row">
               <input v-model.number="activeBuilding.nutrition" type="number" class="ds-input" min="0" max="100" @change="updateBuildingNutrition" />
               <div class="nut-bar-lg"><div class="nut-fill" :style="{ width: activeBuilding.nutrition + '%' }"></div></div>
            </div>
          </div>

          <div v-if="isAgricultural(activeBuilding)" class="mgmt-resources">
             <div class="section-header">
                <h4>Productions ({{ activeBuilding.resources.length }}/9 slots)</h4>
                <button class="ds-btn gold xs" @click="showAddResource = true" :disabled="activeBuilding.resources.length >= 9">+ Ajouter</button>
             </div>

             <div class="res-list-mgmt">
                <div v-for="res in activeBuilding.resources" :key="res.id" class="res-mgmt-item">
                   <AoItemImage :unique-name="res.itemId" size="sm" />
                   <div class="res-m-info">
                      <div class="res-m-name">{{ res.itemName }} <span class="t-dim">x{{ res.count }}</span></div>
                      <div class="res-m-status">{{ getGrowthText(res) }}</div>
                   </div>
                   <button class="ds-btn ghost xs danger icon-only" @click="deleteResource(res.id)">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                   </button>
                </div>
             </div>

             <!-- Add Resource Mini Form -->
             <div v-if="showAddResource" class="add-res-inline panel framed">
                <div class="form-group">
                   <label>Rechercher une plante / animal</label>
                   <input v-model="itemSearch" type="text" class="ds-input" placeholder="Ex: Carottes..." @input="onItemSearch" />
                   <div v-if="searchResults.length > 0" class="inline-results">
                      <div v-for="item in searchResults" :key="item.uniqueName" class="inline-res-item" @click="addResource(item)">
                         <AoItemImage :unique-name="item.uniqueName" size="xs" />
                         <span>{{ item.name }} (T{{ item.tier }})</span>
                      </div>
                   </div>
                </div>
                <button class="ds-btn ghost xs" @click="showAddResource = false">Annuler</button>
             </div>
          </div>

          <div class="modal-actions">
            <button class="ds-btn danger ghost sm" @click="deleteBuilding(activeBuilding.id)">Détruire le bâtiment</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Building Modal -->
    <div v-if="showAddBuildingModal" class="modal-overlay" @click.self="showAddBuildingModal = false">
      <div class="modal panel parchment framed">
        <div class="modal-header">
          <h3>Ajouter un bâtiment</h3>
          <button class="close-btn" @click="showAddBuildingModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Rechercher dans le menu de construction</label>
            <input v-model="buildingSearch" type="text" class="ds-input" placeholder="Ex: Ferme, Forge..." @input="onBuildingSearch" />
            
            <div v-if="buildingResults.length > 0" class="search-results-list" style="margin-top: 12px">
              <div v-for="b in buildingResults" :key="b.id" class="search-result-item" @click="createBuilding(b)">
                <img v-if="b.uiBuildMenuTexture" :src="`/game_assets/${b.uiBuildMenuTexture.toLowerCase()}.png`" style="width: 32px" />
                <div class="sr-meta">
                  <span class="sr-name">{{ b.name }}</span>
                  <span class="sr-tier t-dim">T{{ b.tier }} • {{ b.type }}</span>
                </div>
              </div>
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

const showIslandEdit = ref(false)
const showAddBuildingModal = ref(false)
const activeBuilding = ref<any>(null)
const showAddResource = ref(false)

const buildingSearch = ref('')
const buildingResults = ref<any[]>([])
const searchingBuildings = ref(false)

const itemSearch = ref('')
const searchResults = ref<any[]>([])
const searchingItems = ref(false)

let searchTimeout: any = null

function isAgricultural(building: any) {
  const type = building.building?.id || ''
  return ['FARM', 'HERB_GARDEN', 'PASTURE', 'KENNEL'].some(t => type.includes(t)) || building.building?.type === 'farmbuilding'
}

function getBuildingClass(building: any) {
  const type = building.building?.id?.toLowerCase() || ''
  if (type.includes('farm')) return 'farm'
  if (type.includes('herb')) return 'herb_garden'
  if (type.includes('pasture')) return 'pasture'
  if (type.includes('kennel')) return 'kennel'
  return 'building'
}

function getBuildingProfit(buildingId: string) {
  if (!island.value?.profitability) return 0
  const b = island.value.profitability.buildings.find((b: any) => b.buildingId === buildingId)
  return b?.totalNetProfit ?? 0
}

function openAddBuilding() {
  buildingSearch.value = ''
  buildingResults.value = []
  showAddBuildingModal.value = true
}

function openEditBuilding(building: any) {
  activeBuilding.value = { ...building }
  showAddResource.value = false
}

async function onBuildingSearch() {
  if (buildingSearch.value.length < 2) {
    buildingResults.value = []
    return
  }
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    searchingBuildings.value = true
    try {
      const resp = await $fetch('/api/v1/buildings', { params: { q: buildingSearch.value, limit: 10 } })
      buildingResults.value = (resp as any).data
    } catch (err) {
      console.error(err)
    } finally {
      searchingBuildings.value = false
    }
  }, 300)
}

async function createBuilding(b: any) {
  try {
    await $fetch(`/api/v1/islands/${id}/buildings`, {
      method: 'POST',
      body: { buildingId: b.id, level: b.tier }
    })
    showAddBuildingModal.value = false
    await refresh()
  } catch (err) {
    console.error(err)
  }
}

async function updateBuildingNutrition() {
  if (!activeBuilding.value) return
  try {
    await $fetch(`/api/v1/buildings/${activeBuilding.value.id}`, {
      method: 'PATCH',
      body: { nutrition: activeBuilding.value.nutrition }
    })
    await refresh()
  } catch (err) {
    console.error(err)
  }
}

async function deleteBuilding(buildingId: string) {
  if (!confirm('Détruire ce bâtiment ?')) return
  try {
    await $fetch(`/api/v1/buildings/${buildingId}`, { method: 'DELETE' })
    activeBuilding.value = null
    await refresh()
  } catch (err) {
    console.error(err)
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
      const resp = await $fetch('/api/v1/items', { params: { itemType: 'FARMABLE', q: itemSearch.value, limit: 5 } })
      searchResults.value = (resp as any).data
    } catch (err) {
      console.error(err)
    } finally {
      searchingItems.value = false
    }
  }, 300)
}

async function addResource(item: any) {
  if (!activeBuilding.value) return
  try {
    await $fetch(`/api/v1/buildings/${activeBuilding.value.id}/resources`, {
      method: 'POST',
      body: { itemId: item.uniqueName, count: 9, plantedAt: new Date().toISOString() }
    })
    showAddResource.value = false
    itemSearch.value = ''
    searchResults.value = []
    await refresh()
    // Update activeBuilding with new data
    const updated = island.value.buildings.find((b: any) => b.id === activeBuilding.value.id)
    if (updated) activeBuilding.value = { ...updated }
  } catch (err) {
    console.error(err)
  }
}

async function deleteResource(resId: string) {
  try {
    await $fetch(`/api/v1/resources/${resId}`, { method: 'DELETE' })
    await refresh()
    const updated = island.value.buildings.find((b: any) => b.id === activeBuilding.value.id)
    if (updated) activeBuilding.value = { ...updated }
  } catch (err) {
    console.error(err)
  }
}

function getGrowthPercent(res: any) {
  if (!res.plantedAt) return 0
  const elapsed = Date.now() - new Date(res.plantedAt).getTime()
  return Math.min(100, Math.max(0, (elapsed / (22 * 60 * 60 * 1000)) * 100))
}

function getGrowthText(res: any) {
  const p = getGrowthPercent(res)
  return p >= 100 ? 'Prêt !' : `${Math.round(p)}%`
}

const upcomingEvents = computed(() => {
  const events: any[] = []
  if (!island.value?.buildings) return []
  for (const b of island.value.buildings) {
    for (const res of b.resources) {
      if (res.plantedAt) {
        const readyAt = new Date(new Date(res.plantedAt).getTime() + 22 * 60 * 60 * 1000)
        if (readyAt > new Date()) {
          events.push({
            id: res.id,
            label: `${res.itemName} (x${res.count})`,
            time: readyAt,
            timeText: formatRelative(readyAt)
          })
        }
      }
    }
  }
  return events.sort((a, b) => a.time.getTime() - b.time.getTime()).slice(0, 5)
})

function formatRelative(date: Date) {
  const diff = date.getTime() - Date.now()
  const hrs = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return hrs > 0 ? `dans ${hrs}h ${mins}m` : `dans ${mins}m`
}

definePageMeta({ layout: 'default' })
</script>

<style scoped>
.header-title-row { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
.back-link { display: flex; align-items: center; gap: 8px; color: var(--text-3); font-size: 13px; text-decoration: none; margin-bottom: 12px; }
.back-link:hover { color: var(--gold); }
.header-meta { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.island-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; margin-top: 32px; }
.plots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; align-content: flex-start; }
.plot-card { min-height: 180px; display: flex; flex-direction: column; padding: 16px; cursor: pointer; transition: all 0.2s; }
.plot-card:hover { transform: translateY(-4px); border-color: var(--gold); }
.plot-header { display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; }
.plot-type { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-2); font-weight: 700; }
.plot-tier { font-size: 11px; }
.plot-content { flex: 1; display: flex; gap: 12px; align-items: center; }
.b-visual-main { width: 50px; height: 50px; background: rgba(0,0,0,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.b-icon-img { width: 100%; height: 100%; object-fit: contain; }
.b-placeholder { color: var(--gold); font-weight: 700; }
.b-status-area { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.mini-resources { display: flex; gap: 4px; flex-wrap: wrap; }
.mini-res { display: flex; align-items: center; gap: 2px; font-size: 9px; background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 4px; }
.nut-status { display: flex; align-items: center; gap: 6px; }
.nut-bar, .nut-bar-lg { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
.nut-bar-lg { height: 8px; }
.nut-fill { height: 100%; background: var(--info); border-radius: 2px; }
.plot-footer { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; font-weight: 600; text-align: right; }
.is-empty { border-style: dashed; opacity: 0.6; justify-content: center; align-items: center; }
.empty-plot { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-3); }

/* Sidebar */
.sidebar-stat { display: flex; justify-content: space-between; margin-bottom: 12px; }
.sidebar-stat .label { color: var(--text-3); font-size: 13px; }
.sidebar-stat .val { font-weight: 600; font-family: var(--font-mono); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal { width: 100%; max-width: 500px; }
.modal-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; }
.modal-body { padding: 24px; }
.b-mgmt-header { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; }
.b-mgmt-title { display: flex; flex-direction: column; }
.nut-input-row { display: flex; align-items: center; gap: 12px; }
.mgmt-resources { margin-top: 24px; border-top: 1px solid var(--border-divider); padding-top: 24px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.res-list-mgmt { display: flex; flex-direction: column; gap: 8px; }
.res-mgmt-item { display: flex; align-items: center; gap: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 8px; }
.res-m-info { flex: 1; }
.res-m-name { font-size: 13px; font-weight: 600; }
.res-m-status { font-size: 11px; color: var(--text-3); }
.add-res-inline { margin-top: 12px; padding: 12px; }
.inline-results { margin-top: 8px; background: var(--bg-1); border-radius: 4px; overflow: hidden; }
.inline-res-item { padding: 6px 12px; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.inline-res-item:hover { background: rgba(255,255,255,0.05); }

/* Colors */
.farm { border-left: 4px solid #84cc16; }
.herb_garden { border-left: 4px solid #a855f7; }
.pasture { border-left: 4px solid #f59e0b; }
.kennel { border-left: 4px solid #ef4444; }
</style>
