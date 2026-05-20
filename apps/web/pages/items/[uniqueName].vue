<template>
  <div class="page item-detail">
    <!-- Loading -->
    <template v-if="pending">
      <div class="page-header">
        <div class="skel" style="width:140px;height:14px;border-radius:4px;margin-bottom:12px" />
        <div class="skel" style="width:300px;height:28px;border-radius:4px" />
      </div>
      <div class="panel" style="padding:24px;display:flex;gap:20px;align-items:flex-start">
        <div class="skel" style="width:240px;height:240px;border-radius:8px;flex-shrink:0" />
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
      <!-- Page header -->
      <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span><NuxtLink to="/items">Items</NuxtLink><span class="sep">/</span>{{ item.name }}
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button v-if="isAdmin" @click="showRawData = !showRawData" class="ds-btn ghost">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            Raw Data
          </button>
          <NuxtLink v-if="item.isCraftable" :to="`/crafting?id=${item.uniqueName}`" class="ds-btn primary">
            Crafting tree
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </NuxtLink>
        </div>
      </div>

      <!-- Hero panel -->
      <div class="panel parchment framed item-hero-panel" style="margin-bottom:24px">
        <div class="item-hero-body">
          <!-- Item image -->
          <div :class="`item-frame q-${qualityFrameClass} item-hero-img`">
            <AoItemImage
              :unique-name="item.uniqueName"
              :display-name="item.name"
              :alt="item.name"
              loading="eager"
              :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
            />
            <span class="corner">T·{{ item.tier }}<span v-if="item.enchantmentLevel > 0">.{{ item.enchantmentLevel }}</span></span>
          </div>

          <!-- Item meta -->
          <div class="item-hero-meta">
            <!-- Tags row -->
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
              <span :class="`tier-badge t${item.tier}`">T{{ item.tier }}</span>
              <span class="tag">{{ item.shopSubcategory ?? item.shopCategory ?? item.itemType }}</span>
              <span v-if="item.isCraftable" class="tag success">Craftable</span>
              <span v-if="item.isRefinable" class="tag info">Raffinable</span>
              <span class="t-dim t-mono" style="font-size:11px">{{ item.uniqueName }}</span>
            </div>

            <h1 style="font-size:28px;margin:4px 0 6px;color:var(--text-0);font-family:var(--font-display)">{{ item.name }}</h1>

            <p v-if="description" class="t-muted" style="max-width:640px;margin-bottom:12px;font-size:13px;line-height:1.6" v-html="parseAoDescription(description)">
            </p>

            <!-- Quality switch -->
            <div class="qual-switch">
              <span class="t-eyebrow">Qualité</span>
              <button
                v-for="(label, qi) in qualityLabels.slice(0, item.maxQuality)"
                :key="qi + 1"
                :class="['qchip', selectedQuality === qi + 1 && 'active']"
                @click="selectedQuality = qi + 1"
              >
                <span :class="`quality-dot q-${qualityDotClasses[qi]}`"></span>
                {{ label }}
              </button>
            </div>

            <!-- Quick stats grid -->
            <div class="qstats">
              <!-- Tier — always -->
              <div class="qst">
                <span class="qst-k">Tier</span>
                <span class="qst-v t-mono">T{{ item.tier }}</span>
              </div>
              <!-- Enchantement -->
              <div v-if="item.enchantmentLevel > 0" class="qst">
                <span class="qst-k">Enchant</span>
                <span class="qst-v t-mono">.{{ item.enchantmentLevel }}</span>
              </div>
              <!-- Item Power -->
              <div v-if="item.stats?.itemPower" class="qst">
                <span class="qst-k">IP</span>
                <span class="qst-v t-mono">{{ item.stats.itemPower }}</span>
              </div>
              <!-- Durabilité -->
              <div v-if="item.stats?.durability" class="qst">
                <span class="qst-k">Durabilité</span>
                <span class="qst-v t-mono">{{ item.stats.durability }}</span>
              </div>
              <!-- Poids -->
              <div v-if="item.weight" class="qst">
                <span class="qst-k">Poids</span>
                <span class="qst-v t-mono">{{ item.weight }}<span style="font-size:11px;color:var(--text-3)"> kg</span></span>
              </div>
              <!-- Stack max -->
              <div v-if="item.maxStackSize > 1" class="qst">
                <span class="qst-k">Stack</span>
                <span class="qst-v t-mono">{{ item.maxStackSize.toLocaleString('fr-FR') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Raw Data Panel (Admin Only) -->
      <div v-if="isAdmin && showRawData" class="panel" style="margin-bottom:24px; padding: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 16px; font-family: var(--font-display);">Raw Data</h3>
          <button class="ds-btn ghost" @click="showRawData = false" style="padding: 4px 8px; font-size: 12px;">Fermer</button>
        </div>
        <JsonViewer :value="item" />
      </div>

      <!-- Price heatmap -->
      <ItemPriceHeatmap
        :prices="item.resolvedPrices ?? []"
        :max-quality="item.maxQuality"
        style="margin-bottom:24px"
      />

      <!-- Two-column info grid -->
      <div class="id-grid">
        <!-- LEFT column -->
        <div class="id-col">
          <!-- Price chart panel -->
          <div class="panel">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
              <h3>Historique des prix</h3>
              <div style="display:flex;gap:4px">
                <button
                  v-for="period in chartPeriods"
                  :key="period.days"
                  :class="['ds-btn ghost', chartDays === period.days && 'active']"
                  style="padding:3px 8px;font-size:11px"
                  @click="chartDays = period.days"
                >
                  {{ period.label }}
                </button>
              </div>
            </div>
            <div style="padding:16px 18px">
              <ItemSvgChart
                :unique-name="item.uniqueName"
                :quality="selectedQuality"
                :days="chartDays"
              />
            </div>
          </div>

          <!-- City prices panel -->
          <div class="panel">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
              <h3>Marché par cité</h3>
              <span v-if="latestUpdate" class="tag" style="font-size:11px">{{ latestUpdate }}</span>
            </div>
            <div v-if="!filteredPrices.length" style="padding:24px 18px;text-align:center;color:var(--text-3);font-size:13px">
              Aucun prix de marché disponible pour cette qualité
            </div>
            <div v-else style="overflow-x:auto">
              <table class="ds-table" style="width:100%">
                <thead>
                  <tr>
                    <th>Cité</th>
                    <th style="text-align:right">Vente</th>
                    <th style="text-align:right">Achat</th>
                    <th style="text-align:right">Spread</th>
                    <th style="text-align:right">MAJ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="price in filteredPrices" :key="price.locationId">
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span
                          style="width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block"
                          :style="{ background: cityColor(price.location) }"
                        ></span>
                        {{ price.location?.name ?? price.locationId }}
                      </div>
                    </td>
                    <td style="text-align:right;color:var(--gold);font-family:var(--font-mono);font-size:13px">
                      {{ price.sellPrice > 0 ? price.sellPrice.toLocaleString('fr-FR') : '—' }}
                    </td>
                    <td style="text-align:right;font-family:var(--font-mono);font-size:13px;color:var(--text-2)">
                      {{ price.buyPrice > 0 ? price.buyPrice.toLocaleString('fr-FR') : '—' }}
                    </td>
                    <td style="text-align:right;font-family:var(--font-mono);font-size:12px" :class="spreadClass(price)">
                      {{ spread(price) }}
                    </td>
                    <td style="text-align:right;font-size:11px;color:var(--text-3)">
                      {{ formatRelative(price.updatedAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RIGHT column -->
        <div class="id-col">
          <!-- Volume de Ventes (Sales Volume) -->
          <div class="panel parchment framed" style="margin-bottom:24px">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
              <h3 style="display:flex;align-items:center;gap:6px">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Volume des Ventes
              </h3>
              <!-- City Dropdown Selector -->
              <div v-if="availableLocations.length > 0" class="ds-select-wrapper" style="font-size:12px">
                <select v-model="selectedLocationId" class="ds-select" style="padding:4px 8px;font-size:12px;background:var(--bg-panel);border:1px solid var(--border-divider);border-radius:var(--radius-sm);color:var(--text-0)">
                  <option v-for="loc in availableLocations" :key="loc.id" :value="loc.id">
                    {{ loc.name }}
                  </option>
                </select>
              </div>
            </div>

            <div style="padding:18px;display:flex;flex-direction:column;gap:16px">
              <!-- No Data State -->
              <div v-if="availableLocations.length === 0" style="padding:12px;text-align:center;color:var(--text-3);font-size:13px">
                Aucune donnée de volume de ventes disponible pour cet objet.
              </div>

              <template v-else>
                <!-- Key Stats Grid -->
                <div class="volume-stats-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <!-- Avg Daily 7d -->
                  <div class="vol-stat-card" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-divider);border-radius:var(--radius-sm);padding:10px 12px;display:flex;flex-direction:column;gap:4px">
                    <span style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em">Moyenne 7 jours</span>
                    <span style="font-size:18px;font-weight:600;color:var(--gold-bright);font-family:var(--font-mono)">
                      {{ avgSales7d.toLocaleString('fr-FR') }}
                      <span style="font-size:11px;font-weight:normal;color:var(--text-2);font-family:var(--font-body)">/ jour</span>
                    </span>
                  </div>

                  <!-- Avg Daily 30d -->
                  <div class="vol-stat-card" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-divider);border-radius:var(--radius-sm);padding:10px 12px;display:flex;flex-direction:column;gap:4px">
                    <span style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em">Moyenne 30 jours</span>
                    <span style="font-size:18px;font-weight:600;color:var(--text-0);font-family:var(--font-mono)">
                      {{ avgSales30d.toLocaleString('fr-FR') }}
                      <span style="font-size:11px;font-weight:normal;color:var(--text-2);font-family:var(--font-body)">/ jour</span>
                    </span>
                  </div>
                </div>

                <!-- Peak hour badge -->
                <div v-if="peakHourSlot && peakHourSlot.count > 0" class="peak-activity-alert" style="background:rgba(201,161,74,0.04);border:1px solid rgba(201,161,74,0.15);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;line-height:1.45;color:var(--text-1);display:flex;align-items:center;gap:10px">
                  <span style="font-size:16px;color:var(--gold)">✦</span>
                  <div>
                    Période d'activité maximale constatée vers <strong style="color:var(--gold-bright)">{{ peakHourSlot.hour }}h - {{ peakHourSlot.hour + 1 }}h</strong>
                     avec environ <strong style="color:var(--text-0)">{{ peakHourSlot.count }}</strong> unités échangées en moyenne.
                  </div>
                </div>

                <!-- Hourly Slots Bar Chart -->
                <div>
                  <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;font-family:var(--font-display);margin-bottom:12px">
                    Ventes par créneaux horaires
                  </div>

                  <!-- Chart canvas area using dynamic SVG and CSS -->
                  <div class="hourly-chart-container" style="background:rgba(0,0,0,0.1);border-radius:var(--radius-sm);border:1px solid var(--border-divider);padding:16px 12px 8px">
                    <div style="height:120px;display:flex;align-items:flex-end;gap:3px;position:relative">
                      <!-- Grid lines -->
                      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none">
                        <div style="border-top:1px dashed rgba(255,255,255,0.05);width:100%"></div>
                        <div style="border-top:1px dashed rgba(255,255,255,0.05);width:100%"></div>
                        <div style="border-top:1px dashed rgba(255,255,255,0.05);width:100%"></div>
                      </div>

                      <!-- Hourly Bars -->
                      <div
                        v-for="item in hourlyDistribution"
                        :key="item.hour"
                        style="flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;position:relative"
                        class="chart-bar-col"
                      >
                        <!-- Tooltip on hover -->
                        <div class="chart-tooltip" style="position:absolute;bottom:calc(100% + 6px);background:var(--bg-panel);border:1px solid var(--gold);border-radius:var(--radius-xs);padding:4px 6px;font-size:10px;font-family:var(--font-mono);white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.15s ease, transform 0.15s ease;transform:translateY(4px);z-index:10;box-shadow:var(--shadow-lg)">
                          {{ item.hour }}h: <strong>{{ item.count }}</strong> u/h
                        </div>

                        <!-- Bar element -->
                        <div
                          :style="{ height: `${maxHourlyCount > 0 ? (item.count / maxHourlyCount) * 100 : 0}%` }"
                          style="width:100%;background:linear-gradient(to top, var(--gold-dim) 20%, var(--gold) 100%);border-radius:1px 1px 0 0;transition:all 0.3s ease;cursor:pointer"
                          :class="['bar-fill', item.hour === peakHourSlot?.hour && 'peak-bar']"
                        ></div>
                      </div>
                    </div>

                    <!-- X-Axis hours labels -->
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding:0 2px;font-size:9px;font-family:var(--font-mono);color:var(--text-3)">
                      <span>00h</span>
                      <span>06h</span>
                      <span>12h</span>
                      <span>18h</span>
                      <span>23h</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Farming & Breeding Panel (Only for farming items) -->
          <div v-if="isFarmingItem" class="panel parchment framed">
            <div class="panel-header"><h3>Agriculture & Élevage</h3></div>
            
            <div style="display:flex;flex-direction:column;gap:16px;padding:18px">
              <!-- Section: Croissance & Culture -->
              <div v-if="item.growTime !== null || item.grownItemUniqueName !== null || item.harvestSeedChance !== null || item.offspringChance !== null">
                <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;font-family:var(--font-display);margin-bottom:10px;display:flex;align-items:center;gap:6px">
                  <span style="color:var(--gold)">✦</span> Croissance & Culture
                </div>
                
                <div style="display:flex;flex-direction:column;gap:8px">
                  <!-- Temps de pousse -->
                  <div v-if="item.growTime !== null" class="stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border-divider)">
                    <span style="font-size:12px;color:var(--text-2)">Temps de croissance</span>
                    <span style="font-size:13px;color:var(--text-0);font-family:var(--font-mono)">{{ formatDuration(item.growTime) }}</span>
                  </div>

                  <!-- Chance de retour (Graine / Offspring) -->
                  <div v-if="item.harvestSeedChance !== null || item.offspringChance !== null" class="stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border-divider)">
                    <span style="font-size:12px;color:var(--text-2)">{{ item.grownItemUniqueName ? 'Chance de rejeton' : 'Retour de graine' }}</span>
                    <span style="font-size:13px;color:var(--text-0);font-family:var(--font-mono)">{{ formatPercent(item.offspringChance ?? item.harvestSeedChance) }}</span>
                  </div>

                  <!-- Résultat Adulte / Récolte -->
                  <div v-if="item.grownItemUniqueName || item.harvestResultItem" style="margin-top:4px">
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Résultat obtenu :</div>
                    
                    <!-- Grown animal -->
                    <NuxtLink v-if="item.grownItemUniqueName" :to="`/items/${item.grownItemUniqueName}`" class="rmi" style="text-decoration:none;display:flex;align-items:center">
                      <div class="item-frame q-normal" style="width:40px;height:40px;flex-shrink:0">
                        <AoItemImage
                          :unique-name="item.grownItemUniqueName"
                          :display-name="item.grownItemName"
                          :alt="item.grownItemName"
                          :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
                        />
                      </div>
                      <div class="rmi-meta" style="margin-left:10px">
                        <div class="rmi-name" style="font-size:13px;color:var(--text-1);font-weight:500">{{ item.grownItemName }}</div>
                        <div class="rmi-id" style="font-size:10px;color:var(--text-3)">{{ item.grownItemUniqueName }}</div>
                      </div>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3);margin-left:auto"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </NuxtLink>

                    <!-- Harvest crop -->
                    <NuxtLink v-else-if="item.harvestResultItem" :to="`/items/${item.harvestResultItem.uniqueName}`" class="rmi" style="text-decoration:none;display:flex;align-items:center">
                      <div class="item-frame q-normal" style="width:40px;height:40px;flex-shrink:0">
                        <AoItemImage
                          :unique-name="item.harvestResultItem.uniqueName"
                          :display-name="item.harvestResultItem.name"
                          :alt="item.harvestResultItem.name"
                          :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
                        />
                      </div>
                      <div class="rmi-meta" style="margin-left:10px">
                        <div class="rmi-name" style="font-size:13px;color:var(--text-1);font-weight:500">{{ item.harvestResultItem.name }}</div>
                        <div class="rmi-id" style="font-size:10px;color:var(--text-3)">{{ item.harvestResultItem.uniqueName }}</div>
                      </div>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3);margin-left:auto"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Section: Production Animale -->
              <div v-if="item.productLootList !== null || item.productProductionTime !== null">
                <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;font-family:var(--font-display);margin-bottom:10px;display:flex;align-items:center;gap:6px">
                  <span style="color:var(--gold)">✦</span> Production de l'Animal
                </div>
                
                <div style="display:flex;flex-direction:column;gap:8px">
                  <!-- Temps de production -->
                  <div v-if="item.productProductionTime !== null" class="stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border-divider)">
                    <span style="font-size:12px;color:var(--text-2)">Temps de production</span>
                    <span style="font-size:13px;color:var(--text-0);font-family:var(--font-mono)">{{ formatDuration(item.productProductionTime) }}</span>
                  </div>

                  <!-- Produit récolté -->
                  <div v-if="item.productResultItem || item.productLootList" style="margin-top:4px">
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Ressource produite :</div>
                    
                    <NuxtLink v-if="item.productResultItem" :to="`/items/${item.productResultItem.uniqueName}`" class="rmi" style="text-decoration:none;display:flex;align-items:center">
                      <div class="item-frame q-normal" style="width:40px;height:40px;flex-shrink:0">
                        <AoItemImage
                          :unique-name="item.productResultItem.uniqueName"
                          :display-name="item.productResultItem.name"
                          :alt="item.productResultItem.name"
                          :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
                        />
                      </div>
                      <div class="rmi-meta" style="margin-left:10px">
                        <div class="rmi-name" style="font-size:13px;color:var(--text-1);font-weight:500">{{ item.productResultItem.name }}</div>
                        <div class="rmi-id" style="font-size:10px;color:var(--text-3)">{{ item.productResultItem.uniqueName }}</div>
                      </div>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3);margin-left:auto"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </NuxtLink>

                    <div v-else class="rmi" style="display:flex;align-items:center;padding:10px;background:var(--bg-1);border-radius:var(--radius-sm)">
                      <div class="rmi-meta">
                        <div class="rmi-name" style="font-size:13px;color:var(--text-1)">{{ item.productLootList }}</div>
                        <div class="rmi-id" style="font-size:10px;color:var(--text-3)">Loot List ID</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Section: Alimentation & Soins -->
              <div v-if="item.favoriteFoodItemId !== null || item.nutritionMax !== null">
                <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;font-family:var(--font-display);margin-bottom:10px;display:flex;align-items:center;gap:6px">
                  <span style="color:var(--gold)">✦</span> Alimentation & Soins
                </div>
                
                <div style="display:flex;flex-direction:column;gap:8px">
                  <!-- Nutrition maximum -->
                  <div v-if="item.nutritionMax !== null" class="stat-row" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border-divider)">
                    <span style="font-size:12px;color:var(--text-2)">Nutrition max</span>
                    <span style="font-size:13px;color:var(--text-0);font-family:var(--font-mono)">{{ item.nutritionMax.toLocaleString('fr-FR') }}</span>
                  </div>

                  <!-- Nourriture préférée -->
                  <div v-if="item.favoriteFoodItemId" style="margin-top:4px">
                    <div style="font-size:11px;color:var(--text-3);margin-bottom:6px">Nourriture favorite (x2 de nutrition) :</div>
                    
                    <NuxtLink :to="`/items/${item.favoriteFoodItemId}`" class="rmi" style="text-decoration:none;display:flex;align-items:center">
                      <div class="item-frame q-normal" style="width:40px;height:40px;flex-shrink:0">
                        <AoItemImage
                          :unique-name="item.favoriteFoodItemId"
                          :display-name="item.favoriteFoodName"
                          :alt="item.favoriteFoodName"
                          :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
                        />
                      </div>
                      <div class="rmi-meta" style="margin-left:10px">
                        <div class="rmi-name" style="font-size:13px;color:var(--text-1);font-weight:500">{{ item.favoriteFoodName }}</div>
                        <div class="rmi-id" style="font-size:10px;color:var(--text-3)">{{ item.favoriteFoodItemId }}</div>
                      </div>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3);margin-left:auto"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                    </NuxtLink>

                    <!-- Quantité de nourriture à fournir -->
                    <div v-if="item.nutritionMax" style="margin-top:8px;padding:10px;background:rgba(201,161,74,0.03);border:1px solid var(--border-divider);border-radius:var(--radius-sm);font-size:11px;line-height:1.45;color:var(--text-2)">
                      <div style="margin-bottom:4px;color:var(--gold);font-weight:500">
                        ❖ Quantité requise pour remplir la jauge :
                      </div>
                      <div>• Nourriture favorite : <strong style="color:var(--gold-bright)">{{ Math.ceil(item.nutritionMax / 96) }}</strong> unités (96 nutrition / u)</div>
                      <div>• Autres plantes : <strong style="color:var(--text-0)">{{ Math.ceil(item.nutritionMax / 48) }}</strong> unités (48 nutrition / u)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Item stats panel -->
          <div class="panel">
            <div class="panel-header"><h3>Statistiques</h3></div>
            <div v-if="hasStats" style="display:flex;flex-direction:column">
              <div
                v-for="stat in statRows"
                :key="stat.key"
                class="stat-row"
                style="display:flex;justify-content:space-between;align-items:center;padding:10px 18px;border-bottom:1px solid var(--border-divider)"
              >
                <span style="font-size:12px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.1em;font-family:var(--font-display)">{{ stat.label }}</span>
                <span style="font-size:14px;color:var(--text-1);font-family:var(--font-mono)">{{ stat.value }}</span>
              </div>
            </div>
            <div v-else style="padding:24px 18px;text-align:center;color:var(--text-3);font-size:13px">
              Aucune statistique disponible
            </div>
          </div>

          <!-- Recipe mini panel (only if craftable) -->
          <div v-if="item.craftingRecipe" class="panel parchment">
            <div class="panel-header" style="display:flex;align-items:center;justify-content:space-between">
              <h3>Recette · synthèse</h3>
              <NuxtLink :to="`/crafting?id=${item.uniqueName}`" class="t-gold" style="font-size:12px">
                Tree complet →
              </NuxtLink>
            </div>
            <div class="recipe-mini">
              <div
                v-for="ing in item.craftingRecipe.ingredients"
                :key="ing.itemId"
                class="rmi"
              >
                <div class="item-frame q-normal" style="width:44px;height:44px;flex-shrink:0">
                  <AoItemImage
                    :unique-name="ing.itemId"
                    :display-name="ing.item?.name"
                    :alt="ing.item?.name ?? ing.itemId"
                    :img-style="{ width: '100%', height: '100%', objectFit: 'contain' }"
                  />
                </div>
                <div class="rmi-meta">
                  <div class="rmi-name">{{ ing.item?.name ?? ing.itemId }}</div>
                  <div class="rmi-id">{{ ing.item?.uniqueName ?? ing.itemId }}</div>
                </div>
                <div class="rmi-qty">×{{ ing.quantity }}</div>
              </div>
            </div>
            <div class="panel-footer" style="padding:10px 18px;display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--border-divider);font-size:12px;color:var(--text-3)">
              <span>Nutrition requise</span>
              <span v-if="item.craftingRecipe.silverCost > 0" class="t-mono" style="color:var(--gold)">{{ item.craftingRecipe.silverCost.toLocaleString('fr-FR') }}</span>
              <span v-else class="t-muted">—</span>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import ItemSvgChart from '~/components/items/ItemSvgChart.vue'
