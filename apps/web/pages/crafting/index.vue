<template>
  <div class="page crafting-page">
    <div class="page-header">
      <div>
        <div class="crumbs">
          <NuxtLink to="/">Accueil</NuxtLink><span class="sep">/</span>Simulateur de craft
        </div>
        <h1>Simulateur de craft</h1>
        <p class="t-muted" style="margin-top:6px">Calcul RRR · Focus · Fees · Profit réel — choisissez la meilleure stratégie.</p>
      </div>
    </div>

    <div class="crafting-3col">

      <!-- ═══════════════════════════════════════
           COLONNE GAUCHE — Arbre de craft
           ═══════════════════════════════════════ -->
      <div class="col-tree">

        <!-- Item selector -->
        <div class="panel">
          <div class="panel-header">
            <h3>Item à crafter</h3>
            <span v-if="selectedItem" class="tag">T{{ selectedItem.tier }}</span>
          </div>
          <div class="panel-body">

            <!-- Selected item -->
            <div v-if="selectedItem" class="selected-item">
              <div class="item-frame" style="width:64px;height:64px;position:relative;flex-shrink:0">
                <img :src="`https://render.albiononline.com/v1/item/${selectedItem.uniqueName}.png`" :alt="selectedItem.name" />
                <span :class="`tier-badge t${selectedItem.tier}`" style="position:absolute;left:3px;top:3px">T{{ selectedItem.tier }}</span>
              </div>
              <div class="si-meta">
                <div class="si-name">{{ selectedItem.name }}</div>
                <div class="si-id t-dim t-mono">{{ selectedItem.uniqueName }}</div>
                <button class="ds-btn ghost sm" style="margin-top:6px" @click="clearItem">Changer</button>
              </div>
            </div>

            <!-- Search -->
            <div v-else>
              <div class="field" style="position:relative;margin:0">
                <label class="field-label">Rechercher un item craftable</label>
                <div style="position:relative">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gold);pointer-events:none"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    v-model="itemSearch"
                    class="ds-input"
                    style="padding-left:32px"
                    type="text"
                    placeholder="Ex: Hache T8, Arc avalonien…"
                    @input="onItemSearch"
                  />
                </div>
                <div v-if="searchResults.length" class="search-dropdown">
                  <div
                    v-for="r in searchResults"
                    :key="r.uniqueName"
                    class="sd-row"
                    @click="handleSelectItem(r)"
                  >
                    <img :src="`https://render.albiononline.com/v1/item/${r.uniqueName}.png`" :alt="r.name" width="28" height="28" style="border-radius:3px;background:var(--bg-2);flex-shrink:0" />
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;color:var(--text-0)">{{ r.name }}</div>
                      <div style="font-size:11px;color:var(--text-3);font-family:var(--font-mono)">{{ r.uniqueName }}</div>
                    </div>
                    <span class="tag">T{{ r.tier }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Tree panel -->
        <div class="panel">
          <div class="panel-header">
            <h3>Arbre de craft</h3>
            <label class="view-toggle" :class="{ checked: listMode }" @click.prevent="listMode = !listMode">
              <input type="checkbox" class="vt-input" :checked="listMode" readonly />
              <span class="vt-track"><span class="vt-thumb"></span></span>
              <span class="vt-label">Vue liste</span>
            </label>
          </div>
          <div class="tree-body" :class="{ 'list-mode': listMode }">

            <div v-if="!selectedItem" class="tree-empty">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6"/><path d="M12 8 7 14v8M12 8l5 6v8"/><circle cx="12" cy="2" r="1"/><circle cx="7" cy="14" r="1"/><circle cx="17" cy="14" r="1"/></svg>
              <span>Sélectionnez un item pour afficher son arbre</span>
            </div>

            <div v-else-if="treePending" class="tree-empty">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold);animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span>Chargement…</span>
            </div>

            <div v-else-if="!layoutData" class="tree-empty">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.4" style="color:var(--text-3)"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <span>Aucune recette trouvée.</span>
            </div>

            <!-- Graph view -->
            <div v-else-if="!listMode" class="tree-wrap">
              <div class="tree-stage" :style="{ width: layoutData.totalW + 'px', height: layoutData.totalH + 'px' }">
                <svg class="tree-svg" :width="layoutData.totalW" :height="layoutData.totalH">
                  <path
                    v-for="(conn, i) in connectorData"
                    :key="i"
                    :d="conn.d"
                    fill="none"
                    :stroke="conn.active ? 'rgba(201,161,74,0.35)' : 'rgba(120,120,120,0.18)'"
                    :stroke-width="conn.active ? '1.4' : '1'"
                    :stroke-dasharray="conn.active ? undefined : '4 3'"
                  />
                </svg>
                <div
                  v-for="(node, i) in layoutData.allNodes"
                  :key="i"
                  class="tree-node"
                  :class="[
                    { root: node.isRoot, leaf: node.isLeaf, 'node-inactive': !activeNodes.has(node) },
                    !node.isRoot ? `decision-${strategyMap.get(node.uniqueName)?.decision ?? 'buy'}` : ''
                  ]"
                  :style="{ left: node.x + 'px', top: node.y + 'px', width: NODE_W + 'px', height: NODE_H + 'px' }"
                >
                  <button
                    v-if="!node.isRoot && strategyMap.get(node.uniqueName)?.hasRecipe && activeNodes.has(node)"
                    class="tn-strategy-badge"
                    :class="[strategyMap.get(node.uniqueName)?.decision, { override: strategyMap.get(node.uniqueName)?.isOverridden }]"
                    @click.stop="toggleOverride(node.uniqueName)"
                  >
                    <span v-if="strategyMap.get(node.uniqueName)?.isOverridden" class="badge-dot" />
                    {{ strategyMap.get(node.uniqueName)?.decision === 'craft' ? 'CRAFT' : 'ACHETER' }}
                  </button>
                  <div class="tn-img">
                    <img :src="`https://render.albiononline.com/v1/item/${node.uniqueName}.png`" :alt="node.name" loading="lazy" />
                    <span :class="`tier-badge t${node.tier}`" style="position:absolute;left:4px;top:4px">T{{ node.tier }}</span>
                  </div>
                  <div class="tn-meta">
                    <div class="tn-name">{{ node.name }}</div>
                    <div class="tn-qty t-mono">× {{ fmtQty(node.qty) }}</div>
                    <div class="tn-price t-mono" :class="effectiveCost(node) > 0 ? '' : 't-dim'">
                      {{ effectiveCost(node) > 0 ? fmt(effectiveCost(node)) + ' ◇' : '—' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- List view -->
            <div v-else class="tree-list">
              <CraftTreeListNode :node="layoutData.root" :depth="0" />
            </div>

          </div>
        </div>

        <!-- Shopping list -->
        <div v-if="shoppingList.length" class="panel">
          <div class="panel-header">
            <h3>Liste de courses</h3>
            <span class="t-dim" style="font-size:12px">{{ params.craftCity }} · {{ params.quantity }}×</span>
          </div>
          <div class="shop-grid">
            <div v-for="mat in shoppingList" :key="mat.uniqueName" class="shop-card">
              <div class="item-frame" style="width:40px;height:40px;flex-shrink:0">
                <img :src="`https://render.albiononline.com/v1/item/${mat.uniqueName}.png`" :alt="mat.name" loading="lazy" />
              </div>
              <div class="sc-meta">
                <div class="sc-name">{{ mat.name }}</div>
              </div>
              <div class="sc-qty t-mono">× {{ fmtQty(mat.qty) }}</div>
              <div class="sc-price t-mono t-gold">{{ mat.unitPrice > 0 ? fmt(mat.unitPrice * mat.qty) + ' ◇' : '—' }}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- ═══════════════════════════════════════
           COLONNE CENTRE — Paramètres
           ═══════════════════════════════════════ -->
      <div class="col-params">
        <div class="panel sticky-panel">
          <div class="panel-header"><h3>Paramètres</h3></div>
          <div class="panel-body params-body">

            <!-- Cities -->
            <div class="params-section">
              <div class="params-section-label">Villes</div>

              <div class="field">
                <label class="field-label">Ville de craft</label>
                <select v-model="params.craftCity" class="ds-input">
                  <option v-for="c in CITIES" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <div class="field">
                <label class="field-label">Ville de vente</label>
                <select v-model="params.sellCity" class="ds-input">
                  <option v-for="c in SELL_CITIES" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <!-- Fees -->
            <div class="params-section">
              <div class="params-section-label">Frais de station</div>

              <div class="field">
                <label class="field-label">Type de station</label>
                <select v-model="stationType" class="ds-input" @change="onStationTypeChange">
                  <option value="public">Station publique royale (999◇/100)</option>
                  <option value="road">Station road/route (1 500◇/100)</option>
                  <option value="hideout_t7">Hideout T7 (~500◇/100)</option>
                  <option value="hideout_t8">Hideout T8 (~300◇/100)</option>
                  <option value="free">Station privée (gratuit)</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>

              <div class="param">
                <div class="param-head">
                  <label>Silver / 100 nutrition</label>
                  <span class="t-mono t-gold">{{ params.silverPer100Nutrition }}◇</span>
                </div>
                <input v-model.number="params.silverPer100Nutrition" type="number" class="ds-input" min="0" max="10000" step="1" style="margin-top:4px" />
              </div>

              <!-- Nutrition info when item selected -->
              <div v-if="simResult" class="nutrition-info">
                <div class="rrr-row">
                  <span>Nutrition requise</span>
                  <span class="t-mono">{{ simResult.item.nutritionRequired }}</span>
                </div>
                <div class="rrr-row">
                  <span>Fee estimée / run</span>
                  <span class="t-mono t-gold">{{ fmt((simResult.item.nutritionRequired / 100) * params.silverPer100Nutrition) }}◇</span>
                </div>
              </div>

              <div class="param" style="margin-top:10px">
                <div class="param-head">
                  <label>Taxe de vente</label>
                  <span class="t-mono t-gold">{{ params.sellFeePercent.toFixed(1) }}%</span>
                </div>
                <input v-model.number="params.sellFeePercent" type="range" class="range" min="0" max="10" step="0.5" />
              </div>
            </div>

            <!-- Quantity + Quality -->
            <div class="params-section">
              <div class="params-section-label">Production</div>

              <div class="field">
                <label class="field-label">Quantité craftée</label>
                <input v-model.number="params.quantity" class="ds-input" type="number" min="1" max="9999" />
              </div>

              <div class="field">
                <label class="field-label">Qualité de vente</label>
                <select v-model.number="params.quality" class="ds-input">
                  <option :value="1">Normal (Q1)</option>
                  <option :value="2">Bon (Q2)</option>
                  <option :value="3">Excellent (Q3)</option>
                  <option :value="4">Maître (Q4)</option>
                  <option :value="5">Chef-d'œuvre (Q5)</option>
                </select>
              </div>
            </div>

            <!-- Focus toggle -->
            <div class="params-section">
              <div class="params-section-label">Focus</div>
              <div class="toggle-row big">
                <div>
                  <div class="label">Utiliser le Focus</div>
                  <div class="t-dim" style="font-size:11px;margin-top:2px">Meilleur RRR, consomme des focus points</div>
                </div>
                <label class="ds-switch">
                  <input v-model="params.useFocus" type="checkbox" />
                  <span class="ds-track"><span class="ds-thumb"></span></span>
                </label>
              </div>

              <!-- RRR info from simulation -->
              <div v-if="simResult" class="rrr-info">
                <div class="rrr-row">
                  <span>RRR base</span>
                  <span class="t-mono">{{ (simResult.returnRates.base * 100).toFixed(1) }}%</span>
                </div>
                <div class="rrr-row focus-row">
                  <span>RRR avec focus</span>
                  <span class="t-mono t-gold">{{ (simResult.returnRates.focus * 100).toFixed(1) }}%</span>
                </div>
                <div v-if="simResult.cityOutputBonus > 0" class="rrr-row bonus-row">
                  <span>Bonus output {{ simResult.marketData.craftCity }}</span>
                  <span class="t-mono" style="color:var(--success)">+{{ simResult.cityOutputBonus }}%</span>
                </div>
              </div>
            </div>

            <!-- Reset overrides -->
            <button
              v-if="hasOverrides"
              class="ds-btn ghost sm"
              style="width:100%;margin-top:8px"
              @click="resetOverrides"
            >
              Réinitialiser les décisions manuelles
            </button>

          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════
           COLONNE DROITE — Dashboard profit
           ═══════════════════════════════════════ -->
      <div class="col-dashboard">

        <!-- Simulation loading state -->
        <div v-if="simPending && !simResult" class="panel" style="text-align:center;padding:40px 20px">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--gold);animation:spin 1s linear infinite;margin:0 auto 12px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <div style="color:var(--text-3);font-size:13px">Calcul en cours…</div>
        </div>

        <div v-else-if="!selectedItem" class="panel dashboard-empty">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
          <div>Sélectionnez un item pour simuler la rentabilité</div>
        </div>

        <div v-else-if="simError" class="panel dashboard-empty">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--danger)"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <div style="color:var(--danger)">{{ simError }}</div>
        </div>

        <template v-else-if="simResult">

          <!-- ── Scenario tabs ── -->
          <div class="scenario-tabs">
            <button
              class="stab"
              :class="{ active: !params.useFocus }"
              @click="params.useFocus = false"
            >
              Sans Focus
              <span v-if="simResult.scenarios.noFocus.profit > 0" class="stab-profit" style="color:var(--success)">
                {{ fmt(simResult.scenarios.noFocus.profit) }} ◇
              </span>
              <span v-else-if="simResult.scenarios.noFocus.profit < 0" class="stab-profit" style="color:var(--danger)">
                {{ fmt(simResult.scenarios.noFocus.profit) }} ◇
              </span>
            </button>
            <button
              v-if="simResult.scenarios.focus && simResult.item.isFocusable"
              class="stab"
              :class="{ active: params.useFocus }"
              @click="params.useFocus = true"
            >
              Avec Focus
              <span v-if="simResult.scenarios.focus.profit > 0" class="stab-profit" style="color:var(--success)">
                {{ fmt(simResult.scenarios.focus.profit) }} ◇
              </span>
              <span v-else-if="simResult.scenarios.focus.profit < 0" class="stab-profit" style="color:var(--danger)">
                {{ fmt(simResult.scenarios.focus.profit) }} ◇
              </span>
            </button>
          </div>

          <!-- ── Profit hero ── -->
          <div class="panel profit-hero" :class="isProfitable ? 'profitable' : 'loss'">
            <div class="ph-left">
              <div class="ph-label">Profit net ({{ params.quantity }}×)</div>
              <div class="ph-value" :class="isProfitable ? 'pos' : 'neg'">
                {{ activeScenario && activeScenario.profit >= 0 ? '+' : '' }}{{ activeScenario ? fmt(activeScenario.profit) : '—' }} ◇
              </div>
            </div>
            <div class="ph-right">
              <div class="kpi-mini">
                <div class="kpi-mini-val" :class="isProfitable ? 'pos' : 'neg'">{{ activeScenario ? activeScenario.margin.toFixed(1) : '—' }}%</div>
                <div class="kpi-mini-label">Marge</div>
              </div>
              <div class="kpi-mini">
                <div class="kpi-mini-val">{{ activeScenario && activeScenario.breakEvenSellPrice > 0 ? fmt(activeScenario.breakEvenSellPrice) : '—' }}</div>
                <div class="kpi-mini-label">Break-even</div>
              </div>
            </div>
          </div>

          <!-- ── Focus comparison card ── -->
          <div v-if="simResult.item.isFocusable && simResult.scenarios.focus" class="panel">
            <div class="panel-header"><h3>Comparaison focus</h3></div>
            <div class="focus-compare">
              <div class="fc-col" :class="{ active: !params.useFocus }">
                <div class="fc-label">Sans focus</div>
                <div class="fc-rr">RRR {{ (simResult.returnRates.base * 100).toFixed(1) }}%</div>
                <div class="fc-profit" :class="simResult.scenarios.noFocus.profit > 0 ? 'pos' : 'neg'">
                  {{ fmt(simResult.scenarios.noFocus.profit) }} ◇
                </div>
                <div class="fc-margin t-dim">{{ simResult.scenarios.noFocus.margin.toFixed(1) }}%</div>
              </div>
              <div class="fc-arrow">→</div>
              <div class="fc-col" :class="{ active: params.useFocus }">
                <div class="fc-label">Avec focus</div>
                <div class="fc-rr t-gold">RRR {{ (simResult.returnRates.focus * 100).toFixed(1) }}%</div>
                <div class="fc-profit" :class="simResult.scenarios.focus.profit > 0 ? 'pos' : 'neg'">
                  {{ fmt(simResult.scenarios.focus.profit) }} ◇
                </div>
                <div class="fc-margin t-gold">{{ simResult.scenarios.focus.margin.toFixed(1) }}%</div>
              </div>
              <div class="fc-delta">
                <div class="fc-delta-label">Gain focus</div>
                <div
                  class="fc-delta-val"
                  :class="simResult.scenarios.focus.profit > simResult.scenarios.noFocus.profit ? 'pos' : 'neg'"
                >
                  {{ simResult.scenarios.focus.profit > simResult.scenarios.noFocus.profit ? '+' : '' }}{{ fmt(simResult.scenarios.focus.profit - simResult.scenarios.noFocus.profit) }} ◇
                </div>
              </div>
            </div>
          </div>

          <!-- ── Cost breakdown ── -->
          <div v-if="activeScenario" class="panel">
            <div class="panel-header"><h3>Détail des coûts</h3></div>
            <div class="breakdown-table">
              <div class="btr label-row">
                <span>Matières brutes</span>
                <span class="t-mono">{{ fmt(activeScenario.rawMaterialsCost) }} ◇</span>
              </div>
              <div class="btr return-row">
                <span>— Retour matières (RRR)</span>
                <span class="t-mono" style="color:var(--success)">−{{ fmt(activeScenario.returnedValue) }} ◇</span>
              </div>
              <div class="btr subtotal-row">
                <span>= Matières nettes</span>
                <span class="t-mono">{{ fmt(activeScenario.netMaterialsCost) }} ◇</span>
              </div>
              <div class="btr">
                <span>+ Fee station ({{ params.silverPer100Nutrition }}◇/100 nutri)</span>
                <span class="t-mono">+{{ fmt(activeScenario.craftFee) }} ◇</span>
              </div>
              <div class="btr total-row">
                <span>Coût total craft</span>
                <span class="t-mono">{{ fmt(activeScenario.totalCraftCost) }} ◇</span>
              </div>
            </div>

            <div class="breakdown-sep">Revenus</div>

            <div class="breakdown-table">
              <div v-if="simResult.cityOutputBonus > 0" class="btr bonus-row">
                <span>Output × {{ params.quantity }} (+{{ simResult.cityOutputBonus }}% bonus)</span>
                <span class="t-mono" style="color:var(--success)">{{ fmtQty(activeScenario.effectiveOutput) }} unités</span>
              </div>
              <div v-else class="btr">
                <span>Output × {{ params.quantity }}</span>
                <span class="t-mono">{{ fmtQty(activeScenario.effectiveOutput) }} unités</span>
              </div>
              <div class="btr">
                <span>Prix de vente</span>
                <span class="t-mono">{{ simResult.marketData.sellPriceMin ? fmt(simResult.marketData.sellPriceMin) + ' ◇' : 'N/A' }}</span>
              </div>
              <div class="btr">
                <span>Revenu brut</span>
                <span class="t-mono">{{ fmt(activeScenario.grossRevenue) }} ◇</span>
              </div>
              <div class="btr return-row">
                <span>— Taxe marché ({{ params.sellFeePercent.toFixed(1) }}%)</span>
                <span class="t-mono" style="color:var(--danger)">−{{ fmt(activeScenario.sellFee) }} ◇</span>
              </div>
              <div class="btr subtotal-row">
                <span>= Revenu net</span>
                <span class="t-mono">{{ fmt(activeScenario.netRevenue) }} ◇</span>
              </div>
            </div>
          </div>

          <!-- ── Ingredients ── -->
          <div v-if="simResult.ingredients.length" class="panel">
            <div class="panel-header">
              <h3>Matières premières</h3>
              <span class="t-dim" style="font-size:12px">{{ params.craftCity }}</span>
            </div>
            <div class="ing-table">
              <div
                v-for="ing in simResult.ingredients"
                :key="ing.itemId"
                class="ing-row"
              >
                <div class="ing-img">
                  <img :src="`https://render.albiononline.com/v1/item/${ing.uniqueName}.png`" :alt="ing.name" loading="lazy" />
                  <span :class="`tier-badge t${ing.tier}`" style="position:absolute;left:1px;top:1px;font-size:8px;padding:0 2px">T{{ ing.tier }}</span>
                </div>
                <div class="ing-info">
                  <div class="ing-name">{{ ing.name }}</div>
                  <div class="ing-detail t-mono t-dim">
                    × {{ fmtQty(ing.totalQuantity) }}
                    <span v-if="ing.hasCraftingRecipe" class="ing-badge">craftable</span>
                    <span v-if="ing.maxReturnRate !== null" class="ing-badge muted">cap {{ (ing.maxReturnRate * 100).toFixed(0) }}%</span>
                  </div>
                </div>
                <div class="ing-costs">
                  <div class="t-mono">{{ ing.marketPrice > 0 ? fmt(ing.grossCost) + ' ◇' : '—' }}</div>
                  <div class="t-mono t-dim" style="font-size:11px">
                    {{ ing.marketPrice > 0 ? fmt(ing.marketPrice) + '/u' : 'Prix manquant' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Recommendation ── -->
          <div class="panel" :class="simResult.recommendation.decision === 'PROFITABLE' ? 'panel-success' : 'panel-warning'">
            <div class="panel-header">
              <h3>Recommandation</h3>
              <span
                class="tag"
                :class="simResult.recommendation.decision === 'PROFITABLE' ? 'tag-success' : 'tag-danger'"
              >
                {{ simResult.recommendation.decision === 'PROFITABLE' ? 'Rentable' : 'Non rentable' }}
              </span>
            </div>
            <div style="padding:0 16px 16px">
              <div v-if="simResult.recommendation.useFocus" class="rec-focus-badge">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                Focus recommandé
              </div>
              <ul class="rec-list">
                <li v-for="(line, i) in simResult.recommendation.reasoning" :key="i">{{ line }}</li>
              </ul>
            </div>
          </div>

          <!-- ── Craft vs Buy ── -->
          <div v-if="simResult.marketData.buyPriceMax" class="panel">
            <div class="panel-header"><h3>Craft vs Achat direct</h3></div>
            <div class="cvb-grid">
              <div class="cvb-card craft" :class="{ winner: activeScenario && activeScenario.totalCraftCost < (simResult.marketData.buyPriceMax * params.quantity) }">
                <div class="cvb-label">Coût craft</div>
                <div class="cvb-val t-mono">{{ activeScenario ? fmt(activeScenario.totalCraftCost) : '—' }} ◇</div>
                <div class="cvb-per t-dim t-mono">{{ activeScenario ? fmt(activeScenario.totalCraftCost / params.quantity) : '—' }} /u</div>
              </div>
              <div class="cvb-vs">vs</div>
              <div class="cvb-card buy" :class="{ winner: activeScenario && (simResult.marketData.buyPriceMax * params.quantity) < activeScenario.totalCraftCost }">
                <div class="cvb-label">Achat direct</div>
                <div class="cvb-val t-mono">{{ fmt(simResult.marketData.buyPriceMax * params.quantity) }} ◇</div>
                <div class="cvb-per t-dim t-mono">{{ fmt(simResult.marketData.buyPriceMax) }} /u</div>
              </div>
            </div>
          </div>

        </template>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Simulateur de craft — Albion Codex' })

import { useCraftingSimulator } from '~/composables/useCraftingSimulator'

const route = useRoute()

const {
  selectedItem,
  treeData,
  treePending,
  simResult,
  simPending,
  simError,
  params,
  manualOverrides,
  activeScenario,
  isProfitable,
  selectItem,
  clearItem,
} = useCraftingSimulator()

const CITIES = ['Caerleon', 'Bridgewatch', 'Lymhurst', 'Fort Sterling', 'Martlock', 'Thetford']
const SELL_CITIES = [...CITIES, 'Black Market']

const STATION_PRESETS: Record<string, number | null> = {
  public: 999,
  road: 1500,
  hideout_t7: 500,
  hideout_t8: 300,
  free: 0,
  custom: null,
}

const stationType = ref('public')

function onStationTypeChange() {
  const preset = STATION_PRESETS[stationType.value]
  if (preset !== null) params.value.silverPer100Nutrition = preset
}

const NODE_W = 200
const NODE_H = 96
const GAP_X = 28
const GAP_Y = 64

// ── Search ──────────────────────────────────────────────────────────────────

const itemSearch = ref('')
const searchResults = ref<any[]>([])
let searchTimer: ReturnType<typeof setTimeout>

function onItemSearch() {
  clearTimeout(searchTimer)
  if (!itemSearch.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const res = await $fetch('/api/v1/items', { query: { q: itemSearch.value, craftable: 'true', limit: 8 } }) as any
      searchResults.value = res.data || []
    }
    catch { searchResults.value = [] }
  }, 280)
}

