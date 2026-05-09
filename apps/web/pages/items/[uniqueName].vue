<template>
  <div class="page item-detail">
    <!-- Loading -->
    <template v-if="pending">
      <div class="page-header">
        <div class="skel" style="width:140px;height:14px;border-radius:4px;margin-bottom:12px" />
        <div class="skel" style="width:300px;height:28px;border-radius:4px" />
      </div>
      <div class="panel" style="padding:24px;display:flex;gap:20px;align-items:flex-start">
        <div class="skel" style="width:96px;height:96px;border-radius:8px;flex-shrink:0" />
        <div style="flex:1;display:flex;flex-direction:column;gap:10px">
          <div class="skel" style="width:220px;height:22px;border-radius:4px" />
          <div class="skel" style="width:160px;height:14px;border-radius:4px" />
          <div class="skel" style="width:120px;height:14px;border-radius:4px" />
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="error" class="panel" style="padding:48px;text-align:center">
      <div style="font-size:32px;margin-bottom:12px">✦</div>
      <p style="font-size:16px;font-weight:600;color:var(--text-0);margin-bottom:4px">Item introuvable</p>
      <p class="t-mono t-dim" style="font-size:12px;margin-bottom:20px">{{ route.params.uniqueName }}</p>
      <NuxtLink to="/items" class="ds-btn ghost">← Retour aux items</NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="item">
      <!-- Header -->
      <div class="page-header">
        <div class="breadcrumb">
          <NuxtLink to="/">Accueil</NuxtLink>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <NuxtLink to="/items">Items</NuxtLink>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          <span class="t-ellipsis" style="max-width:240px">{{ item.name }}</span>
        </div>
      </div>

      <!-- Hero panel -->
      <div class="panel parchment framed item-hero-panel" style="margin-bottom:16px">
        <div class="item-hero-body">
          <div :class="`item-frame q-${qualityClass} lg`">
            <img :src="`https://render.albiononline.com/v1/item/${item.uniqueName}.png`" :alt="item.name" loading="eager" />
            <span class="corner">T·{{ item.tier }}<span v-if="item.enchantmentLevel > 0">.{{ item.enchantmentLevel }}</span></span>
          </div>
          <div class="item-hero-meta">
            <div class="t-eyebrow">{{ item.shopCategory ?? item.itemType }}</div>
            <h1 style="font-size:24px;margin:4px 0 8px;color:var(--text-0)">{{ item.name }}</h1>
            <p class="t-mono t-dim" style="font-size:11px;margin-bottom:12px">{{ item.uniqueName }}</p>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
              <span v-if="item.shopSubcategory" class="tag">{{ item.shopSubcategory }}</span>
              <span v-if="item.isCraftable" class="tag success">Craftable</span>
              <span v-if="item.isRefinable" class="tag info">Raffinable</span>
              <span v-if="item.weight" class="tag">Poids · {{ item.weight }}</span>
              <span v-if="item.maxStackSize" class="tag">Stack · {{ item.maxStackSize.toLocaleString('fr-FR') }}</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <NuxtLink :to="`/crafting?id=${item.uniqueName}`" class="ds-btn primary">
                Crafting tree
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </NuxtLink>
              <NuxtLink to="/market" class="ds-btn ghost">Voir le marché</NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="ds-tabs" style="margin-bottom:16px">
        <button
          v-for="tab in availableTabs"
          :key="tab.id"
          :class="['ds-tab', activeTab === tab.id && 'active']"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Tab: Market -->
      <div v-if="activeTab === 'market'">
        <ItemMarketDashboard
          :unique-name="item.uniqueName"
          :live-prices="item.marketPrices ?? []"
        />
      </div>

      <!-- Tab: Overview -->
      <div v-if="activeTab === 'overview'" style="display:flex;flex-direction:column;gap:12px">
        <div v-if="description" class="panel">
          <div class="panel-header"><h3>Description</h3></div>
          <div style="padding:14px 18px;font-size:13px;color:var(--text-1);line-height:1.65">{{ description }}</div>
        </div>

        <div class="panel">
          <div class="panel-header"><h3>Noms par langue</h3></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
            <div v-for="loc in item.localizations" :key="loc.locale" style="padding:12px 16px;border-bottom:1px solid var(--border-divider)">
              <div style="font-size:10px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">{{ loc.locale }}</div>
              <div style="font-size:13px;color:var(--text-1)">{{ loc.name }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Crafting -->
      <div v-if="activeTab === 'crafting'" style="display:flex;flex-direction:column;gap:12px">
        <CraftingTree
          v-if="item.craftingRecipe"
          :item-unique-name="item.uniqueName"
          :ingredients="item.craftingRecipe.ingredients"
          :crafting-fame="item.craftingRecipe.craftingFame"
          :result-count="item.craftingRecipe.resultCount"
          :station-id="item.craftingRecipe.craftingStationId"
          title="Recette de craft"
        />
        <CityBonusPanel :bonuses="item.cityBonuses ?? []" />
      </div>

      <!-- Tab: Refining -->
      <div v-if="activeTab === 'refining'">
        <CraftingTree
          v-if="item.refiningRecipe"
          :item-unique-name="item.uniqueName"
          :ingredients="item.refiningRecipe.ingredients"
          :result-count="item.refiningRecipe.resultCount"
          :station-id="item.refiningRecipe.craftingStationId"
          title="Recette de raffinage"
        />
      </div>

      <!-- Tab: Variants -->
      <div v-if="activeTab === 'variants'">
        <ItemVariants
          :current-item="item"
          :base-item="item.baseItem"
          :variants="item.enchantVariants ?? []"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ItemIcon from '~/components/items/ItemIcon.vue'
import ItemTierBadge from '~/components/items/ItemTierBadge.vue'
import ItemVariants from '~/components/items/ItemVariants.vue'
import ItemMarketDashboard from '~/components/items/ItemMarketDashboard.vue'
import CraftingTree from '~/components/craft/CraftingTree.vue'
import CityBonusPanel from '~/components/craft/CityBonusPanel.vue'

definePageMeta({ layout: 'default' })

const route = useRoute()
const uniqueName = computed(() => route.params.uniqueName as string)

const { data: item, pending, error } = await useFetch(() => `/api/v1/items/${encodeURIComponent(uniqueName.value)}`, {
  key: () => `item-${uniqueName.value}`,
  transform: (res: { data: any }) => res.data,
})

const description = computed(() =>
  item.value?.localizations?.find((l: any) => l.locale === 'EN-US')?.description ?? null
)

const qualityClass = computed(() => {
  const t = item.value?.tier ?? 1
  if (t <= 3) return 'normal'
  if (t === 4) return 'good'
  if (t === 5) return 'outstanding'
  if (t === 6) return 'excellent'
  if (t >= 7) return 'masterpiece'
  return 'normal'
})

const availableTabs = computed(() => {
  if (!item.value) return []
  const tabs = [{ id: 'overview', label: 'Aperçu', count: 0 }]
  if (item.value.marketPrices?.length > 0) tabs.unshift({ id: 'market', label: 'Marché', count: 0 })
  if (item.value.craftingRecipe) tabs.push({ id: 'crafting', label: 'Craft', count: item.value.craftingRecipe.ingredients.length })
  if (item.value.refiningRecipe) tabs.push({ id: 'refining', label: 'Raffinage', count: item.value.refiningRecipe.ingredients.length })
  const variantCount = (item.value.enchantVariants?.length ?? 0) + (item.value.baseItem ? 1 : 0)
  if (variantCount > 0) tabs.push({ id: 'variants', label: 'Variantes', count: variantCount })
  return tabs
})

const activeTab = ref('overview')

watch(item, (v) => {
  if (!v) return
  if (v.marketPrices?.length > 0) activeTab.value = 'market'
  else if (v.craftingRecipe) activeTab.value = 'crafting'
  else if (v.refiningRecipe) activeTab.value = 'refining'
  else activeTab.value = 'overview'
}, { immediate: true })

useHead(() => ({
  title: item.value ? `${item.value.name} — Albion Codex` : 'Item — Albion Codex',
  meta: [{ name: 'description', content: item.value ? `${item.value.name} T${item.value.tier} — Craft, raffinage, marché` : '' }],
}))
</script>