import { parseAoDescription } from '~/utils/aoRender'
import { useAuth } from '~/composables/useAuth'

definePageMeta({ layout: 'default' })

const { isAdmin } = useAuth()
const showRawData = ref(false)

const route = useRoute()
const uniqueName = computed(() => route.params.uniqueName as string)

const { data: item, pending, error } = await useFetch(
  () => `/api/v1/items/${encodeURIComponent(uniqueName.value)}`,
  {
    key: () => `item-${uniqueName.value}`,
    transform: (res: { data: any }) => res.data,
  }
)

// --- Market Sales Volume History Logic ---
const selectedLocationId = ref('Caerleon')

// Available locations from marketHistory data
const availableLocations = computed(() => {
  if (!item.value?.marketHistory) return []
  const locationsMap = new Map<string, { id: string; name: string }>()
  for (const h of item.value.marketHistory) {
    if (h.locationId && !locationsMap.has(h.locationId)) {
      const resolved = item.value.resolvedPrices?.find((p: any) => p.locationId === h.locationId)?.location
      locationsMap.set(h.locationId, {
        id: h.locationId,
        name: resolved?.name ?? h.locationId
      })
    }
  }
  return [...locationsMap.values()]
})

// Automatically set default location to Caerleon, Black Market or first available
watchEffect(() => {
  if (availableLocations.value.length > 0) {
    if (!selectedLocationId.value || !availableLocations.value.some(l => l.id === selectedLocationId.value)) {
      const preferOrder = ['Caerleon', 'BlackMarket', 'Bridgewatch', 'Lymhurst', 'FortSterling', 'Martlock', 'Thetford']
      const found = preferOrder.find(id => availableLocations.value.some(l => l.id === id))
      selectedLocationId.value = found || availableLocations.value[0]!.id
    }
  }
})