async function handleSelectItem(item: any) {
  itemSearch.value = ''
  searchResults.value = []
  await selectItem(item)
}

onMounted(async () => {
  const id = route.query.id as string | undefined
  if (!id) return
  try {
    const res = await $fetch(`/api/v1/items/${encodeURIComponent(id)}`) as any
    if (res?.data) await handleSelectItem(res.data)
  }
  catch { /* ignore */ }
})

// ── Tree view mode ───────────────────────────────────────────────────────────

const listMode = ref(false)

// ── Strategy engine (client-side for tree visualization) ────────────────────

interface NodeStrategy {
  decision: 'craft' | 'buy'
  auto: 'craft' | 'buy'
  craftCostPerUnit: number
  buyCostPerUnit: number
  isOverridden: boolean
  hasRecipe: boolean
}

function getMarketPrice(marketPrices: any[], targetCity: string): number {
  if (!marketPrices?.length) return 0
  const cityPrices = marketPrices.filter((p: any) =>
    p.location?.name === targetCity && p.quality === 1 && p.sellPriceMin > 0
  )
  if (cityPrices.length) return Math.min(...cityPrices.map((p: any) => p.sellPriceMin))
  const fallback = marketPrices.filter((p: any) => p.quality === 1 && p.sellPriceMin > 0)
  return fallback.length ? Math.min(...fallback.map((p: any) => p.sellPriceMin)) : 0
}

