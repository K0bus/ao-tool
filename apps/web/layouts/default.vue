<template>
  <div class="app" @click="handleOutsideClick">
    <!-- ===== STICKY HEADER (navbar + mega menus) ===== -->
    <header class="sticky-header" @mouseleave="startClose">
      <nav class="navbar">
        <!-- Brand -->
        <NuxtLink to="/" class="nav-brand">
          <span class="glyph" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gold)">
              <polygon points="16 2 28 16 16 30 4 16"/>
              <polygon points="16 8 23 16 16 24 9 16" fill="currentColor" fill-opacity="0.18"/>
              <line x1="16" y1="8" x2="16" y2="24"/>
              <line x1="9" y1="16" x2="23" y2="16"/>
            </svg>
          </span>
          <span>
            ALBION
            <span class="brand-sub">CODEX</span>
          </span>
        </NuxtLink>

        <span class="nav-divider" />

        <!-- Nav links -->
        <div class="nav-links">
          <NuxtLink to="/" class="nav-link" :class="{ active: route.path === '/' }">Accueil</NuxtLink>

          <button
            class="nav-link"
            :class="{ active: route.path.startsWith('/items'), 'mega-open': activeMega === 'items' }"
            @mouseenter="openMega('items')"
            @click="navigate('/items')"
          >
            Items
            <svg class="caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <button
            class="nav-link"
            :class="{ active: route.path.startsWith('/crafting'), 'mega-open': activeMega === 'crafting' }"
            @mouseenter="openMega('crafting')"
            @click="navigate('/crafting')"
          >
            Crafting
            <svg class="caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <NuxtLink to="/market" class="nav-link" :class="{ active: route.path === '/market' }">Marché</NuxtLink>

          <button
            class="nav-link"
            :class="{ active: route.path.startsWith('/killboard') || route.path.startsWith('/guilds') || route.path.startsWith('/alliances') || route.path.startsWith('/players'), 'mega-open': activeMega === 'pvp' }"
            @mouseenter="openMega('pvp')"
            @click="navigate('/killboard')"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;color:var(--gold)"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 3.5-3.5"/><path d="m16 16 4 4"/><path d="m9.5 4.5 5 5"/><path d="m4.5 9.5 5 5"/></svg>
            PvP
            <svg class="caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <button
            class="nav-link nav-link--builds"
            :class="{ active: route.path.startsWith('/builds'), 'mega-open': activeMega === 'builds' }"
            @mouseenter="openMega('builds')"
            @click="navigate('/builds')"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;color:var(--gold)"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>
            Builds
            <svg class="caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>

          <button
            v-if="auth.isAdmin.value"
            class="nav-link"
            :class="{ active: route.path.startsWith('/admin'), 'mega-open': activeMega === 'admin' }"
            @mouseenter="openMega('admin')"
            @click="navigate('/admin')"
          >
            Admin
            <svg class="caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        <!-- Search -->
        <div class="nav-search">
          <span class="ic-search">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un item…"
            autocomplete="off"
            @focus="searchFocused = true"
            @blur="onSearchBlur"
            @keydown.enter="goSearch"
            @keydown.escape="searchFocused = false"
          />
          <span class="kbd">⌘K</span>
          <div v-if="searchFocused && searchQuery.length >= 2" class="nav-search-results">
            <NuxtLink
              v-for="item in searchResults"
              :key="item.uniqueName"
              :to="`/items/${item.uniqueName}`"
              class="nsr-row"
              @mousedown.prevent
            >
              <div class="item-frame" style="width:32px;height:32px;flex-shrink:0">
                <AoItemImage :unique-name="item.uniqueName" :display-name="item.name" :alt="item.name" />
              </div>
              <div class="nsr-meta">
                <div class="nsr-name">{{ item.name }}</div>
                <div class="nsr-id">{{ item.uniqueName }}</div>
              </div>
              <span :class="`tier-badge t${item.tier}`">T{{ item.tier }}</span>
            </NuxtLink>
            <div v-if="searchResults.length === 0" class="nsr-empty">Aucun résultat</div>
          </div>
        </div>

        <NuxtLink to="/settings" class="nav-icon-btn" aria-label="Paramètres">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>
        </NuxtLink>

        <div v-if="auth.isAuthenticated.value" class="nav-user-wrap">
          <button
            type="button"
            class="nav-user-trigger"
            :aria-expanded="userMenuOpen"
            aria-haspopup="menu"
            aria-label="Menu compte"
            @click.stop="toggleUserMenu"
          >
            <span class="nav-avatar" aria-hidden="true">
              {{ (auth.user.value?.username?.[0] ?? '?').toUpperCase() }}
            </span>
            <svg class="nav-user-caret" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div v-show="userMenuOpen" class="nav-user-dropdown" role="menu">
            <div class="nav-user-meta">
              <div class="nav-user-name">{{ auth.user.value?.username }}</div>
              <div class="nav-user-email">{{ auth.user.value?.email }}</div>
            </div>
            <NuxtLink to="/builds/me" class="nav-user-item" role="menuitem" @click="userMenuOpen = false">Mes builds</NuxtLink>
            <NuxtLink to="/settings" class="nav-user-item" role="menuitem" @click="userMenuOpen = false">Paramètres</NuxtLink>
            <button type="button" class="nav-user-item nav-user-logout" role="menuitem" @click="onLogout">
              Se déconnecter
            </button>
          </div>
        </div>
        <template v-else>
          <NuxtLink to="/auth/login" class="ds-btn primary sm nav-login-btn">Se connecter</NuxtLink>
        </template>
      </nav>

      <!-- ===== MEGA MENUS ===== -->
      <div v-if="activeMega === 'items'" class="mega" @mouseenter="cancelClose">
        <div class="mega-grid">
          <div class="mega-col">
            <h4>Par tier</h4>
            <ul>
              <li v-for="t in [8,7,6,5,4]" :key="t"><NuxtLink :to="`/items?tier=${t}`"><span :class="`tier-badge t${t}`">T{{ t }}</span><div><div>Tier {{ t }}</div><div class="desc">{{ tierLabel(t) }}</div></div></NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Armes</h4>
            <ul>
              <li><NuxtLink to="/items?category=sword">Épées <span class="desc">à 1 et 2 mains</span></NuxtLink></li>
              <li><NuxtLink to="/items?category=axe">Haches</NuxtLink></li>
              <li><NuxtLink to="/items?category=hammer">Marteaux</NuxtLink></li>
              <li><NuxtLink to="/items?category=bow">Arcs & Arbalètes</NuxtLink></li>
              <li><NuxtLink to="/items?category=staff">Bâtons</NuxtLink></li>
              <li><NuxtLink to="/items?category=dagger">Dagues, Lances, Massues</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Armures & utilité</h4>
            <ul>
              <li><NuxtLink to="/items?category=cloth">Tissu · Magique</NuxtLink></li>
              <li><NuxtLink to="/items?category=leather">Cuir · Légère</NuxtLink></li>
              <li><NuxtLink to="/items?category=plate">Plaque · Lourde</NuxtLink></li>
              <li><NuxtLink to="/items?category=bag">Sacs & Sacoches</NuxtLink></li>
              <li><NuxtLink to="/items?category=cape">Capes & Boucliers</NuxtLink></li>
              <li><NuxtLink to="/items?category=tool">Outils de récolte</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-cta">
            <span class="label">À l'honneur</span>
            <p>12 480 items, 3 187 recettes indexées, 21 langues. Le codex le plus complet d'Albion.</p>
            <NuxtLink to="/items" class="ds-btn primary sm" style="margin-top:auto">Explorer le codex →</NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="activeMega === 'crafting'" class="mega" @mouseenter="cancelClose">
        <div class="mega-grid">
          <div class="mega-col">
            <h4>Outils</h4>
            <ul>
              <li><NuxtLink to="/crafting"><div><div>Crafting Tree</div><div class="desc">Arbre vertical complet</div></div></NuxtLink></li>
              <li><NuxtLink to="/items/profit"><div><div>Analyse de profit</div><div class="desc">Profit direct · tous les items</div></div></NuxtLink></li>
              <li><NuxtLink to="/crafting"><div><div>Liste de courses</div><div class="desc">Ressources agrégées</div></div></NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Refining</h4>
            <ul>
              <li><NuxtLink to="/crafting">Bois → Planches</NuxtLink></li>
              <li><NuxtLink to="/crafting">Minerai → Lingots</NuxtLink></li>
              <li><NuxtLink to="/crafting">Fibre → Étoffe</NuxtLink></li>
              <li><NuxtLink to="/crafting">Cuir brut → Cuir tanné</NuxtLink></li>
              <li><NuxtLink to="/crafting">Roche → Blocs</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Stations</h4>
            <ul>
              <li><NuxtLink to="/crafting">Forgeron · Caerleon</NuxtLink></li>
              <li><NuxtLink to="/crafting">Atelier de cuir · Lymhurst</NuxtLink></li>
              <li><NuxtLink to="/crafting">Apothicaire · Bridgewatch</NuxtLink></li>
              <li><NuxtLink to="/crafting">Cuisine · Thetford</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-cta">
            <span class="label">Profit du moment</span>
            <template v-if="topProfit">
              <p style="margin-bottom:6px">
                <span style="font-weight:600;color:var(--text-0)">{{ topProfit.name }}</span>
                <span v-if="topProfit.enchantmentLevel > 0" style="color:var(--gold);margin-left:3px">.{{ topProfit.enchantmentLevel }}</span>
                <span style="color:var(--text-3);font-size:11px;margin-left:4px">T{{ topProfit.tier }}</span>
              </p>
              <p style="font-size:12px;color:var(--text-3)">
                Marge moy. <span class="t-gold t-mono" style="font-weight:600">{{ topProfit.avgMargin >= 0 ? '+' : '' }}{{ topProfit.avgMargin.toFixed(1) }}%</span>
                · meilleure à <span class="t-gold">{{ topProfit.bestCity }}</span>
              </p>
              <div style="display:flex;gap:6px;margin-top:auto">
                <NuxtLink :to="`/items/${topProfit.uniqueName}`" class="ds-btn primary sm">Voir l'item →</NuxtLink>
                <NuxtLink to="/items/profit" class="ds-btn sm">Tous les profits</NuxtLink>
              </div>
            </template>
            <template v-else>
              <p>Calcul de la meilleure opportunité craft en cours…</p>
              <NuxtLink to="/items/profit" class="ds-btn primary sm" style="margin-top:auto">Analyse de profit →</NuxtLink>
            </template>
          </div>
        </div>
      </div>

      <div v-if="activeMega === 'builds'" class="mega" @mouseenter="cancelClose">
        <div class="mega-grid">
          <div class="mega-col">
            <h4>Créer</h4>
            <ul>
              <li>
                <NuxtLink to="/builds/create">
                  <div>
                    <div>Créateur de build</div>
                    <div class="desc">Composez votre setup complet</div>
                  </div>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/builds/create?mode=zvz">
                  <div>
                    <div>Template ZvZ</div>
                    <div class="desc">Préconfiguration guerre de guildes</div>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Parcourir</h4>
            <ul>
              <li><NuxtLink to="/builds">Tous les builds publics</NuxtLink></li>
              <li><NuxtLink to="/builds?gameMode=Solo+PvP">Solo PvP</NuxtLink></li>
              <li><NuxtLink to="/builds?gameMode=ZvZ">ZvZ</NuxtLink></li>
              <li><NuxtLink to="/builds?gameMode=Ganking">Ganking</NuxtLink></li>
              <li><NuxtLink to="/builds?gameMode=HCE">HCE</NuxtLink></li>
              <li><NuxtLink to="/builds/collections">Collections</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Mes builds</h4>
            <ul>
              <li><NuxtLink to="/builds/me">Mes builds sauvegardés</NuxtLink></li>
              <li><NuxtLink to="/builds/me/collections">Mes collections</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-cta">
            <span class="label">Build Creator</span>
            <p>Construisez votre setup complet, choisissez vos spells Q/W/E, partagez en un lien — même sans compte.</p>
            <NuxtLink to="/builds/create" class="ds-btn primary sm" style="margin-top:auto">
              Créer un build →
            </NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="activeMega === 'pvp'" class="mega" @mouseenter="cancelClose">
        <div class="mega-grid">
          <div class="mega-col">
            <h4>Killboard</h4>
            <ul>
              <li>
                <NuxtLink to="/killboard">
                  <div>
                    <div>Kills récents</div>
                    <div class="desc">Flux PvP Europe en temps réel</div>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Guildes</h4>
            <ul>
              <li>
                <NuxtLink to="/killboard">
                  <div>
                    <div>Rechercher une guilde</div>
                    <div class="desc">Stats, membres, top kills</div>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Joueurs</h4>
            <ul>
              <li>
                <NuxtLink to="/killboard">
                  <div>
                    <div>Rechercher un joueur</div>
                    <div class="desc">Stats PvP, équipement récent</div>
                  </div>
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div class="mega-cta">
            <span class="label">Killboard</span>
            <p>Suivez les batailles en temps réel. Recherchez un joueur ou une guilde pour voir leurs stats PvP complètes.</p>
            <NuxtLink to="/killboard" class="ds-btn primary sm" style="margin-top:auto">Ouvrir le Killboard →</NuxtLink>
          </div>
        </div>
      </div>

      <div v-if="activeMega === 'admin'" class="mega" @mouseenter="cancelClose">
        <div class="mega-grid">
          <div class="mega-col">
            <h4>Supervision</h4>
            <ul>
              <li><NuxtLink to="/admin">Tableau de bord</NuxtLink></li>
              <li><NuxtLink to="/admin/data/imports">Workers & imports</NuxtLink></li>
              <li><NuxtLink to="/admin/data/market">Prix marché</NuxtLink></li>
              <li><NuxtLink to="/admin/data/system">Config système</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Utilisateurs</h4>
            <ul>
              <li><NuxtLink to="/admin/users">Gestion utilisateurs</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-col">
            <h4>Sources</h4>
            <ul>
              <li><NuxtLink to="/admin">API officielle Albion</NuxtLink></li>
              <li><NuxtLink to="/admin">API prix communautaire</NuxtLink></li>
              <li><NuxtLink to="/admin">Client du jeu (trad.)</NuxtLink></li>
            </ul>
          </div>
          <div class="mega-cta">
            <span class="label">État système</span>
            <p><span class="status live">Workers actifs</span><br/>Dernier import : <span class="t-mono t-gold">récent</span></p>
            <NuxtLink to="/admin" class="ds-btn primary sm" style="margin-top:auto">Ouvrir la console →</NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- ===== PAGE CONTENT ===== -->
    <main style="flex:1;position:relative;z-index:2">
      <slot />
    </main>

    <!-- ===== FOOTER ===== -->
    <footer class="app-footer" style="position:relative;z-index:2">
      <div class="footer-inner">
        <div class="row" style="gap:14px">
          <span class="t-eyebrow">Albion Codex</span>
          <span class="t-dim" style="font-size:12px">v0.1 · build 1</span>
        </div>
        <div class="row" style="gap:16px">
          <NuxtLink v-if="auth.isAdmin.value" to="/admin" class="t-dim" style="font-size:12px">État système</NuxtLink>
          <NuxtLink to="/settings" class="t-dim" style="font-size:12px">Paramètres</NuxtLink>
          <span class="t-dim" style="font-size:12px">Outil tiers · non affilié à Sandbox Interactive</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()