// Daily history stats (timeScale = 24)
const dailyHistory = computed(() => {
  if (!item.value?.marketHistory) return []
  return item.value.marketHistory.filter(
    (h: any) =>
      h.timeScale === 24 &&
      h.quality === selectedQuality.value &&
      h.locationId === selectedLocationId.value
  )
})

// 7-day average daily sales volume
const avgSales7d = computed(() => {
  const data = dailyHistory.value
  if (!data.length) return 0
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const recent = data.filter((h: any) => new Date(h.timestamp).getTime() >= sevenDaysAgo)
  if (!recent.length) return 0
  const sum = recent.reduce((acc: number, h: any) => acc + h.itemCount, 0)
  return Math.round(sum / 7)
})

// 30-day average daily sales volume
const avgSales30d = computed(() => {
  const data = dailyHistory.value
  if (!data.length) return 0
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const recent = data.filter((h: any) => new Date(h.timestamp).getTime() >= thirtyDaysAgo)
  if (!recent.length) return 0
  const sum = recent.reduce((acc: number, h: any) => acc + h.itemCount, 0)
  return Math.round(sum / 30)
})

// Hourly history stats (timeScale = 1)
const hourlyHistory = computed(() => {
  if (!item.value?.marketHistory) return []
  return item.value.marketHistory.filter(
    (h: any) =>
      h.timeScale === 1 &&
      h.quality === selectedQuality.value &&
      h.locationId === selectedLocationId.value
  )
})

