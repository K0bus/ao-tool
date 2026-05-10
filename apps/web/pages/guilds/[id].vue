<template>
  <div class="page">
    <template v-if="guild.data.value">
      <div class="page-header">
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink>
          <span>·</span>
          <NuxtLink to="/killboard">Killboard</NuxtLink>
          <span>·</span>
          <span>{{ guild.data.value.Name }}</span>
        </div>
        <h1 class="page-title">{{ guild.data.value.Name }}</h1>
        <div class="guild-meta">
          <span v-if="guild.data.value.AllianceName" class="meta-tag">
            <NuxtLink :to="`/alliances/${guild.data.value.AllianceId}`" class="t-gold">
              [{{ guild.data.value.AllianceTag ?? guild.data.value.AllianceName }}]
            </NuxtLink>
          </span>
          <span v-if="guild.data.value.MemberCount" class="meta-tag t-dim">
            {{ guild.data.value.MemberCount }} membres
          </span>
          <span v-if="guild.data.value.Founded" class="meta-tag t-dim">
            Fondée {{ new Date(guild.data.value.Founded).getFullYear() }}
          </span>
        </div>
      </div>

      <div class="kb-toolbar">
        <PvpSearchBar />
      </div>

      <div class="pvp-guild-grid">
        <div class="pvp-guild-left">
          <div class="panel parchment">
            <div class="panel-header"><h3>Statistiques PvP</h3></div>
            <div class="panel-body">
              <div class="stat-row">
                <span class="label">Kill Fame</span>
                <span class="val t-gold t-mono">{{ guild.data.value.killFame ? formatFame(guild.data.value.killFame) : '—' }}</span>
              </div>
              <div class="stat-row">
                <span class="label">Death Fame</span>
                <span class="val t-mono">{{ guild.data.value.deathFame ? formatFame(guild.data.value.deathFame) : '—' }}</span>
              </div>
              <div class="stat-row">
                <span class="label">Ratio K/D</span>
                <span class="val t-mono">
                  {{ guild.data.value.killFame && guild.data.value.deathFame
                    ? fameRatio(guild.data.value.killFame, guild.data.value.deathFame)
                    : '—' }}
                </span>
              </div>
            </div>
          </div>

          <div class="panel parchment" style="margin-top:16px">
            <div class="panel-header">
              <h3>Top kills récents</h3>
            </div>
            <div v-if="topKills.pending.value && !topKills.data.value?.length" class="panel-body t-dim" style="padding:16px">
              Chargement…
            </div>
            <div v-else-if="topKills.data.value?.length" class="pvp-feed">
              <KillEventRow v-for="ev in topKills.data.value.slice(0, 10)" :key="ev.EventId" :event="ev" />
            </div>
            <div v-else class="panel-body t-dim" style="padding:16px;font-size:13px">
              Aucun kill récent trouvé.
            </div>
          </div>
        </div>

        <div class="pvp-guild-right">
          <div v-if="guild.data.value.AllianceId" class="panel" style="margin-bottom:16px">
            <div class="panel-header"><h3>Alliance</h3></div>
            <div class="panel-body" style="padding:14px 16px">
              <NuxtLink :to="`/alliances/${guild.data.value.AllianceId}`" class="t-gold" style="font-weight:600">
                {{ guild.data.value.AllianceName }}
              </NuxtLink>
            </div>
          </div>

          <div class="panel">
            <div class="panel-header">
              <h3>Membres</h3>
              <span class="t-dim t-mono" style="font-size:12px">{{ members.data.value?.length ?? 0 }}</span>
            </div>
            <div v-if="members.pending.value" class="panel-body t-dim" style="padding:16px">
              Chargement…
            </div>
            <div v-else-if="members.data.value?.length" class="members-table-wrap">
              <table class="ds-table">
                <thead>
                  <tr>
                    <th>Joueur</th>
                    <th class="num">PvE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in members.data.value" :key="m.Id">
                    <td>
                      <NuxtLink :to="`/players/${m.Id}`" class="member-link">
                        {{ m.Name }}
                      </NuxtLink>
                    </td>
                    <td class="num t-mono">
                      {{ m.LifetimeStatistics?.PvE?.Total ? formatFame(m.LifetimeStatistics.PvE.Total) : '—' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="panel-body t-dim" style="padding:16px;font-size:13px">
              Aucun membre trouvé.
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="guild.status.value === 'error'" class="page-error">
      <h2>Guilde introuvable</h2>
      <p class="t-dim">Cet identifiant de guilde n'existe pas ou n'est plus disponible.</p>
      <NuxtLink to="/killboard" class="ds-btn" style="margin-top:16px">← Killboard</NuxtLink>
    </div>

    <div v-else class="page-loading t-dim">Chargement…</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)
const { guild, members, topKills } = usePvpGuild(id)

useHead(() => ({
  title: guild.data.value ? `${guild.data.value.Name} — Albion Tool` : 'Guilde — Albion Tool',
}))
</script>

<style scoped>
.guild-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  flex-wrap: wrap;
}
.meta-tag {
  font-size: 13px;
}

.kb-toolbar {
  margin-bottom: 20px;
}

.pvp-guild-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 16px;
  align-items: start;
}

.pvp-guild-left,
.pvp-guild-right {
  display: flex;
  flex-direction: column;
}

.pvp-feed {
  display: flex;
  flex-direction: column;
}

.members-table-wrap {
  max-height: 480px;
  overflow-y: auto;
}

.member-link {
  color: var(--text-0);
  text-decoration: none;
  font-size: 13px;
}
.member-link:hover {
  color: var(--gold);
  text-decoration: underline;
}

.page-error,
.page-loading {
  padding: 48px 0;
  text-align: center;
}
.page-error h2 {
  font-family: var(--font-display);
  color: var(--text-0);
  margin-bottom: 8px;
}

@media (max-width: 900px) {
  .pvp-guild-grid {
    grid-template-columns: 1fr;
  }
}
</style>
