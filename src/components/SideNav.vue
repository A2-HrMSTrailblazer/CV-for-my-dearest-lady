<script setup>
// Sidebar on wide screens, sticky top bar with scrollable tabs on phones
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import Icon from './Icon.vue'
import { state } from '../composables/useStore.js'

const props = defineProps({ items: { type: Array, required: true } })
const active = ref(props.items[0]?.id)
let io

function observe() {
  io?.disconnect()
  if (!('IntersectionObserver' in window)) return
  const visible = new Set()
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)))
    // Highlight the first section (in menu order) that crosses the reading line
    const first = props.items.find((it) => visible.has(it.id))
    if (first) active.value = first.id
  }, { rootMargin: '-20% 0px -60% 0px' })
  props.items.forEach((it) => { const el = document.getElementById(it.id); if (el) io.observe(el) })
}
onMounted(() => nextTick(observe))
watch(() => props.items.length, () => nextTick(observe))
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <aside class="side">
    <div class="side__inner">
    <a class="brand" href="#profile">
      <span class="brand__mark"><Icon name="chart" /></span>
      <span class="brand__name">{{ state.profile.name }}</span>
    </a>
    <nav aria-label="Sections">
      <a
        v-for="it in items" :key="it.id" :href="`#${it.id}`"
        class="nav-link" :class="{ on: active === it.id }" :aria-current="active === it.id ? 'true' : undefined"
        @click="active = it.id"
      >
        <Icon :name="it.icon" />
        <span>{{ it.label }}</span>
      </a>
    </nav>
    <div class="side__foot">
      <a class="nav-link" :href="`mailto:${state.profile.email}`"><Icon name="mail" /><span>Contact</span></a>
      <p class="side__loc"><Icon name="pin" /><span>{{ state.profile.location }}</span></p>
    </div>
    </div>
  </aside>
</template>

<style scoped>
.side { background: var(--rose); border-right: var(--bw) solid var(--ink); border-radius: 4px 0 0 4px; }
.side__inner {
  position: sticky; top: 0; height: 100vh; max-height: 100%;
  padding: 22px 14px; display: flex; flex-direction: column; gap: 26px;
}
.brand { display: flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 700; padding: 0 6px; }
.brand__mark { display: grid; place-items: center; width: 34px; height: 34px; border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--surface); flex: none; }
.brand__mark svg { width: 20px; height: 20px; }
.brand__name { font-size: 1rem; letter-spacing: -.02em; }
nav { display: grid; gap: 4px; }
.nav-link {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--r);
  text-decoration: none; font-weight: 600; font-size: .9rem; border: var(--bw) solid transparent;
}
.nav-link svg { width: 17px; height: 17px; flex: none; }
.nav-link:hover { border-color: var(--ink); background: var(--surface); }
.nav-link.on { background: var(--ink); color: var(--surface); border-color: var(--ink); }
.side__foot { margin-top: auto; display: grid; gap: 6px; }
.side__loc { margin: 0; display: flex; gap: 10px; padding: 0 12px; font-size: .8rem; color: var(--ink-2); }
.side__loc svg { width: 16px; height: 16px; flex: none; margin-top: 2px; }

@media (max-width: 900px) {
  .side { position: sticky; top: 0; z-index: 20; border-right: 0; border-bottom: var(--bw) solid var(--ink); border-radius: 4px 4px 0 0; }
  .side__inner { position: static; height: auto; flex-direction: row; align-items: center; gap: 12px; padding: 10px 12px; overflow: hidden; }
  .brand__name, .side__foot { display: none; }
  .brand { padding: 0; }
  nav { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
  nav::-webkit-scrollbar { display: none; }
  .nav-link { white-space: nowrap; padding: 6px 10px; background: var(--surface); border-color: var(--ink); }
}
</style>
