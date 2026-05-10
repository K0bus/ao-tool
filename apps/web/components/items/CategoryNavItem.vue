<template>
  <!-- Nœud avec enfants : mini-accordion récursif -->
  <div v-if="cat.children.length" class="acc-group" :class="{ open: isOpen }">
    <button
      class="side-sub side-sub-node"
      :class="{ active: isActive }"
      :style="{ paddingLeft: `${8 + depth * 10}px` }"
      @click="toggle"
    >
      <span class="dot" />
      <span class="lbl">{{ cat.name }}</span>
      <span class="badge">{{ cat.count.toLocaleString('fr-FR') }}</span>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chev" style="margin-left:auto;flex-shrink:0"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="acc-body">
      <div class="acc-inner">
        <CategoryNavItem
          v-for="child in cat.children"
          :key="child.id"
          :cat="child"
          :active-id="activeId"
          :depth="depth + 1"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>

  <!-- Feuille -->
  <button
    v-else
    class="side-sub"
    :class="{ active: isActive }"
    :style="{ paddingLeft: `${8 + depth * 10}px` }"
    @click.stop="emit('select', cat.id)"
  >
    <span class="dot" />
    <span class="lbl">{{ cat.name }}</span>
    <span class="badge">{{ cat.count.toLocaleString('fr-FR') }}</span>
  </button>
</template>

<script setup lang="ts">
interface CatNode {
  id: string
  slug: string
  name: string
  count: number
  children: CatNode[]
}

const props = defineProps<{
  cat: CatNode
  activeId: string | null
  depth?: number
}>()

const emit = defineEmits<{ select: [id: string] }>()

const depth = computed(() => props.depth ?? 0)
const isActive = computed(() => props.activeId === props.cat.id)

function containsId(nodes: CatNode[], id: string): boolean {
  return nodes.some((n) => n.id === id || containsId(n.children, id))
}

const containsActive = computed(
  () => props.activeId !== null && containsId(props.cat.children, props.activeId)
)

const isOpen = ref(false)

watchEffect(() => {
  if (containsActive.value) isOpen.value = true
})

function toggle() {
  isOpen.value = !isOpen.value
  emit('select', props.cat.id)
}
</script>