// Use actual return rate from simulation if available, else fallback to 0
const treeReturnRate = computed(() => {
  if (!simResult.value) return 0
  return params.value.useFocus
    ? simResult.value.returnRates.focus
    : simResult.value.returnRates.base
})

function buildStrategy(apiNode: any, map: Map<string, NodeStrategy>, isRoot = false): number {
  const buyPrice = getMarketPrice(apiNode.marketPrices, params.value.craftCity)
  const hasRecipe = !!(apiNode.recipe?.ingredients?.length)

  if (!hasRecipe) {
    map.set(apiNode.uniqueName, {
      decision: 'buy', auto: 'buy',
      craftCostPerUnit: Infinity, buyCostPerUnit: buyPrice,
      isOverridden: false, hasRecipe: false,
    })
    return buyPrice
  }

  const resultCount = apiNode.recipe.resultCount || 1
  let rawIngredientCostPerRun = 0
  for (const ing of apiNode.recipe.ingredients) {
    rawIngredientCostPerRun += buildStrategy(ing, map) * ing.quantity
  }

  const rr = treeReturnRate.value
  const returnSav = rawIngredientCostPerRun * rr
  // Station fee: (nutritionRequired / 100) × silverPer100Nutrition
  const nutritionRequired = apiNode.recipe.silverCost ?? 0
  const stationFee = (nutritionRequired / 100) * params.value.silverPer100Nutrition
  const craftCostPerUnit = (rawIngredientCostPerRun - returnSav + stationFee) / resultCount

  const auto: 'craft' | 'buy' = buyPrice === 0 || craftCostPerUnit <= buyPrice ? 'craft' : 'buy'
  const override = isRoot ? undefined : (manualOverrides.value[apiNode.uniqueName] as 'craft' | 'buy' | undefined)
  const decision: 'craft' | 'buy' = isRoot ? 'craft' : (override ?? auto)

  map.set(apiNode.uniqueName, {
    decision, auto,
    craftCostPerUnit,
    buyCostPerUnit: buyPrice,
    isOverridden: !isRoot && override !== undefined,
    hasRecipe: true,
  })

  return decision === 'craft' ? craftCostPerUnit : buyPrice
}

