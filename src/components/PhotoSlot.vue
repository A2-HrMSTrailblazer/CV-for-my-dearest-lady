<script setup>
import { computed } from 'vue'
import { state, toast } from '../composables/useStore.js'
import { readImage } from '../lib/image.js'

const p = computed(() => state.profile)
const initials = computed(() => {
  const w = p.value.name.trim().split(/\s+/)
  return ((w[0]?.[0] || '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
})

async function onFile(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  try {
    p.value.photo = await readImage(file, 900, 0.85)
    toast('Photo added.')
  } catch (err) { toast(err.message) }
}
</script>

<template>
  <figure class="photo">
    <img v-if="p.photo" :src="p.photo" :alt="`Photo of ${p.name}`" />
    <span v-else class="initials" aria-hidden="true">{{ initials }}</span>
    <figcaption v-if="state.editing" class="photo__tools">
      <label class="btn btn--small">
        {{ p.photo ? 'Change photo' : 'Add photo' }}
        <input type="file" accept="image/*" class="sr-only" @change="onFile" />
      </label>
      <button v-if="p.photo" type="button" class="btn btn--small btn--ghost" @click="p.photo = ''">Remove</button>
    </figcaption>
  </figure>
</template>

<style scoped>
.photo {
  position: relative; margin: 0; aspect-ratio: 4 / 5; overflow: hidden;
  border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--bubblegum);
  display: grid; place-items: center;
}
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.initials { font-size: clamp(2.6rem, 7vw, 4.2rem); font-weight: 700; letter-spacing: -.06em; }
.photo__tools { position: absolute; left: 8px; right: 8px; bottom: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.photo__tools .btn { background: var(--surface); }
</style>
