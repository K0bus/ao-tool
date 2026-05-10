<template>
  <div class="pvp-search" :class="{ open: isOpen }">
    <div class="ps-input-wrap">
      <svg class="ps-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        ref="inputRef"
        v-model="query"
        class="ps-input"
        type="text"
        placeholder="Rechercher un joueur ou une guilde…"
        autocomplete="off"
        @focus="isOpen = true"
        @blur="onBlur"
        @keydown.escape="close"
      />
      <button v-if="query" class="ps-clear" @mousedown.prevent="clear">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div v-if="isOpen && (hasResults || searching || query.length >= 2)" class="ps-dropdown">
      <div v-if="searching" class="ps-loading t-dim">Recherche…</div>

      <template v-else-if="hasResults">
        <div v-if="results.players.length" class="ps-section">
          <div class="ps-section-label">Joueurs</div>
          <button
            v-for="p in results.players.slice(0, 6)"
            :key="p.Id"
            class="ps-item"
            @mousedown.prevent="goToPlayer(p.Id)"
          >
            <span class="ps-avatar">{{ p.Name[0]?.toUpperCase() }}</span>
            <span class="ps-item-name">{{ p.Name }}</span>
            <span v-if="p.GuildName" class="ps-item-sub t-dim">{{ p.GuildName }}</span>
          </button>
        </div>

        <div v-if="results.guilds.length" class="ps-section">
          <div class="ps-section-label">Guildes</div>
          <button
            v-for="g in results.guilds.slice(0, 6)"
            :key="g.Id"
            class="ps-item"
            @mousedown.prevent="goToGuild(g.Id)"
          >
            <span class="ps-avatar guild">G</span>
            <span class="ps-item-name">{{ g.Name }}</span>
          </button>
        </div>
      </template>

      <div v-else-if="query.length >= 2 && !searching" class="ps-empty t-dim">
        Aucun résultat pour "{{ query }}"
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { query, results, searching, clear } = usePvpSearch()

const isOpen = ref(false)
const inputRef = ref<HTMLInputElement>()

const hasResults = computed(
  () => results.value.players.length > 0 || results.value.guilds.length > 0
)

function onBlur() {
  setTimeout(() => { isOpen.value = false }, 150)
}

function close() {
  isOpen.value = false
  inputRef.value?.blur()
}

function goToPlayer(id: string) {
  close()
  clear()
  navigateTo(`/players/${id}`)
}

function goToGuild(id: string) {
  close()
  clear()
  navigateTo(`/guilds/${id}`)
}
</script>

<style scoped>
.pvp-search {
  position: relative;
  max-width: 480px;
  width: 100%;
}

.ps-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.ps-icon {
  position: absolute;
  left: 12px;
  color: var(--text-4);
  pointer-events: none;
}

.ps-input {
  width: 100%;
  padding: 9px 36px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text-0);
  font-size: 13px;
  transition: border-color 0.15s;
}
.ps-input:focus {
  outline: none;
  border-color: var(--gold-dim);
}
.ps-input::placeholder { color: var(--text-4); }

.ps-clear {
  position: absolute;
  right: 10px;
  padding: 4px;
  color: var(--text-4);
  border-radius: 3px;
}
.ps-clear:hover { color: var(--text-1); }

.ps-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  z-index: 50;
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
}

.ps-loading,
.ps-empty {
  padding: 12px 16px;
  font-size: 13px;
}

.ps-section { padding: 6px 0; }

.ps-section-label {
  padding: 6px 16px 4px;
  font-size: 10px;
  font-family: var(--font-display);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gold-dim);
}

.ps-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 16px;
  text-align: left;
  transition: background 0.1s;
}
.ps-item:hover { background: var(--bg-4); }

.ps-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(201,161,74,0.15);
  color: var(--gold);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ps-avatar.guild {
  background: rgba(99,136,168,0.15);
  color: var(--info);
}

.ps-item-name {
  font-size: 13px;
  color: var(--text-0);
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ps-item-sub {
  font-size: 11px;
  flex-shrink: 0;
}
</style>
