<template>
  <div class="page islands-dashboard">
    <div class="page-header">
      <div>
        <h1 class="t-display">Mes Îles</h1>
        <p class="t-muted">Gérez vos productions agricoles et d'élevage.</p>
      </div>
      <button class="ds-btn primary" @click="showCreateModal = true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M12 5v14M5 12h14"/></svg>
        Nouvelle Île
      </button>
    </div>

    <div v-if="pending" class="grid-loading">
      <div v-for="i in 3" :key="i" class="panel skel" style="height: 180px"></div>
    </div>

    <div v-else-if="islands.length === 0" class="empty-state">
      <div class="empty-icon">🏝️</div>
      <h3>Aucune île enregistrée</h3>
      <p>Commencez par ajouter votre île personnelle ou de guilde pour suivre vos récoltes.</p>
      <button class="ds-btn" @click="showCreateModal = true">Ajouter une île</button>
    </div>

    <div v-else class="islands-grid">
      <NuxtLink v-for="island in islands" :key="island.id" :to="`/islands/${island.id}`" class="island-card panel parchment framed">
        <div class="ic-header">
          <div class="ic-title">
            <h3>{{ island.name }}</h3>
            <span class="tag gold sm">Niv. {{ island.level }}</span>
          </div>
          <span class="tag sm" :class="island.type === 'PERSONAL' ? 'info' : 'success'">
            {{ island.type === 'PERSONAL' ? 'Personnelle' : 'Guilde' }}
          </span>
        </div>
        
        <div class="ic-body">
          <div class="ic-stat">
            <span class="label">Localisation</span>
            <span class="val">{{ island.location?.name ?? 'Inconnue' }}</span>
          </div>
          <div class="ic-stat">
            <span class="label">Bâtiments</span>
            <span class="val">{{ island._count?.buildings ?? 0 }}</span>
          </div>
        </div>

        <div class="ic-footer">
          <span>Voir détails</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </div>
      </NuxtLink>
    </div>

    <!-- Create Modal Placeholder -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal panel parchment framed">
        <div class="modal-header">
          <h3>Nouvelle Île</h3>
          <button class="close-btn" @click="showCreateModal = false">&times;</button>
        </div>
        <form class="modal-body" @submit.prevent="createIsland">
          <div class="form-group">
            <label>Nom de l'île</label>
            <input v-model="form.name" type="text" class="ds-input" placeholder="Ex: Île de Kaamelott" required />
          </div>
          <div class="form-group">
            <label>Ville de rattachement</label>
            <select v-model="form.locationId" class="ds-select" required>
              <option value="Caerleon">Caerleon</option>
              <option value="Bridgewatch">Bridgewatch</option>
              <option value="FortSterling">Fort Sterling</option>
              <option value="Lymhurst">Lymhurst</option>
              <option value="Martlock">Martlock</option>
              <option value="Thetford">Thetford</option>
              <option value="Brecilien">Brecilien</option>
            </select>
          </div>
          <div class="form-group">
            <label>Type</label>
            <div class="radio-group">
              <label><input v-model="form.type" type="radio" value="PERSONAL" /> Personnelle</label>
              <label><input v-model="form.type" type="radio" value="GUILD" /> Guilde</label>
            </div>
          </div>
          <div class="form-group">
            <label>Niveau (1-6)</label>
            <input v-model.number="form.level" type="number" class="ds-input" min="1" max="6" required />
          </div>
          <div class="modal-footer">
            <button type="button" class="ds-btn ghost" @click="showCreateModal = false">Annuler</button>
            <button type="submit" class="ds-btn primary" :disabled="creating">
              {{ creating ? 'Création...' : 'Confirmer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { data: islandsRaw, pending, refresh } = await useFetch('/api/v1/islands')
const islands = computed(() => (islandsRaw.value as any)?.data ?? [])

const showCreateModal = ref(false)
const creating = ref(false)
const form = ref({
  name: '',
  locationId: 'Caerleon',
  type: 'PERSONAL',
  level: 6
})

async function createIsland() {
  creating.value = true
  try {
    await $fetch('/api/v1/islands', {
      method: 'POST',
      body: form.value
    })
    showCreateModal.value = false
    await refresh()
    form.value = { name: '', locationId: 'Caerleon', type: 'PERSONAL', level: 6 }
  } catch (err) {
    console.error('Failed to create island:', err)
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.islands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.island-card {
  display: flex;
  flex-direction: column;
  padding: 24px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.island-card:hover {
  transform: translateY(-4px);
  border-color: var(--gold);
  box-shadow: 0 12px 24px rgba(0,0,0,0.4);
}

.ic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.ic-title h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
}

.ic-body {
  flex: 1;
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.ic-stat {
  display: flex;
  flex-direction: column;
}

.ic-stat .label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-3);
  letter-spacing: 0.05em;
}

.ic-stat .val {
  font-size: 14px;
  font-weight: 600;
}

.ic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--gold);
  font-weight: 600;
  border-top: 1px solid rgba(255,255,255,0.05);
  padding-top: 12px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: var(--radius);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 450px;
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

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-group label {
  text-transform: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.modal-footer {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-3);
  font-size: 24px;
  cursor: pointer;
}
</style>
