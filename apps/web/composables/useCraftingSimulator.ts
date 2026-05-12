export interface SimParams {
  craftCity: string
  sellCity: string
  quality: number
  useFocus: boolean
  silverPer100Nutrition: number
  isPremium: boolean
  quantity: number
}

export interface ScenarioCalc {
  useFocus: boolean
  rawMaterialsCost: number
  returnedValue: number
  netMaterialsCost: number
  craftFee: number
  totalCraftCost: number
  effectiveOutput: number
  grossRevenue: number
  sellFee: number
  netRevenue: number
  profit: number
  profitPerUnit: number
  margin: number
  roi: number
  breakEvenSellPrice: number
  missingPrices: boolean
}

export interface SimResult {
  item: {
    id: string
    uniqueName: string
    name: string
    tier: number
    enchantmentLevel: number
    iconUrl: string | null
    isFocusable: boolean
    nutritionRequired: number
  }
  params: SimParams
  returnRates: { base: number; focus: number; cityBonusOnRR: number }
  cityOutputBonus: number
  marketData: {
    craftCity: string
    sellCity: string
    sellPriceMin: number | null
    buyPriceMax: number | null
    quality: number
  }
  ingredients: Array<{
    itemId: string
    uniqueName: string
    name: string
    tier: number
    enchantmentLevel: number
    iconUrl: string | null
    isCraftable: boolean
    hasCraftingRecipe: boolean
    quantityPerRun: number
    totalQuantity: number
    maxReturnRate: number | null
    marketPrice: number
    grossCost: number
    returnedValueBase: number
    returnedValueFocus: number
    netCostBase: number
    netCostFocus: number
  }>
  scenarios: {
    noFocus: ScenarioCalc
    focus: ScenarioCalc | null
  }
  recommendation: {
    useFocus: boolean
    decision: 'PROFITABLE' | 'UNPROFITABLE'
    reasoning: string[]
  }
}

export function useCraftingSimulator() {
  const selectedItem = ref<any>(null)
  const treeData = ref<any>(null)
  const treePending = ref(false)
  const simResult = ref<SimResult | null>(null)
  const simPending = ref(false)
  const simError = ref<string | null>(null)

  const params = ref<SimParams>({
    craftCity: 'Caerleon',
    sellCity: 'Caerleon',
    quality: 1,
    useFocus: false,
    silverPer100Nutrition: 999,
    isPremium: false,
    quantity: 1,
  })

  // Sub-component buy/craft decisions (key = uniqueName, value = 'craft' | 'buy')
  const manualOverrides = ref<Record<string, 'craft' | 'buy'>>({})

  let simTimer: ReturnType<typeof setTimeout>
  let simSeq = 0

  async function loadTree(item: any) {
    treePending.value = true
    treeData.value = null
    try {
      const res = await $fetch(`/api/v1/items/${encodeURIComponent(item.uniqueName)}/recipe/tree`) as any
      treeData.value = res.data
    }
    catch {
      treeData.value = null
    }
    finally {
      treePending.value = false
    }
  }

  async function runSimulation() {
    if (!selectedItem.value) return
    const mySeq = ++simSeq
    simPending.value = true
    simError.value = null
    try {
      const res = await $fetch(
        `/api/v1/items/${encodeURIComponent(selectedItem.value.uniqueName)}/recipe/simulate`,
        { method: 'POST', body: { ...params.value } },
      ) as any
      if (mySeq !== simSeq) return
      simResult.value = res.data
    }
    catch (e: any) {
      if (mySeq !== simSeq) return
      simError.value = e?.data?.statusMessage ?? 'Erreur de simulation'
      simResult.value = null
    }
    finally {
      if (mySeq === simSeq) simPending.value = false
    }
  }

  function triggerSim() {
    clearTimeout(simTimer)
    simTimer = setTimeout(runSimulation, 400)
  }

  async function selectItem(item: any) {
    selectedItem.value = item
    manualOverrides.value = {}
    await Promise.all([loadTree(item), runSimulation()])
  }

  function clearItem() {
    selectedItem.value = null
    treeData.value = null
    simResult.value = null
    simError.value = null
    manualOverrides.value = {}
  }

  watch(
    () => [
      params.value.craftCity,
      params.value.sellCity,
      params.value.quality,
      params.value.useFocus,
      params.value.silverPer100Nutrition,
      params.value.isPremium,
      params.value.quantity,
    ],
    triggerSim,
  )

  // Derived helpers
  const activeScenario = computed((): ScenarioCalc | null => {
    if (!simResult.value) return null
    const { noFocus, focus } = simResult.value.scenarios
    if (params.value.useFocus && focus) return focus
    return noFocus
  })

  const isProfitable = computed(() => (activeScenario.value?.profit ?? 0) > 0)

  return {
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
    runSimulation,
  }
}
