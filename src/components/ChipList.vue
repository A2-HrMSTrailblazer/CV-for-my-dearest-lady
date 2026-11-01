<script setup>
import EditableText from './EditableText.vue'
import { state } from '../composables/useStore.js'

const props = defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'item' },
  variant: { type: String, default: 'rainbow' } // 'rainbow' | 'tone'
})
const add = () => props.items.push(`New ${props.label}`)
</script>

<template>
  <ul class="chips" :class="`chips--${variant}`">
    <li v-for="(c, i) in items" :key="i" class="chip">
      <EditableText v-model="items[i]" :label="`Edit ${label}`" />
      <button v-if="state.editing" type="button" class="x" :aria-label="`Remove ${c}`" @click="items.splice(i, 1)">×</button>
    </li>
    <li v-if="state.editing">
      <button type="button" class="chip chip--add" @click="add">Add {{ label }}</button>
    </li>
  </ul>
</template>

<style scoped>
.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.chips .chip--add { cursor: pointer; border-style: dashed; background: var(--surface); font: inherit; font-weight: 700; }
</style>
