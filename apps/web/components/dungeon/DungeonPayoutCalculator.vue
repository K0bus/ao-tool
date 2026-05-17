<template>
  <div class="dungeon-calculator card p-6 max-w-5xl mx-auto space-y-6 bg-surface-900 border border-surface-800 rounded-xl shadow-2xl">
    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-800 pb-5">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500">
          <svg class="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-100 uppercase tracking-wide">Calculateur de Payout de Donjon</h2>
          <p class="text-xs text-gray-400">Gérez et distribuez équitablement les gains de vos sessions de donjon de groupe.</p>
        </div>
      </div>
      
      <!-- Top Action buttons -->
      <div class="flex items-center gap-2">
        <button 
          @click="addDefaultPlayers" 
          class="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-xs font-semibold text-gray-300 rounded border border-surface-700 transition-colors flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Membres par défaut
        </button>
        <button 
          @click="clearPlayers" 
          class="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/20 text-xs font-semibold text-red-400 rounded border border-red-900/30 transition-colors flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Vider la liste
        </button>
      </div>
    </div>

    <!-- Main Configuration Grid -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
      <!-- Left Config Card (Silver Input & Mode Switch) -->
      <div class="md:col-span-5 space-y-4 bg-surface-950/40 p-5 rounded-lg border border-surface-800/80">
        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Configuration de la session</h3>

        <!-- Payout Amount Input -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">Valeur Totale du Loot (Argent du leader)</label>
          <div class="relative rounded-md shadow-sm">
            <input 
              type="number" 
              v-model.number="totalLootValue" 
              min="0"
              class="w-full bg-surface-950 border border-surface-800 focus:border-yellow-500/50 rounded-lg px-3 py-2.5 text-base font-bold text-yellow-400 outline-none transition-colors pr-12 font-mono"
              placeholder="0"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-xs text-gray-500 font-bold">SILVER</span>
            </div>
          </div>
        </div>

        <!-- Calculation Mode -->
        <div>
          <label class="block text-xs font-medium text-gray-400 mb-1.5">Méthode de Répartition</label>
          <div class="grid grid-cols-1 gap-2">
            <!-- Mode A description -->
            <label 
              class="relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all hover:bg-surface-900/60"
              :class="calculationMode === 'fair' ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-surface-950/50 border-surface-800'"
            >
              <input 
                type="radio" 
                v-model="calculationMode" 
                value="fair" 
                class="sr-only" 
              />
              <span class="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full" :class="calculationMode === 'fair' ? 'bg-yellow-400' : 'bg-gray-600'" />
                ⚖️ Redistribution Absolue
              </span>
              <span class="text-[10px] text-gray-500 mt-1 pl-3.5 leading-relaxed">
                Les sacs individuels sont intégrés au calcul global. Le leader verse un montant réajusté pour que le total final (Sacs + Part) soit identique pour chaque membre revendicateur.
              </span>
            </label>

            <!-- Mode B description -->
            <label 
              class="relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all hover:bg-surface-900/60"
              :class="calculationMode === 'direct' ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-surface-950/50 border-surface-800'"
            >
              <input 
                type="radio" 
                v-model="calculationMode" 
                value="direct" 
                class="sr-only" 
              />
              <span class="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full" :class="calculationMode === 'direct' ? 'bg-yellow-400' : 'bg-gray-600'" />
                💰 Division brute des loots
              </span>
              <span class="text-[10px] text-gray-500 mt-1 pl-3.5 leading-relaxed">
                Chaque joueur conserve l'intégralité de ses sacs individuels sans compensation, et la valeur totale du loot récolté est simplement divisée à parts égales entre les membres actifs.
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Right Summary Panel (Computed Statistics Card) -->
      <div class="md:col-span-7 flex flex-col justify-between bg-surface-950/20 p-5 rounded-lg border border-surface-800">
        <div>
          <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Statistiques de distribution</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-semibold">Total Loot Partagé</div>
              <div class="text-base font-bold text-yellow-400 font-mono mt-0.5">{{ totalLootValue.toLocaleString() }} <span class="text-[10px] text-gray-500">S</span></div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-semibold">Total Sacs d'argent</div>
              <div class="text-base font-bold text-gray-300 font-mono mt-0.5">{{ totalSilverBags.toLocaleString() }} <span class="text-[10px] text-gray-500">S</span></div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-semibold">Total Généré</div>
              <div class="text-base font-bold text-green-400 font-mono mt-0.5">{{ (totalLootValue + totalSilverBags).toLocaleString() }} <span class="text-[10px] text-gray-500">S</span></div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-semibold">Membres Actifs</div>
              <div class="text-base font-bold text-gray-200 mt-0.5">{{ claimantsCount }} / {{ players.length }}</div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-semibold">Cible par joueur</div>
              <div class="text-base font-bold text-primary-400 font-mono mt-0.5">{{ targetSharePerPlayer.toLocaleString() }} <span class="text-[10px] text-gray-500">S</span></div>
            </div>
            <div>
              <div class="text-[10px] text-gray-500 uppercase font-semibold">Reste de Division</div>
              <div class="text-base font-bold text-gray-500 font-mono mt-0.5">{{ residualSilver.toLocaleString() }} <span class="text-[10px] text-gray-600">S</span></div>
            </div>
          </div>
        </div>

        <!-- Copy discord summary -->
        <div class="mt-5 pt-4 border-t border-surface-800/80 flex items-center justify-between gap-3">
          <div class="text-[10px] text-gray-500 leading-relaxed max-w-sm">
            Partagez facilement ce rapport avec les membres du groupe sur Discord ou dans le chat de guilde en jeu.
          </div>
          <button 
            @click="copySummaryToClipboard"
            class="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-xs font-bold text-surface-950 rounded shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            {{ copied ? 'Copié !' : 'Copier Rapport' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Players Management section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider">Membres du Groupe ({{ players.length }})</h3>
        
        <!-- Add Player Form -->
        <form @submit.prevent="addPlayer" class="flex gap-2">
          <input 
            type="text" 
            v-model.trim="newPlayerName" 
            placeholder="Nom du joueur..."
            maxlength="24"
            class="bg-surface-950 border border-surface-800 focus:border-yellow-500/30 rounded px-3 py-1.5 text-xs text-gray-200 outline-none w-48 transition-colors font-medium"
          />
          <button 
            type="submit" 
            :disabled="!newPlayerName"
            class="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 text-xs font-bold text-surface-950 rounded transition-colors flex items-center gap-1"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
        </form>
      </div>

      <!-- Players Payout Table -->
      <div class="overflow-x-auto rounded-lg border border-surface-800">
        <table class="w-full text-xs text-left">
          <thead>
            <tr class="bg-surface-950 border-b border-surface-800 text-[10px] text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-3 font-semibold">Joueur</th>
              <th class="px-4 py-3 font-semibold text-center w-32">Revendiquer</th>
              <th class="px-4 py-3 font-semibold text-right w-44">Sacs d'argent (Silver Bags)</th>
              <th class="px-4 py-3 font-semibold text-right w-40">Part du Loot</th>
              <th class="px-4 py-3 font-semibold text-right w-44">A Verser (Leader)</th>
              <th class="px-4 py-3 font-semibold text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-800/60 bg-surface-900/20">
            <tr 
              v-for="player in calculatedPlayers" 
              :key="player.id" 
              class="hover:bg-surface-850/40 transition-colors"
              :class="{ 'opacity-50 bg-surface-950/20': !player.claimsPayout }"
            >
              <!-- Player Name -->
              <td class="px-4 py-3.5 font-semibold text-gray-200">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full" :class="player.claimsPayout ? 'bg-green-500' : 'bg-red-500'" />
                  <input 
                    type="text" 
                    v-model="player.name" 
                    class="bg-transparent border-b border-transparent hover:border-surface-700 focus:border-yellow-500/40 text-gray-200 px-1 py-0.5 outline-none font-medium transition-colors"
                  />
                </div>
              </td>

              <!-- Claims Payout Toggle Switch -->
              <td class="px-4 py-3.5 text-center">
                <button 
                  type="button"
                  @click="player.claimsPayout = !player.claimsPayout"
                  class="relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                  :class="player.claimsPayout ? 'bg-yellow-500' : 'bg-surface-800'"
                >
                  <span 
                    class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface-950 shadow ring-0 transition duration-200 ease-in-out"
                    :class="player.claimsPayout ? 'translate-x-5' : 'translate-x-0'"
                  />
                </button>
              </td>

              <!-- Silver Bags Input -->
              <td class="px-4 py-3.5 text-right">
                <div class="relative inline-block w-full max-w-[160px]">
                  <input 
                    type="number" 
                    v-model.number="player.silverBags" 
                    min="0"
                    class="w-full bg-surface-950 border border-surface-800/80 rounded px-2 py-1 text-right text-xs font-mono font-bold text-gray-300 outline-none focus:border-yellow-500/30 transition-colors"
                    placeholder="0"
                  />
                </div>
              </td>

              <!-- Loot Payout Share -->
              <td class="px-4 py-3.5 text-right text-gray-400 font-mono font-medium">
                {{ player.claimsPayout ? player.lootShare.toLocaleString() : '—' }}
              </td>

              <!-- Leader Total Payout to pay -->
              <td class="px-4 py-3.5 text-right font-mono">
                <span 
                  v-if="player.claimsPayout"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-xs"
                  :class="player.leaderPayout >= 0 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'"
                >
                  {{ player.leaderPayout >= 0 ? '+' : '' }}{{ player.leaderPayout.toLocaleString() }}
                </span>
                <span v-else class="text-gray-600 font-semibold italic text-[11px]">
                  Exclu (0 Payout)
                </span>
              </td>

              <!-- Delete player button -->
              <td class="px-4 py-3 text-center">
                <button 
                  @click="removePlayer(player.id)" 
                  class="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-surface-800/80 transition-colors"
                  title="Retirer le joueur"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="players.length === 0">
              <td colspan="6" class="py-12 text-center text-gray-500 text-xs italic">
                Aucun joueur dans la liste. Ajoutez des joueurs ou importez les membres par défaut.
              </td>
            </tr>
          </tbody>
        </table>
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

