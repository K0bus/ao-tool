<template>
  <div class="page settings">
    <div class="page-header">
      <div>
        <div class="crumbs"><NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Paramètres</div>
        <h1>Paramètres</h1>
        <p class="t-muted" style="margin-top:6px">Configurez l'apparence, le comportement et les préférences de votre espace de travail.</p>
      </div>
    </div>

    <div class="settings-layout">
      <!-- Sidenav -->
      <nav class="settings-nav panel">
        <a
          v-for="sec in sections"
          :key="sec.id"
          :class="['sn-link', activeSection === sec.id && 'active', (sec.comingSoon && !auth.isAdmin.value) && 'disabled']"
          href="#"
          @click.prevent="!(sec.comingSoon && !auth.isAdmin.value) && (activeSection = sec.id)"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="sec.iconPaths" />
          {{ sec.label }}
          <span v-if="sec.comingSoon" class="cs-badge">Bientôt</span>
        </a>
      </nav>

      <!-- Content -->
      <div class="settings-content">
        <!-- Profile -->
        <div v-if="activeSection === 'profile'" class="settings-section">
          <h2 class="section-title">Mon Profil</h2>

          <div class="panel settings-panel">
            <div class="sp-head">Informations personnelles</div>
            <div class="sp-body sp-rows">
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Nom d'utilisateur</div>
                  <div class="sp-row-sub">Visible par les autres utilisateurs sur vos builds.</div>
                </div>
                <input v-model="profileForm.username" type="text" class="ds-input" style="width:240px" placeholder="Username" />
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Adresse e-mail</div>
                  <div class="sp-row-sub">Utilisée pour la connexion et les notifications.</div>
                </div>
                <input v-model="profileForm.email" type="email" class="ds-input" style="width:240px" placeholder="Email" />
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:8px">
                <button class="ds-btn primary sm" :disabled="savingProfile" @click="saveProfile">
                  {{ savingProfile ? 'Enregistrement...' : 'Mettre à jour le profil' }}
                </button>
              </div>
            </div>
          </div>

          <div class="panel settings-panel" style="margin-top:24px">
            <div class="sp-head">Sécurité</div>
            <div class="sp-body sp-rows">
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Mot de passe actuel</div>
                </div>
                <input v-model="passwordForm.currentPassword" type="password" class="ds-input" style="width:240px" placeholder="••••••••" />
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Nouveau mot de passe</div>
                </div>
                <input v-model="passwordForm.newPassword" type="password" class="ds-input" style="width:240px" placeholder="••••••••" />
              </div>
              <div class="sp-row">
                <div class="sp-row-info">
                  <div class="sp-row-label">Confirmer le mot de passe</div>
                </div>
                <input v-model="passwordForm.confirmPassword" type="password" class="ds-input" style="width:240px" placeholder="••••••••" />
              </div>
              <div style="display:flex;justify-content:flex-end;margin-top:8px">
                <button class="ds-btn primary sm" :disabled="savingPassword" @click="savePassword">
                  {{ savingPassword ? 'Mise à jour...' : 'Changer le mot de passe' }}
                </button>
              </div>
            </div>
          </div>
        </div>

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

        <!-- Save button (Hidden for profile as it has its own) -->
        <div v-if="activeSection !== 'profile'" style="margin-top:24px;display:flex;gap:10px;justify-content:flex-end">
          <button class="ds-btn ghost">Annuler</button>
          <button class="ds-btn primary" @click="save">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Enregistrer
          </button>
        </div>
      </div>
    </div>

    <!-- Feedback Message -->
    <Transition name="fade">
      <div v-if="feedback" :class="['feedback-toast', feedback.type]">
        <svg v-if="feedback.type === 'success'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        {{ feedback.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const auth = useAuth()
const activeSection = ref('profile')

const sections = [
  { id: 'profile', label: 'Profil', iconPaths: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
  { id: 'appearance', label: 'Apparence', iconPaths: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>', comingSoon: true },
  { id: 'behavior', label: 'Comportement', iconPaths: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>', comingSoon: true },
  { id: 'localization', label: 'Localisation', iconPaths: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>', comingSoon: true },
]

const profileForm = ref({
  username: auth.user.value?.username ?? '',
  email: auth.user.value?.email ?? '',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const savingProfile = ref(false)
const savingPassword = ref(false)
const feedback = ref<{ type: 'success' | 'error'; message: string } | null>(null)

function setFeedback(type: 'success' | 'error', message: string) {
  feedback.value = { type, message }
  setTimeout(() => {
    feedback.value = null
  }, 3000)
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await $fetch('/api/v1/me/profile', {
      method: 'PUT',
      body: {
        username: profileForm.value.username,
        email: profileForm.value.email,
      },
    })
    await auth.fetchUser()
    setFeedback('success', 'Profil mis à jour avec succès')
  } catch (err: any) {
    setFeedback('error', err.data?.message ?? 'Erreur lors de la mise à jour')
  } finally {
    savingProfile.value = false
  }
}

async function savePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    setFeedback('error', 'Les mots de passe ne correspondent pas')
    return
  }

  savingPassword.value = true
  try {
    await $fetch('/api/v1/me/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
      },
    })
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    setFeedback('success', 'Mot de passe mis à jour')
  } catch (err: any) {
    setFeedback('error', err.data?.message ?? 'Erreur lors du changement')
  } finally {
    savingPassword.value = false
  }
}

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

<style scoped>
.cs-badge {
  font-size: 9px;
  background: var(--gold-dark);
  color: var(--gold);
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: auto;
  text-transform: uppercase;
  font-weight: 700;
  border: 1px solid var(--gold-80);
}

.sn-link.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.feedback-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  items-center: center;
  gap: 10px;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(8px);
}

.feedback-toast.success {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.feedback-toast.error {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