const strategyMap = computed(() => {
  if (!treeData.value) return new Map<string, NodeStrategy>()
  const map = new Map<string, NodeStrategy>()
  buildStrategy(treeData.value, map, true)
  return map
})

const hasOverrides = computed(() => Object.keys(manualOverrides.value).length > 0)

function toggleOverride(uniqueName: string) {
  const s = strategyMap.value.get(uniqueName)
  if (!s?.hasRecipe) return
  const next = { ...manualOverrides.value }
  if (next[uniqueName] !== undefined) {
    delete next[uniqueName]
  }
  else {
    next[uniqueName] = s.decision === 'craft' ? 'buy' : 'craft'
  }
  manualOverrides.value = next
}

function resetOverrides() {
  manualOverrides.value = {}
}

function effectiveCost(node: DisplayNode): number {
  const s = strategyMap.value.get(node.uniqueName)
  if (!s) return node.marketPrice * node.qty
  const price = s.decision === 'craft' ? s.craftCostPerUnit : s.buyCostPerUnit
  return isFinite(price) ? price * node.qty : node.marketPrice * node.qty
}

// ── Tree display layout ──────────────────────────────────────────────────────

interface DisplayNode {
  uniqueName: string
  name: string
  tier: number
  type: string
  qty: number
  isLeaf: boolean
  isRoot: boolean
  children: DisplayNode[]
  x: number
  y: number
  subtreeW: number
  marketPrice: number
}