// Computed total silver bags
const totalSilverBags = computed(() => {
  return players.value.reduce((acc, p) => acc + (p.silverBags || 0), 0)
})

// Number of claimants
const claimantsCount = computed(() => {
  return players.value.filter(p => p.claimsPayout).length
})

// Target share per claiming player
const targetSharePerPlayer = computed(() => {
  const count = claimantsCount.value
  if (count === 0) return 0

  if (calculationMode.value === 'fair') {
    // Mode A: Total value (loot + bags) divided equitably among claimants
    // Silver bags from non-claimants are excluded from sharing (they keep them).
    const totalSessionValue = totalLootValue.value + players.value
      .filter(p => p.claimsPayout)
      .reduce((acc, p) => acc + (p.silverBags || 0), 0)
    return Math.floor(totalSessionValue / count)
  } else {
    // Mode B: Direct loot division
    return Math.floor(totalLootValue.value / count)
  }
})

// Rounded excess leftover (due to integer division flooring)
const residualSilver = computed(() => {
  const count = claimantsCount.value
  if (count === 0) return 0

  if (calculationMode.value === 'fair') {
    const totalSessionValue = totalLootValue.value + players.value
      .filter(p => p.claimsPayout)
      .reduce((acc, p) => acc + (p.silverBags || 0), 0)
    return totalSessionValue % count
  } else {
    return totalLootValue.value % count
  }
})