// Hour slots (00h-23h) transaction volume distribution
const hourlyDistribution = computed(() => {
  const distribution = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
  const data = hourlyHistory.value
  if (!data.length) return distribution

  for (const h of data) {
    const d = new Date(h.timestamp)
    const hour = d.getHours()
    if (hour >= 0 && hour < 24) {
      distribution[hour]!.count += h.itemCount
    }
  }

  const uniqueDays = new Set(data.map((h: any) => new Date(h.timestamp).toDateString())).size || 1
  return distribution.map(d => ({
    hour: d.hour,
    count: Math.round(d.count / uniqueDays),
  }))
})

// Peak activity hour slot
const peakHourSlot = computed(() => {
  const dist = hourlyDistribution.value
  if (!dist.some(d => d.count > 0)) return null
  let max = dist[0]!
  for (const d of dist) {
    if (d.count > max.count) {
      max = d
    }
  }
  return max
})

// Maximum hourly count for chart scaling
const maxHourlyCount = computed(() => {
  const counts = hourlyDistribution.value.map(d => d.count)
  return Math.max(...counts, 1)
})

const description = computed(() =>
  item.value?.localizations?.find((l: any) => l.locale === 'EN-US')?.description ?? null
)

// Quality selection (1-5)
const selectedQuality = ref(1)

