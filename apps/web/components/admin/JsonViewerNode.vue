<template>
  <div class="json-node" :style="{ paddingLeft: depth > 0 ? '16px' : '0' }">
    <!-- Non-empty object or array -->
    <template v-if="isObject && !isEmpty">
      <!-- Header line -->
      <div class="json-line json-collapsible">
        <span class="json-toggle" @click="toggle" aria-label="Toggle node">
          <svg 
            viewBox="0 0 24 24" 
            width="10" 
            height="10" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="3" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            :style="{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </span>
        
        <span v-if="nodeKey !== undefined" class="json-key" @click="toggle">
          <span class="json-key-quotes">"</span>{{ nodeKey }}<span class="json-key-quotes">"</span>: 
        </span>
        
        <span class="json-bracket" @click="toggle">{{ isArray ? '[' : '{' }}</span>
        
        <span v-if="!isExpanded" class="json-ellipsis" @click="toggle">...</span>
        
        <span v-if="!isExpanded" class="json-bracket" @click="toggle">{{ isArray ? ']' : '}' }}</span>
        <span v-if="!isExpanded && !isLast" class="json-comma">,</span>
        
        <!-- Short summary when collapsed -->
        <span v-if="!isExpanded" class="json-summary" @click="toggle">
          {{ isArray ? `${value.length} items` : `${Object.keys(value).length} keys` }}
        </span>
      </div>

      <!-- Children list if expanded -->
      <div v-if="isExpanded" class="json-children">
        <JsonViewerNode 
          v-for="child in children" 
          :key="child.key" 
          :value="child.value" 
          :node-key="child.key" 
          :is-last="child.isLast" 
          :depth="depth + 1"
        />
      </div>

      <!-- Closing line if expanded -->
      <div v-if="isExpanded" class="json-line">
        <span class="json-toggle-spacer"></span>
        <span class="json-bracket">{{ isArray ? ']' : '}' }}</span>
        <span v-if="!isLast" class="json-comma">,</span>
      </div>
    </template>

    <!-- Empty object or array -->
    <div v-else-if="isObject && isEmpty" class="json-line">
      <span class="json-toggle-spacer"></span>
      <span v-if="nodeKey !== undefined" class="json-key">
        <span class="json-key-quotes">"</span>{{ nodeKey }}<span class="json-key-quotes">"</span>: 
      </span>
      <span class="json-bracket">{{ isArray ? '[]' : '{}' }}</span>
      <span v-if="!isLast" class="json-comma">,</span>
    </div>

    <!-- Primitive value -->
    <div v-else class="json-line">
      <span class="json-toggle-spacer"></span>
      <span v-if="nodeKey !== undefined" class="json-key">
        <span class="json-key-quotes">"</span>{{ nodeKey }}<span class="json-key-quotes">"</span>: 
      </span>
      <span :class="['json-val', 'json-' + valueType]">{{ formattedValue }}</span>
      <span v-if="!isLast" class="json-comma">,</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'JsonViewerNode'
})
</script>

<script setup lang="ts">
import { computed, ref, inject, watch, type Ref } from 'vue'

const props = defineProps<{
  value: any
  nodeKey?: string | number
  isLast: boolean
  depth: number
}>()

const isObject = computed(() => {
  return props.value !== null && typeof props.value === 'object'
})

const isArray = computed(() => {
  return Array.isArray(props.value)
})

const isEmpty = computed(() => {
  if (isArray.value) return props.value.length === 0
  if (isObject.value) return Object.keys(props.value).length === 0
  return true
})

const isExpanded = ref(props.depth < 2)

// Connect to global expand/collapse events
const globalExpandState = inject<Ref<'expand' | 'collapse' | null> | null>('globalExpandState', null)
if (globalExpandState) {
  watch(globalExpandState, (newVal) => {
    if (newVal === 'expand') {
      isExpanded.value = true
    } else if (newVal === 'collapse') {
      isExpanded.value = false
    }
  })
}

const toggle = () => {
  isExpanded.value = !isExpanded.value
}

const children = computed(() => {
  if (isArray.value) {
    return props.value.map((val: any, index: number) => ({
      key: index,
      value: val,
      isLast: index === props.value.length - 1
    }))
  }
  if (isObject.value) {
    const keys = Object.keys(props.value)
    return keys.map((key, index) => ({
      key,
      value: props.value[key],
      isLast: index === keys.length - 1
    }))
  }
  return []
})

const valueType = computed(() => {
  if (props.value === null) return 'null'
  if (props.value === undefined) return 'undefined'
  return typeof props.value
})

const formattedValue = computed(() => {
  if (valueType.value === 'string') {
    return `"${props.value}"`
  }
  return String(props.value)
})
</script>

<style scoped>
.json-node {
  font-family: var(--font-mono), monospace;
  font-size: 12.5px;
  text-align: left;
}

.json-line {
  display: flex;
  align-items: flex-start;
  line-height: 1.7;
  white-space: pre-wrap;
  word-wrap: break-word;
  padding: 1px 4px;
  border-radius: 4px;
  transition: background-color 0.15s ease;
}

.json-line:hover {
  background-color: rgba(201, 161, 74, 0.04);
}

.json-collapsible {
  cursor: pointer;
}

.json-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: 4px;
  margin-top: 3px;
  color: var(--text-3);
  cursor: pointer;
  flex-shrink: 0;
}

.json-toggle:hover {
  color: var(--gold);
}

.json-toggle-spacer {
  display: inline-block;
  width: 20px;
  flex-shrink: 0;
}

.json-key {
  color: var(--text-1);
  font-weight: 500;
}

.json-key-quotes {
  color: var(--text-3);
}

.json-bracket {
  color: var(--gold-dim);
  font-weight: 600;
}

.json-comma {
  color: var(--text-3);
}

.json-ellipsis {
  background: var(--bg-4);
  padding: 0 6px;
  border-radius: 4px;
  margin: 0 4px;
  font-size: 11px;
  color: var(--gold);
  border: 1px solid var(--border);
  font-weight: bold;
}

.json-ellipsis:hover {
  background: var(--gold-deep);
  color: var(--text-0);
}

.json-summary {
  font-size: 11px;
  color: var(--text-3);
  margin-left: 8px;
  font-style: italic;
  user-select: none;
}

.json-val.json-string {
  color: var(--success);
}

.json-val.json-number {
  color: var(--info);
}

.json-val.json-boolean {
  color: var(--warning);
  font-weight: bold;
}

.json-val.json-null,
.json-val.json-undefined {
  color: var(--text-3);
  font-style: italic;
}

.json-children {
  position: relative;
}

.json-children::before {
  content: "";
  position: absolute;
  left: 7px;
  top: 4px;
  bottom: 4px;
  width: 1px;
  background-color: var(--border-divider);
  opacity: 0.8;
}
</style>
