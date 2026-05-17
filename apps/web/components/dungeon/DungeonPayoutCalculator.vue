<template>
  <div class="dungeon-calculator-wrapper space-y-6">
    <!-- Top Action Row -->
    <div class="row" style="gap: 10px; justify-content: flex-end;">
      <button 
        @click="addDefaultPlayers" 
        class="ds-btn sm"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px"><path d="M12 5v14M5 12h14"/></svg>
        Membres par défaut
      </button>
      <button 
        @click="clearPlayers" 
        class="ds-btn sm danger"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        Vider la liste
      </button>
    </div>

    <!-- Main Configuration Grid -->
    <div class="calculator-grid">
      <!-- Left Config Card -->
      <div class="panel">
        <div class="panel-header">
          <h3>Configuration de la session</h3>
        </div>
        <div class="panel-body settings-body space-y-4">
          <!-- Payout Amount Input -->
          <div class="field">
            <label class="field-label">Valeur Totale du Loot (Chef de groupe)</label>
            <div class="relative-input-container">
              <input 
                type="number" 
                v-model.number="totalLootValue" 
                min="0"
                class="ds-input font-bold text-yellow font-mono"
                placeholder="0"
                style="padding-right: 60px"
              />
              <span class="input-suffix font-mono">SILVER</span>
            </div>
          </div>

          <!-- Calculation Mode Selection -->
          <div class="field">
            <label class="field-label">Méthode de Répartition</label>
            <div class="mode-toggles">
              <label 
                class="mode-selector"
                :class="{ active: calculationMode === 'fair' }"
              >
                <input 
                  type="radio" 
                  v-model="calculationMode" 
                  value="fair" 
                  class="sr-only" 
                />
                <span class="mode-title">⚖️ Redistribution Absolue</span>
                <span class="mode-desc">
                  Les sacs individuels sont intégrés au calcul global. Le leader verse un montant réajusté pour que le cumul final soit identique pour tous.
                </span>
              </label>

              <label 
                class="mode-selector"
                :class="{ active: calculationMode === 'direct' }"
              >
                <input 
                  type="radio" 
                  v-model="calculationMode" 
                  value="direct" 
                  class="sr-only" 
                />
                <span class="mode-title">💰 Division brute des loots</span>
                <span class="mode-desc">
                  Chaque joueur conserve ses sacs individuels sans compensation, et la valeur totale du loot récolté est simplement divisée à parts égales.
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Summary Panel -->
      <div class="panel flex-col-between">
        <div class="panel-header">
          <h3>Statistiques de distribution</h3>
        </div>
        <div class="panel-body flex-grow">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total Loot Partagé</div>
              <div class="stat-val text-yellow">{{ totalLootValue.toLocaleString() }} <span class="unit">S</span></div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Sacs d'argent</div>
              <div class="stat-val">{{ totalSilverBags.toLocaleString() }} <span class="unit">S</span></div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Généré</div>
              <div class="stat-val text-success">{{ (totalLootValue + totalSilverBags).toLocaleString() }} <span class="unit">S</span></div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Membres Actifs</div>
              <div class="stat-val">{{ claimantsCount }} / {{ players.length }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Part Loot / Joueur</div>
              <div class="stat-val text-gold">{{ rawLootShare.toLocaleString() }} <span class="unit">S</span></div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Cible Sacs / Joueur</div>
              <div class="stat-val text-success">{{ targetSilverShare.toLocaleString() }} <span class="unit">S</span></div>
            </div>
          </div>
        </div>

        <div class="panel-footer-row">
          <p class="t-dim text-xs leading-relaxed max-w-sm" style="margin: 0">
            Copiez un rapport complet avec emojis pour le partager instantanément sur votre Discord de guilde ou dans le chat en jeu.
          </p>
          <button 
            @click="copySummaryToClipboard"
            class="ds-btn primary sm"
            style="min-width: 140px"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            {{ copied ? 'Copié !' : 'Copier Rapport' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Players Management Section -->
    <div class="panel">
      <div class="panel-header flex-row-between">
        <h3>Membres du Groupe ({{ players.length }})</h3>
        
        <!-- Add Player Form -->
        <form @submit.prevent="addPlayer" class="row" style="gap: 8px; margin: 0">
          <input 
            type="text" 
            v-model.trim="newPlayerName" 
            placeholder="Nom du joueur..."
            maxlength="24"
            class="ds-input"
            style="width: 180px; height: 32px; font-size: 12px"
          />
          <button 
            type="submit" 
            :disabled="!newPlayerName"
            class="ds-btn sm primary"
            style="height: 32px"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 2px"><path d="M12 5v14M5 12h14"/></svg>
            Ajouter
          </button>
        </form>
      </div>

      <!-- Players List Column Labels -->
      <div class="players-list-header">
        <div class="col-lbl">Pseudo</div>
        <div class="col-lbl" style="text-align: center">Revendiquer part</div>
        <div class="col-lbl" style="text-align: right">Sacs d'argent</div>
        <div class="col-lbl" style="text-align: right">Part du Loot</div>
        <div class="col-lbl" style="text-align: right">Ajustement Argent</div>
        <div class="col-lbl" style="text-align: center">Action</div>
      </div>

      <!-- List Container -->
      <div class="players-list">
        <div 
          v-for="player in calculatedPlayers" 
          :key="player.id" 
          class="player-row"
          :class="{ 'row-inactive': !player.claimsPayout }"
        >
          <!-- Status dot & Editable name input -->
          <div class="cell-player">
            <span class="status-dot" :class="player.claimsPayout ? 'ok' : 'error'"></span>
            <input 
              type="text" 
              :value="player.name"
              @input="updatePlayerName(player.id, ($event.target as HTMLInputElement).value)"
              class="player-name-input"
              placeholder="Nom..."
            />
          </div>

          <!-- Claim Toggle Switch -->
          <div class="cell-switch">
            <label class="ds-switch">
              <input 
                type="checkbox" 
                :checked="player.claimsPayout"
                @change="togglePlayerClaim(player.id)"
              />
              <span class="ds-track"><span class="ds-thumb"></span></span>
            </label>
          </div>

          <!-- Silver bags collected input -->
          <div class="cell-bags">
            <input 
              type="number" 
              :value="player.silverBags"
              @input="updatePlayerBags(player.id, Number(($event.target as HTMLInputElement).value))"
              min="0"
              class="ds-input inline-bags-input font-mono"
              placeholder="0"
            />
          </div>

          <!-- Computed Loot Share -->
          <div class="cell-loot t-mono">
            <span v-if="player.claimsPayout" style="color: var(--text-2)">{{ player.lootShare.toLocaleString() }} ◇</span>
            <span v-else class="t-dim">—</span>
          </div>

          <!-- Silver Bags adjustment (strictly coins adjustment, no loot value) -->
          <div class="cell-payout font-mono">
            <span 
              v-if="player.claimsPayout"
              class="payout-badge"
              :class="player.leaderPayout >= 0 ? 'pos' : 'neg'"
            >
              {{ player.leaderPayout >= 0 ? '+' : '' }}{{ player.leaderPayout.toLocaleString() }} ◇
            </span>
            <span v-else class="uncalculable-label italic text-xs" style="color: var(--text-4)">
              Exclu
            </span>
          </div>

          <!-- Remove Action -->
          <div class="cell-actions">
            <button 
              @click="removePlayer(player.id)" 
              class="action-trash-btn"
              title="Retirer le joueur"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <!-- Empty State Row -->
        <div v-if="players.length === 0" class="players-empty">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" style="color: var(--text-4)"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
          <span>Aucun joueur dans le groupe. Ajoutez des membres ou importez la configuration par défaut.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface PlayerDonjon {
  id: string
  name: string
  silverBags: number
  claimsPayout: boolean
}

interface CalculatedPlayer extends PlayerDonjon {
  lootShare: number
  leaderPayout: number
}

// Initial inputs
const totalLootValue = ref<number>(2500000)
const calculationMode = ref<'fair' | 'direct'>('fair')
const newPlayerName = ref<string>('')
const copied = ref<boolean>(false)

// Default group list
const players = ref<PlayerDonjon[]>([
  { id: '1', name: 'Zornik', silverBags: 120000, claimsPayout: true },
  { id: '2', name: 'Kaelen', silverBags: 85000, claimsPayout: true },
  { id: '3', name: 'Morrigan', silverBags: 190000, claimsPayout: true },
  { id: '4', name: 'Sven', silverBags: 50000, claimsPayout: true },
  { id: '5', name: 'Elysia', silverBags: 0, claimsPayout: false }, // Excluded claimant
])

// Computed total silver bags for active claimants
const totalSilverBags = computed(() => {
  return players.value
    .filter(p => p.claimsPayout)
    .reduce((acc, p) => acc + (p.silverBags || 0), 0)
})

// Number of claimants
const claimantsCount = computed(() => {
  return players.value.filter(p => p.claimsPayout).length
})

// Raw Loot share per claiming player (strictly totalLootValue / claimantsCount)
const rawLootShare = computed(() => {
  const count = claimantsCount.value
  return count > 0 ? Math.floor(totalLootValue.value / count) : 0
})

// Target silver bags share per claiming player (strictly totalSilverBags / claimantsCount)
const targetSilverShare = computed(() => {
  const count = claimantsCount.value
  return count > 0 ? Math.floor(totalSilverBags.value / count) : 0
})

// Target total combined share (loot + silver bags) per claiming player
const targetTotalShare = computed(() => {
  return rawLootShare.value + targetSilverShare.value
})

// Rounded excess leftover of total loot value
const residualSilver = computed(() => {
  const count = claimantsCount.value
  return count > 0 ? totalLootValue.value % count : 0
})

// Complete list with computed loot shares and leader payments
const calculatedPlayers = computed<CalculatedPlayer[]>(() => {
  const rawShare = rawLootShare.value
  const silverShare = targetSilverShare.value
  const mode = calculationMode.value
  const count = claimantsCount.value

  return players.value.map(player => {
    let lootShare = 0
    let leaderPayout = 0

    if (player.claimsPayout && count > 0) {
      // The Loot Share is strictly the raw items split: totalLootValue / claimantsCount
      lootShare = rawShare
      
      if (mode === 'fair') {
        // The Leader Payout strictly represents the silver adjustment to balance the silver bags:
        // (totalSilverBags / claimantsCount) - player.silverBags
        leaderPayout = silverShare - player.silverBags
      } else {
        // Direct division: no silver adjustments are paid by the leader
        leaderPayout = 0
      }
    }

    return {
      ...player,
      lootShare,
      leaderPayout
    }
  })
})

// Update Player Name directly in raw source ref
function updatePlayerName(id: string, name: string) {
  const p = players.value.find(x => x.id === id)
  if (p) {
    p.name = name
  }
}

// Toggle Player Claim Status directly in raw source ref
function togglePlayerClaim(id: string) {
  const p = players.value.find(x => x.id === id)
  if (p) {
    p.claimsPayout = !p.claimsPayout
  }
}

// Update Player Silver Bags directly in raw source ref
function updatePlayerBags(id: string, bags: number) {
  const p = players.value.find(x => x.id === id)
  if (p) {
    p.silverBags = Math.max(0, bags || 0)
  }
}

// Add Player
function addPlayer() {
  if (!newPlayerName.value) return
  
  players.value.push({
    id: Math.random().toString(36).substring(2, 9),
    name: newPlayerName.value,
    silverBags: 0,
    claimsPayout: true
  })
  
  newPlayerName.value = ''
}

// Remove Player
function removePlayer(id: string) {
  players.value = players.value.filter(p => p.id !== id)
}

// Add Default Players
function addDefaultPlayers() {
  players.value = [
    { id: '1', name: 'Zornik', silverBags: 120000, claimsPayout: true },
    { id: '2', name: 'Kaelen', silverBags: 85000, claimsPayout: true },
    { id: '3', name: 'Morrigan', silverBags: 190000, claimsPayout: true },
    { id: '4', name: 'Sven', silverBags: 50000, claimsPayout: true },
    { id: '5', name: 'Elysia', silverBags: 0, claimsPayout: false },
  ]
}

// Clear Players
function clearPlayers() {
  players.value = []
}

// Copy Summary for Discord / Guild chat
function copySummaryToClipboard() {
  const modeText = calculationMode.value === 'fair' ? '⚖️ Redistribution Absolue' : '💰 Division Directe des Loots'
  
  let text = `⚔️ **RAPPORT DE PAYOUT DE DONJON** ⚔️\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `🔹 **Méthode :** ${modeText}\n`
  text += `🔹 **Valeur totale Loot (Items) :** ${totalLootValue.value.toLocaleString()} Silver\n`
  text += `🔹 **Cumul des sacs d'argent :** ${totalSilverBags.value.toLocaleString()} Silver\n`
  text += `🔹 **Membres du groupe :** ${players.value.length} (${claimantsCount.value} revendicateurs)\n`
  text += `🔹 **Part du Loot / joueur :** ${rawLootShare.value.toLocaleString()} Silver\n`
  text += `🔹 **Cible Sacs / joueur :** ${targetSilverShare.value.toLocaleString()} Silver\n`
  text += `🔹 **Total cumulé / joueur :** ${targetTotalShare.value.toLocaleString()} Silver\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `📋 **AJUSTEMENT DE L'ARGENT (À équilibrer) :**\n`
  
  calculatedPlayers.value.forEach(p => {
    if (p.claimsPayout) {
      const payoutString = p.leaderPayout >= 0 ? `+${p.leaderPayout.toLocaleString()}` : `${p.leaderPayout.toLocaleString()}`
      text += `👤 **${p.name}** : ${payoutString} Silver  *(Sacs: ${p.silverBags.toLocaleString()} | Loot Share: ${rawLootShare.value.toLocaleString()})*\n`
    } else {
      text += `👤 **${p.name}** : Exclu (Gardera ses sacs : ${p.silverBags.toLocaleString()})\n`
    }
  })
  
  if (residualSilver.value > 0) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    text += `⚠️ *Reste de division Loot à garder par le leader : ${residualSilver.value} Silver*\n`
  }

  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  })
}
</script>

