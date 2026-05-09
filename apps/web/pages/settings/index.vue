<template>
  <div class="page settings">
    <div class="page-header">
      <div class="breadcrumb">
        <NuxtLink to="/">Accueil</NuxtLink>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
        <span>Paramètres</span>
      </div>
      <h1 class="page-title">Paramètres</h1>
      <p class="page-sub">Configurez l'apparence, le comportement et les préférences de votre espace de travail.</p>
    </div>

    <div class="settings-layout">
      <!-- Sidenav -->
      <nav class="settings-nav panel">
        <a
          v-for="sec in sections"
          :key="sec.id"
          :class="['sn-link', activeSection === sec.id && 'active']"
          href="#"
          @click.prevent="activeSection = sec.id"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="sec.iconPaths" />
          {{ sec.label }}
        </a>
      </nav>

      <!-- Content -->
      <div class="settings-content">
        <!-- Appearance -->
        <div v-if="activeSection === 'appearance'" class="settings-section">
          <h2 class="section-title">Apparence</h2>

          <div class="panel settings-panel">
            <div class="sp-head">Thème</div>
            <div class="sp-body">
              <div class="theme-grid">
                <button
                  v-for="t in themes"
                  :key="t.id"
                  :class="['theme-card', theme === t.id && 'active']"
                  @click="theme = t.id"
                >
                  <div class="theme-preview" :style="t.preview" />
                  <span>{{ t.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="panel settings-panel">
            <div class="sp-head">Police d'affichage</div>
            <div class="sp-body">
              <div class="field-row">
                <div>
                  <div style="font-size:14px;color:var(--text-1)">Police des prix / données</div>
                  <div style="font-size:12px;color:var(--text-3)">Utilisée pour les valeurs numériques, identifiants et données de marché.</div>
                </div>
                <select v-model="monoFont" class="ds-input" style="width:180px;flex-shrink:0">
                  <option>JetBrains Mono</option>
                  <option>Fira Code</option>
                  <option>IBM Plex Mono</option>
                </select>
              </div>
            </div>
          </div>

          <div class="panel settings-panel">
            <div class="sp-head">Densité d'affichage</div>
            <div class="sp-body">
              <div class="density-row">
                <button v-for="d in densities" :key="d.id" :class="['density-btn', density === d.id && 'active']" @click="density = d.id">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="d.iconPaths" />
                  {{ d.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Behavior -->
        <div v-if="activeSection === 'behavior'" class="settings-section">
          <h2 class="section-title">Comportement</h2>

          <div class="panel settings-panel">
            <div class="sp-head">Marché</div>
            <div class="sp-body sp-rows">
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Actualisation automatique</div>
                  <div class="sp-row-sub">Rafraîchit les prix toutes les 60 secondes sur la page Marché.</div>
                </div>
                <label class="ds-switch">
                  <input v-model="autoRefresh" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb" /></span>
                </label>
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Alertes d'arbitrage</div>
                  <div class="sp-row-sub">Notification sonore lorsqu'un arbitrage > 5% est détecté.</div>
                </div>
                <label class="ds-switch">
                  <input v-model="arbitrageAlert" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb" /></span>
                </label>
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Ville par défaut</div>
                  <div class="sp-row-sub">Ville pré-sélectionnée sur les pages Marché et Crafting.</div>
                </div>
                <select v-model="defaultCity" class="ds-input" style="width:160px;flex-shrink:0">
                  <option>Caerleon</option>
                  <option>Bridgewatch</option>
                  <option>Lymhurst</option>
                  <option>Martlock</option>
                  <option>Thetford</option>
                  <option>Fort Sterling</option>
                </select>
              </div>
            </div>
          </div>

          <div class="panel settings-panel">
            <div class="sp-head">Crafting</div>
            <div class="sp-body sp-rows">
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Taux de retour mémorisé</div>
                  <div class="sp-row-sub">Restaure le dernier taux de retour configuré à l'ouverture de la page.</div>
                </div>
                <label class="ds-switch">
                  <input v-model="rememberReturn" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb" /></span>
                </label>
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Affichage arbre par défaut</div>
                  <div class="sp-row-sub">Ouvre toujours la vue arbre plutôt que la liste.</div>
                </div>
                <label class="ds-switch">
                  <input v-model="defaultTree" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb" /></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Localization -->
        <div v-if="activeSection === 'localization'" class="settings-section">
          <h2 class="section-title">Localisation</h2>

          <div class="panel settings-panel">
            <div class="sp-head">Langue</div>
            <div class="sp-body sp-rows">
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Langue de l'interface</div>
                  <div class="sp-row-sub">Langue utilisée pour les labels de l'application.</div>
                </div>
                <select v-model="uiLang" class="ds-input" style="width:160px;flex-shrink:0">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Langue des items</div>
                  <div class="sp-row-sub">Langue utilisée pour afficher les noms d'items depuis la base de données.</div>
                </div>
                <select v-model="itemLang" class="ds-input" style="width:160px;flex-shrink:0">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>
          </div>

          <div class="panel settings-panel">
            <div class="sp-head">Format</div>
            <div class="sp-body sp-rows">
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Format des prix</div>
                  <div class="sp-row-sub">Comment afficher les grandes valeurs en argent.</div>
                </div>
                <select v-model="priceFormat" class="ds-input" style="width:160px;flex-shrink:0">
                  <option value="compact">Compact (1.2M)</option>
                  <option value="full">Complet (1 200 000)</option>
                  <option value="k">Milliers (1 200k)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Save button -->
        <div style="margin-top:24px;display:flex;gap:10px;justify-content:flex-end">
          <button class="ds-btn ghost">Annuler</button>
          <button class="ds-btn primary" @click="save">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const activeSection = ref('appearance')

const sections = [
  { id: 'appearance', label: 'Apparence', iconPaths: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>' },
  { id: 'behavior', label: 'Comportement', iconPaths: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' },
  { id: 'localization', label: 'Localisation', iconPaths: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>' },
]

const theme = ref('dark')
const themes = [
  { id: 'dark', label: 'Sombre', preview: 'background:linear-gradient(135deg,#0b0a08 0%,#1a1710 100%);border:2px solid var(--gold)' },
  { id: 'darker', label: 'Nuit profonde', preview: 'background:linear-gradient(135deg,#050505 0%,#0f0e0c 100%)' },
  { id: 'sepia', label: 'Parchemin', preview: 'background:linear-gradient(135deg,#1a1208 0%,#2a1e0a 100%)' },
]

const density = ref('comfortable')
const densities = [
  { id: 'compact', label: 'Compact', iconPaths: '<path d="M3 6h18M3 10h18M3 14h18M3 18h18"/>' },
  { id: 'comfortable', label: 'Confortable', iconPaths: '<path d="M3 5h18M3 12h18M3 19h18"/>' },
  { id: 'spacious', label: 'Spacieux', iconPaths: '<path d="M3 4h18M3 14h18"/>' },
]

const monoFont = ref('JetBrains Mono')
const autoRefresh = ref(true)
const arbitrageAlert = ref(false)
const defaultCity = ref('Caerleon')
const rememberReturn = ref(true)
const defaultTree = ref(true)
const uiLang = ref('fr')
const itemLang = ref('fr')
const priceFormat = ref('compact')

function save() {
  // In production: POST /api/v1/user/settings
  console.log('Settings saved')
}
</script>