// Chart period
const chartDays = ref(30)
const chartPeriods = [
  { label: '7j', days: 7 },
  { label: '30j', days: 30 },
  { label: '90j', days: 90 },
  { label: '1a', days: 365 },
]

// Quality labels and dot classes
const qualityLabels = ['Normale', 'Bonne', 'Remarquable', 'Excellente', "Chef-d'œuvre"]
const qualityDotClasses = ['normal', 'good', 'outstanding', 'excellent', 'masterpiece']

// Hero image quality frame class (based on selectedQuality)
const qualityFrameClass = computed(() => {
  return qualityDotClasses[selectedQuality.value - 1] ?? 'normal'
})

// City prices filtered by selectedQuality
const filteredPrices = computed(() => {
  if (!item.value?.resolvedPrices) return []
  return item.value.resolvedPrices.filter(
    (p: any) => p.quality === selectedQuality.value && (p.sellPrice > 0 || p.buyPrice > 0)
  )
})

// Latest update time across filtered prices
const latestUpdate = computed(() => {
  if (!filteredPrices.value.length) return null
  const dates = filteredPrices.value.map((p: any) => new Date(p.updatedAt).getTime()).filter(Boolean)
  if (!dates.length) return null
  return formatRelative(new Date(Math.max(...dates)).toISOString())
})