const MAX_TREE_DEPTH = 5

function buildDisplayNode(apiNode: any, targetQty: number, depth: number): DisplayNode {
  const hasRecipe = depth < MAX_TREE_DEPTH && apiNode.recipe?.ingredients?.length > 0
  const children: DisplayNode[] = []

  if (hasRecipe) {
    const resultCount = apiNode.recipe.resultCount || 1
    const runs = targetQty / resultCount
    for (const ing of apiNode.recipe.ingredients) {
      children.push(buildDisplayNode(ing, ing.quantity * runs, depth + 1))
    }
  }

  return {
    uniqueName: apiNode.uniqueName,
    name: apiNode.name,
    tier: apiNode.tier,
    type: apiNode.type,
    qty: targetQty,
    isLeaf: children.length === 0,
    isRoot: depth === 0,
    children,
    x: 0, y: 0, subtreeW: 0,
    marketPrice: getMarketPrice(apiNode.marketPrices, params.value.craftCity),
  }
}

function applyLayout(node: DisplayNode, depth: number, startX: number): number {
  node.y = depth * (NODE_H + GAP_Y)
  if (!node.children.length) {
    node.x = startX
    node.subtreeW = NODE_W
    return NODE_W
  }
  let cursor = startX
  let totalW = 0
  node.children.forEach((c, i) => {
    const cw = applyLayout(c, depth + 1, cursor)
    cursor += cw + GAP_X
    totalW += cw + (i > 0 ? GAP_X : 0)
  })
  node.subtreeW = Math.max(totalW, NODE_W)
  node.x = startX + (node.subtreeW - NODE_W) / 2
  return node.subtreeW
}

