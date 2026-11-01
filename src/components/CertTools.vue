<script setup>
// Edit-mode tools shared by experience and education entries
import EditableText from './EditableText.vue'
import { toast } from '../composables/useStore.js'
import { readImage } from '../lib/image.js'

const props = defineProps({
  item: { type: Object, required: true },
  resumeToggle: Boolean
})
const emit = defineEmits(['remove'])

async function onFile(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    props.item.image = await readImage(file)
    if (!props.item.certificate) props.item.certificate = 'Certificate'
    toast('Certificate image added.')
  } catch (err) { toast(err.message) }
}
</script>

<template>
  <div class="tools">
    <p class="cert-name">Certificate name: <EditableText v-model="item.certificate" label="Certificate name" /></p>
    <div class="row">
      <label class="btn btn--small">
        {{ item.image ? 'Replace image' : 'Add certificate image' }}
        <input type="file" accept="image/*" class="sr-only" @change="onFile" />
      </label>
      <button v-if="item.image" type="button" class="btn btn--small btn--ghost" @click="item.image = ''">Remove image</button>
      <label v-if="resumeToggle" class="check"><input type="checkbox" v-model="item.onResume" /> On resume</label>
      <button type="button" class="btn btn--small btn--danger" @click="emit('remove')">Delete</button>
    </div>
  </div>
</template>

<style scoped>
.tools { display: grid; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 2px dashed var(--line); }
.cert-name { margin: 0; font-size: .82rem; color: var(--muted); }
.row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
</style>