// City color mapping
function cityColor(location: any): string {
  if (!location) return '#5aab8a'
  const name = location.name ?? ''
  const type = location.type ?? ''
  if (name === 'Black Market') return '#4a4a4a'
  const royalColors: Record<string, string> = {
    Caerleon: '#c9a14a',
    Bridgewatch: '#c9614a',
    Lymhurst: '#7da04a',
    'Fort Sterling': '#6a9ec0',
    Martlock: '#8b72c8',
    Thetford: '#c47a3a',
  }
  if (type === 'ROYAL_CITY' && royalColors[name]) return royalColors[name]
  if (type === 'ROYAL_CITY') return '#c9a14a'
  return '#5aab8a'
}

// Spread calculation
function spread(price: any): string {
  if (!price.sellPrice || !price.buyPrice || price.sellPrice <= 0 || price.buyPrice <= 0) return '—'
  const pct = ((price.sellPrice - price.buyPrice) / price.buyPrice) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function spreadClass(price: any): string {
  if (!price.sellPrice || !price.buyPrice || price.sellPrice <= 0 || price.buyPrice <= 0) return 't-muted'
  const pct = ((price.sellPrice - price.buyPrice) / price.buyPrice) * 100
  return pct >= 0 ? 't-success' : 't-danger'
}

// Relative time
function formatRelative(dateStr: string | undefined | null): string {
  if (!dateStr) return '—'
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

// Stats section
const statKeyLabels: Record<string, string> = {
  slotType: 'Slot',
  itemPower: 'Item Power',
  durability: 'Durabilité',
  abilityPower: 'Puissance',
  craftingCategory: 'Catégorie craft',
}

const statRows = computed(() => {
  const rows: { key: string; label: string; value: string }[] = []
  const stats = item.value?.stats
  if (stats) {
    for (const [k, v] of Object.entries(stats)) {
      if (v !== null && v !== undefined) {
        rows.push({ key: k, label: statKeyLabels[k] ?? k, value: String(v) })
      }
    }
  }
  if (item.value?.weight) {
    rows.push({ key: 'weight', label: 'Poids', value: `${item.value.weight} kg` })
  }
  if (item.value?.maxStackSize > 0) {
    rows.push({ key: 'stack', label: 'Stack max', value: item.value.maxStackSize.toLocaleString('fr-FR') })
  }
  if (item.value?.enchantmentLevel !== undefined) {
    rows.push({ key: 'enchant', label: 'Enchantement', value: `.${item.value.enchantmentLevel}` })
  }
  return rows
})

const hasStats = computed(() => statRows.value.length > 0)

// Farming specific helpers
const isFarmingItem = computed(() => {
  if (!item.value) return false
  return (
    item.value.growTime !== null ||
    item.value.grownItemUniqueName !== null ||
    item.value.productLootList !== null ||
    item.value.favoriteFoodItemId !== null
  )
})

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const hours = Math.round(seconds / 3600)
  if (hours % 24 === 0) {
    const days = hours / 24
    return `${days} jour${days > 1 ? 's' : ''}`
  }
  return `${hours} heure${hours > 1 ? 's' : ''}`
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const pct = value * 100
  return `${pct.toFixed(1).replace('.0', '')}%`
}

useHead(() => ({
  title: item.value ? `${item.value.name} — Albion Codex` : 'Item — Albion Codex',
  meta: [{ name: 'description', content: item.value ? `${item.value.name} T${item.value.tier} — Craft, raffinage, marché` : '' }],
}))
</script>

<style scoped>
.chart-bar-col:hover .chart-tooltip {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.chart-bar-col:hover .bar-fill {
  background: linear-gradient(to top, var(--gold-bright) 20%, var(--gold-bright) 100%) !important;
  filter: drop-shadow(0 0 4px var(--gold-bright));
}

.peak-bar {
  background: linear-gradient(to top, var(--gold-bright) 0%, var(--gold-bright) 100%) !important;
}
</style>