function flattenNodes(node: DisplayNode, out: DisplayNode[] = []): DisplayNode[] {
  out.push(node)
  node.children.forEach(c => flattenNodes(c, out))
  return out
}

const layoutData = computed(() => {
  if (!treeData.value || !treeData.value.recipe) return null
  const root = buildDisplayNode(treeData.value, params.value.quantity, 0)
  const totalW = applyLayout(root, 0, 0)
  const allNodes = flattenNodes(root)
  const maxDepth = Math.max(...allNodes.map(n => Math.round(n.y / (NODE_H + GAP_Y))))
  const totalH = (maxDepth + 1) * (NODE_H + GAP_Y) - GAP_Y + 20
  return { root, totalW: Math.max(totalW, NODE_W), totalH, allNodes }
})

const activeNodes = computed(() => {
  if (!layoutData.value || !strategyMap.value.size) return new Set<DisplayNode>()
  const active = new Set<DisplayNode>()
  function walk(node: DisplayNode) {
    active.add(node)
    const s = strategyMap.value.get(node.uniqueName)
    if (node.isRoot || s?.decision === 'craft') node.children.forEach(walk)
  }
  walk(layoutData.value.root)
  return active
})

const connectorData = computed(() => {
  if (!layoutData.value) return []
  return layoutData.value.allNodes.flatMap(n =>
    n.children.map(c => {
      const x1 = n.x + NODE_W / 2
      const y1 = n.y + NODE_H
      const x2 = c.x + NODE_W / 2
      const y2 = c.y
      const my = (y1 + y2) / 2
      return {
        d: `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`,
        active: activeNodes.value.has(n) && activeNodes.value.has(c),
      }
    })
  )
})