<style scoped>
/* ── Layout Grid ───────────────────────────────────────────────────────── */

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .calculator-grid {
    grid-template-columns: 1fr;
  }
}

.flex-col-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.flex-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* ── Settings / Inputs ─────────────────────────────────────────────────── */

.settings-body {
  padding: 16px 20px 20px;
}

.relative-input-container {
  position: relative;
  width: 100%;
}

.input-suffix {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-3);
  pointer-events: none;
}

/* ── Mode Selector Cards ───────────────────────────────────────────────── */

.mode-toggles {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-selector {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.mode-selector:hover {
  background: var(--bg-4);
  border-color: var(--border-strong);
}

.mode-selector.active {
  background: rgba(201, 161, 74, 0.04);
  border-color: var(--gold);
}

.mode-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-0);
}

.mode-desc {
  font-size: 10px;
  color: var(--text-3);
  line-height: 1.4;
  margin-top: 4px;
}

/* ── Stats Display Grid ────────────────────────────────────────────────── */

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
}

@media (max-width: 500px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--text-3);
}

.stat-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-1);
}

.stat-val.text-yellow { color: var(--gold); }
.stat-val.text-success { color: var(--success); }
.stat-val.text-gold { color: var(--gold); }
.stat-val.text-dim { color: var(--text-3); }

