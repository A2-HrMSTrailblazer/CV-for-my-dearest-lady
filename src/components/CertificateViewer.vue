<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { dateRange } from '../composables/useStore.js'

// Works for experience entries (role, org) and education entries (title, school)
const props = defineProps({ item: { type: Object, required: true } })
const emit = defineEmits(['close'])
const closeBtn = ref(null)

const what = computed(() => props.item.role || props.item.title || '')
const where = computed(() => props.item.org || props.item.school || '')
const when = computed(() => dateRange(props.item.start, props.item.end))

const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => { window.addEventListener('keydown', onKey); closeBtn.value?.focus() })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="viewer card" role="dialog" aria-modal="true" :aria-label="item.certificate || 'Certificate'">
      <div class="viewer__top">
        <div>
          <h2>{{ item.certificate || 'Certificate' }}</h2>
          <p>{{ what }}<template v-if="where">, {{ where }}</template>. {{ when }}</p>
        </div>
        <button ref="closeBtn" type="button" class="btn btn--small" @click="emit('close')">Close</button>
      </div>
      <img v-if="item.image" :src="item.image" :alt="`${item.certificate || 'Certificate'}: ${what}`" />
      <p v-else class="empty">No image yet. Open the owner menu, choose Edit page, then add a photo or scan of this certificate.</p>
    </div>
  </div>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 40; background: rgba(43, 0, 22, .55); display: grid; place-items: center; padding: 16px; }
.viewer { width: min(860px, 100%); max-height: calc(100% - 32px); overflow: auto; display: grid; gap: 16px; padding: 20px; background: var(--cream); }
.viewer__top { display: flex; justify-content: space-between; align-items: start; gap: 16px; }
.viewer h2 { margin: 0; font-size: 1.15rem; font-weight: 700; letter-spacing: -.03em; }
.viewer p { margin: 4px 0 0; color: var(--muted); font-size: .9rem; }
.viewer img { width: 100%; height: auto; border: var(--bw) solid var(--ink); border-radius: var(--r); }
.empty { padding: 28px; border: 2px dashed var(--line); border-radius: var(--r); text-align: center; }
</style>