// ── Shopping list ────────────────────────────────────────────────────────────

interface ShoppingEntry {
  uniqueName: string
  name: string
  unitPrice: number
  qty: number
}

function collectBuyNodes(apiNode: any, acc: Map<string, ShoppingEntry>, qty: number, isRoot: boolean) {
  const s = strategyMap.value.get(apiNode.uniqueName)
  const shouldCraft = isRoot || (s?.decision === 'craft' && s?.hasRecipe)

  if (!shouldCraft) {
    const existing = acc.get(apiNode.uniqueName)
    if (existing) existing.qty += qty
    else acc.set(apiNode.uniqueName, {
      uniqueName: apiNode.uniqueName,
      name: apiNode.name,
      unitPrice: getMarketPrice(apiNode.marketPrices, params.value.craftCity),
      qty,
    })
    return
  }

  if (apiNode.recipe?.ingredients) {
    const runs = qty / (apiNode.recipe.resultCount || 1)
    for (const ing of apiNode.recipe.ingredients) {
      collectBuyNodes(ing, acc, ing.quantity * runs, false)
    }
  }
}

const shoppingList = computed(() => {
  if (!treeData.value || !strategyMap.value.size) return []
  const acc = new Map<string, ShoppingEntry>()
  collectBuyNodes(treeData.value, acc, params.value.quantity, true)
  return Array.from(acc.values())
})

// ── Provide to recursive list nodes ─────────────────────────────────────────
provide('strategyMap', strategyMap)
provide('toggleOverride', toggleOverride)

// ── Formatters ───────────────────────────────────────────────────────────────

function fmt(v: number) {
  if (!v && v !== 0) return '0'
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(2) + 'M'
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(1) + 'k'
  return sign + Math.round(abs).toLocaleString('fr-FR')
}

function fmtQty(v: number) {
  if (!v) return '0'
  return Number.isInteger(v) ? v.toString() : v.toFixed(1)
}
</script>

<style scoped>
/* ── Layout ── */
.crafting-3col {
  display: grid;
  grid-template-columns: minmax(0, 2fr) 240px minmax(0, 2fr);
  gap: 20px;
  align-items: start;
}

@media (max-width: 1200px) {
  .crafting-3col {
    grid-template-columns: 1fr 220px;
    grid-template-rows: auto auto;
  }
  .col-dashboard {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .crafting-3col {
    grid-template-columns: 1fr;
  }
}

/* ── Sticky params ── */
.sticky-panel {
  position: sticky;
  top: 80px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

/* ── Item selector ── */
.selected-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.si-meta {
  flex: 1;
  min-width: 0;
}

.si-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-0);
  line-height: 1.3;
}

.si-id {
  font-size: 11px;
  margin-top: 3px;
  word-break: break-all;
}

/* ── Params ── */
.params-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.params-section {
  border-bottom: 1px solid var(--border);
  padding: 12px 0 14px;
}

.params-section:first-child {
  padding-top: 0;
}

.params-section:last-child {
  border-bottom: none;
}

.params-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 10px;
}

.param { margin-bottom: 12px; }
.param:last-child { margin-bottom: 0; }

.param-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--text-2);
}

.toggle-row.big {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 2px 0;
}

.toggle-row.big .label {
  font-size: 13px;
  color: var(--text-1);
  font-weight: 500;
}

/* ── RRR / Nutrition info blocks ── */
.rrr-info,
.nutrition-info {
  margin-top: 10px;
  background: var(--bg-3);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rrr-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-3);
}