.stat-val .unit {
  font-size: 10px;
  color: var(--text-3);
  margin-left: 2px;
  font-weight: 500;
}

.panel-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-3);
}

/* ── Players List (retravaillé avec séparateurs) ────────────────────────── */

.players-list-header {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr 1.3fr 1.2fr 1.5fr 80px;
  gap: 12px;
  align-items: center;
  padding: 10px 18px;
  background: var(--bg-1);
  border-bottom: 1px solid var(--border-divider);
}

.col-lbl {
  font-family: var(--font-display);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-3);
  font-weight: 500;
}

.players-list {
  display: flex;
  flex-direction: column;
}

.player-row {
  display: grid;
  grid-template-columns: 1.8fr 1.2fr 1.3fr 1.2fr 1.5fr 80px;
  gap: 12px;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-divider);
  transition: background 0.12s;
}

.player-row:last-child {
  border-bottom: none;
}

.player-row:hover {
  background: rgba(201, 161, 74, 0.02);
}

.player-row.row-inactive {
  opacity: 0.45;
}

.cell-player {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-name-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid transparent;
  color: var(--text-0);
  font-size: 13px;
  font-weight: 600;
  outline: none;
  padding: 2px 4px;
  width: 100%;
  transition: border-color 0.1s;
}

.player-name-input:focus, .player-name-input:hover {
  border-color: var(--border-strong);
}

.cell-switch {
  display: flex;
  justify-content: center;
}

.cell-bags {
  display: flex;
  justify-content: flex-end;
}

.inline-bags-input {
  width: 130px;
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  text-align: right;
  font-weight: bold;
}

.cell-loot {
  text-align: right;
  font-size: 13px;
  font-family: var(--font-mono);
}

.cell-payout {
  display: flex;
  justify-content: flex-end;
}

.payout-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
}

.payout-badge.pos {
  background: rgba(125, 154, 74, 0.08);
  border: 1px solid rgba(125, 154, 74, 0.25);
  color: var(--success);
}

.payout-badge.neg {
  background: rgba(176, 74, 50, 0.08);
  border: 1px solid rgba(176, 74, 50, 0.25);
  color: var(--danger);
}

.cell-actions {
  display: flex;
  justify-content: center;
}

.action-trash-btn {
  background: transparent;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s, background 0.1s;
}

.action-trash-btn:hover {
  color: var(--danger);
  background: rgba(176, 74, 50, 0.08);
}

.players-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--text-3);
  font-size: 13px;
  text-align: center;
}
</style>
