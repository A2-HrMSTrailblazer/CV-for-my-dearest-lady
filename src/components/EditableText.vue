<script setup>
// Shows text normally; becomes an inline text field while edit mode is on.
import { ref, watch, nextTick } from 'vue'
import { state } from '../composables/useStore.js'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  tag: { type: String, default: 'span' },
  multiline: Boolean,
  number: Boolean,
  label: { type: String, default: 'Edit text' }
})
const emit = defineEmits(['update:modelValue'])
const el = ref(null)

function fill() {
  if (el.value) el.value.textContent = String(props.modelValue ?? '')
}
watch(() => state.editing, (on) => on && nextTick(fill), { immediate: true })
watch(() => props.modelValue, () => {
  if (el.value && document.activeElement !== el.value) fill()
})

function commit() {
  let v = (el.value?.innerText ?? '').replace(/ /g, ' ')
  v = props.multiline ? v.trim() : v.replace(/\s+/g, ' ').trim()
  if (props.number) v = Number(v.replace(/[^\d.]/g, '')) || 0
  emit('update:modelValue', v)
  fill()
}
function onKey(e) {
  if (e.key === 'Enter' && !props.multiline) { e.preventDefault(); e.target.blur() }
}
function onPaste(e) {
  e.preventDefault()
  const t = (e.clipboardData || window.clipboardData).getData('text')
  document.execCommand('insertText', false, t)
}
</script>

<template>
  <component
    :is="tag"
    v-if="state.editing"
    ref="el"
    class="editable"
    contenteditable="true"
    role="textbox"
    :aria-label="label"
    :aria-multiline="multiline ? 'true' : 'false'"
    spellcheck="true"
    @blur="commit"
    @keydown="onKey"
    @paste="onPaste"
  />
  <component :is="tag" v-else><slot :value="modelValue">{{ modelValue }}</slot></component>
</template>