// Complete list with computed loot shares and leader payments
const calculatedPlayers = computed<CalculatedPlayer[]>(() => {
  const share = targetSharePerPlayer.value
  const mode = calculationMode.value
  const count = claimantsCount.value

  return players.value.map(player => {
    let lootShare = 0
    let leaderPayout = 0

    if (player.claimsPayout && count > 0) {
      if (mode === 'fair') {
        // Mode A: Redistribution. Total payout is equalized.
        lootShare = Math.max(0, share - player.silverBags)
        leaderPayout = share - player.silverBags
      } else {
        // Mode B: Direct split of the loot.
        lootShare = share
        leaderPayout = share
      }
    }

    return {
      ...player,
      lootShare,
      leaderPayout
    }
  })
})

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
  text += `🔹 **Valeur totale Loot :** ${totalLootValue.value.toLocaleString()} Silver\n`
  text += `🔹 **Cumul des sacs d'argent :** ${totalSilverBags.value.toLocaleString()} Silver\n`
  text += `🔹 **Membres du groupe :** ${players.value.length} (${claimantsCount.value} revendicateurs)\n`
  text += `🔹 **Cible par joueur :** ${targetSharePerPlayer.value.toLocaleString()} Silver\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
  text += `📋 **RÉPARTITION (À verser par le chef) :**\n`
  
  calculatedPlayers.value.forEach(p => {
    if (p.claimsPayout) {
      const payoutString = p.leaderPayout >= 0 ? `+${p.leaderPayout.toLocaleString()}` : `${p.leaderPayout.toLocaleString()}`
      text += `👤 **${p.name}** : ${payoutString} Silver  *(Sacs: ${p.silverBags.toLocaleString()})*\n`
    } else {
      text += `👤 **${p.name}** : Exclu (Gardera ses sacs : ${p.silverBags.toLocaleString()})\n`
    }
  })
  
  if (residualSilver.value > 0) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    text += `⚠️ *Reste de division à garder par le leader : ${residualSilver.value} Silver*\n`
  }

  navigator.clipboard.writeText(text).then(() => {
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  })
}
</script>

<style scoped>
.dungeon-calculator {
  background-color: var(--bg-2, #141619);
}
</style>