const route = useRoute()
const router = useRouter()

const { data: topProfitRaw } = useTopProfit()
const topProfit = computed(() => (topProfitRaw.value ?? [])[0] ?? null)

const activeMega = ref<string | null>(null)
const userMenuOpen = ref(false)
const searchQuery = ref('')
const searchFocused = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

interface SearchItem { uniqueName: string; name: string; tier: number }
const searchResults = ref<SearchItem[]>([])

watch(searchQuery, async (q) => {
  if (q.length < 2) { searchResults.value = []; return }
  try {
    const res = await $fetch<{ data: SearchItem[] }>('/api/v1/items', { query: { q, limit: 6 } })
    searchResults.value = res.data.map((i: any) => ({
      uniqueName: i.uniqueName,
      name: i.name ?? i.uniqueName,
      tier: i.tier,
    }))
  } catch {
    searchResults.value = []
  }
})

function goSearch() {
  if (!searchQuery.value.trim()) return
  router.push({ path: '/items', query: { q: searchQuery.value.trim() } })
  searchFocused.value = false
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false }, 150)
}

function openMega(key: string) {
  cancelClose()
  userMenuOpen.value = false
  activeMega.value = key
}

function startClose() {
  closeTimer = setTimeout(() => { activeMega.value = null }, 120)
}

function cancelClose() {
  if (closeTimer) clearTimeout(closeTimer)
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
  if (userMenuOpen.value) activeMega.value = null
}

async function onLogout() {
  userMenuOpen.value = false
  await auth.logout()
}

function handleOutsideClick(e: MouseEvent) {
  const target = e.target as Element
  if (!target.closest('.sticky-header')) {
    activeMega.value = null
  }
  if (!target.closest('.nav-user-wrap')) {
    userMenuOpen.value = false
  }
}

function navigate(path: string) {
  activeMega.value = null
  userMenuOpen.value = false
  router.push(path)
}

function tierLabel(t: number) {
  return ['', 'Novice', 'Apprenti', 'Journeyman', 'Adepte', 'Expert', 'Maître', 'Granmaître', 'Légendaire'][t] ?? ''
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      searchInput.value?.focus()
    }
    if (e.key === 'Escape') {
      activeMega.value = null
      searchFocused.value = false
      userMenuOpen.value = false
    }
  })
})
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-login-btn {
  margin-left: 4px;
  white-space: nowrap;
}
</style>
