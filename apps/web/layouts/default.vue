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
                <img :src="`https://render.albiononline.com/v1/item/${item.uniqueName}.png`" :alt="item.name" />
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

        <!-- Icons -->
        <button class="nav-icon-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span class="dot" />
        </button>

        <NuxtLink to="/settings" class="nav-icon-btn" aria-label="Paramètres">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>
        </NuxtLink>

        <div class="nav-avatar" :title="auth.user.value?.username ?? 'Profil'">
          {{ (auth.user.value?.username?.[0] ?? 'A').toUpperCase() }}
        </div>
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
              <li><NuxtLink to="/crafting"><div><div>Calculateur de profit</div><div class="desc">Marge + taxes</div></div></NuxtLink></li>
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
            <p>Hache Avalonienne T8 — marge estimée <span class="t-gold t-mono">+18.4%</span> à Caerleon avec retour matières.</p>
            <NuxtLink to="/crafting" class="ds-btn primary sm" style="margin-top:auto">Voir le craft →</NuxtLink>
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
          <NuxtLink to="/admin" class="t-dim" style="font-size:12px">État système</NuxtLink>
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

const activeMega = ref<string | null>(null)
const searchQuery = ref('')
const searchFocused = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

interface SearchItem { uniqueName: string; name: string; tier: number }
const searchResults = ref<SearchItem[]>([])

watch(searchQuery, async (q) => {
  if (q.length < 2) { searchResults.value = []; return }
  try {
    const res = await $fetch<{ data: { items: SearchItem[] } }>('/api/v1/items', { query: { q, limit: 6 } })
    searchResults.value = res.data.items.map((i: any) => ({
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
  activeMega.value = key
}

function startClose() {
  closeTimer = setTimeout(() => { activeMega.value = null }, 120)
}

function cancelClose() {
  if (closeTimer) clearTimeout(closeTimer)
}

function handleOutsideClick(e: MouseEvent) {
  const target = e.target as Element
  if (!target.closest('.sticky-header')) {
    activeMega.value = null
  }
}

function navigate(path: string) {
  activeMega.value = null
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
</style>