.focus-row {
  color: var(--text-2);
}

.bonus-row {
  color: var(--text-2);
}

/* ── Dashboard ── */
.dashboard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-3);
  font-size: 13px;
  text-align: center;
}

/* ── Scenario tabs ── */
.scenario-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.stab {
  flex: 1;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.15s;
}

.stab:hover {
  border-color: var(--gold-dim);
}

.stab.active {
  background: var(--bg-3);
  border-color: var(--gold);
  color: var(--text-0);
}

.stab-profit {
  font-size: 12px;
  font-family: var(--font-mono);
}

/* ── Profit hero ── */
.profit-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px !important;
  border-left: 3px solid var(--border);
}

.profit-hero.profitable {
  border-left-color: var(--success);
}

.profit-hero.loss {
  border-left-color: var(--danger);
}

.ph-label {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ph-value {
  font-size: 26px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
}

.ph-value.pos { color: var(--success); }
.ph-value.neg { color: var(--danger); }

.ph-right {
  display: flex;
  gap: 20px;
}

.kpi-mini {
  text-align: right;
}

.kpi-mini-val {
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-1);
  line-height: 1;
}

.kpi-mini-val.pos { color: var(--success); }
.kpi-mini-val.neg { color: var(--danger); }

.kpi-mini-label {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 3px;
}

/* ── Focus compare ── */
.focus-compare {
  padding: 12px 16px 16px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.fc-col {
  flex: 1;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
  transition: border-color 0.15s;
}

.fc-col.active {
  border-color: var(--gold);
}

.fc-label {
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.fc-rr {
  font-size: 12px;
  color: var(--text-2);
  margin-bottom: 6px;
}

.fc-profit {
  font-size: 15px;
  font-weight: 700;
  font-family: var(--font-mono);
}

.fc-margin {
  font-size: 12px;
  margin-top: 2px;
}

.fc-arrow {
  color: var(--text-3);
  font-size: 16px;
  flex-shrink: 0;
}

.fc-delta {
  flex-shrink: 0;
  text-align: center;
  min-width: 80px;
}

.fc-delta-label {
  font-size: 11px;
  color: var(--text-3);
  margin-bottom: 4px;
}

.fc-delta-val {
  font-size: 14px;
  font-weight: 700;
  font-family: var(--font-mono);
}

/* ── Breakdown table ── */
.breakdown-table {
  padding: 0 16px 8px;
}

.btr {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 5px 0;
  font-size: 13px;
  color: var(--text-2);
  border-bottom: 1px solid var(--bg-3);
}

.btr:last-child {
  border-bottom: none;
}

.btr.return-row {
  color: var(--text-3);
  font-size: 12px;
}

.btr.bonus-row {
  color: var(--text-2);
}

.btr.subtotal-row {
  color: var(--text-1);
  font-weight: 500;
  border-top: 1px solid var(--border);
  padding-top: 6px;
}

.btr.total-row {
  color: var(--text-0);
  font-weight: 600;
  border-top: 1px solid var(--border);
  padding-top: 6px;
}

.breakdown-sep {
  margin: 8px 16px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-3);
}

/* ── Ingredients table ── */
.ing-table {
  display: flex;
  flex-direction: column;
}

.ing-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--bg-3);
}

.ing-row:last-child {
  border-bottom: none;
}

.ing-img {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.ing-img img {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  background: var(--bg-2);
}

.ing-info {
  flex: 1;
  min-width: 0;
}

.ing-name {
  font-size: 13px;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ing-detail {
  font-size: 11px;
  margin-top: 2px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ing-badge {
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 10px;
  color: var(--text-3);
}

.ing-badge:not(.muted) {
  color: var(--gold-dim);
  border-color: var(--gold-dim);
}

.ing-costs {
  text-align: right;
  flex-shrink: 0;
  font-size: 13px;
  color: var(--text-1);
}

/* ── Recommendation ── */
.panel-success {
  border-left: 3px solid var(--success);
}

.panel-warning {
  border-left: 3px solid var(--danger);
}

.tag-success {
  background: rgba(var(--success-rgb, 80, 200, 120), 0.15);
  color: var(--success);
  border-color: var(--success);
}

.tag-danger {
  background: rgba(var(--danger-rgb, 220, 80, 80), 0.15);
  color: var(--danger);
  border-color: var(--danger);
}

.rec-focus-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(201, 161, 74, 0.12);
  border: 1px solid var(--gold-dim);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--gold);
  margin-bottom: 10px;
}

.rec-list {
  margin: 0;
  padding: 0 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rec-list li {
  font-size: 13px;
  color: var(--text-2);
  line-height: 1.5;
}

/* ── Craft vs Buy ── */
.cvb-grid {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 16px;
}

.cvb-card {
  flex: 1;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  transition: border-color 0.15s;
}

.cvb-card.winner {
  border-color: var(--success);
}

.cvb-label {
  font-size: 11px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.cvb-val {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-0);
}

.cvb-per {
  font-size: 11px;
  margin-top: 3px;
}

.cvb-vs {
  color: var(--text-3);
  font-size: 13px;
  flex-shrink: 0;
}

/* ── Utility ── */
.pos { color: var(--success) !important; }
.neg { color: var(--danger) !important; }

.field {
  margin-bottom: 10px;
}

.field:last-child {
  margin-bottom: 0;
}
</style>
