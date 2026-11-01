<script setup>
import { computed } from 'vue'
import EditableText from './EditableText.vue'
import CertTools from './CertTools.vue'
import Icon from './Icon.vue'
import { state, uid, toast } from '../composables/useStore.js'

const emit = defineEmits(['open'])
const items = computed(() => state.profile.experience)
const tones = ['tone-hot', 'tone-lilac', 'tone-mint', 'tone-peach', 'tone-sky']
const kinds = ['research', 'people', 'science', 'briefcase']

function add() {
  items.value.unshift({ id: uid(), kind: 'briefcase', role: 'Role', org: 'Organisation', start: 'Mon YYYY', end: '', summary: '', certificate: '', image: '', onResume: true })
}
function remove(i) { items.value.splice(i, 1); toast('Entry deleted.') }
function cycleKind(x) { x.kind = kinds[(kinds.indexOf(x.kind) + 1) % kinds.length] }
</script>

<template>
  <ol class="xp">
    <li v-for="(x, i) in items" :key="x.id" class="xp__item card">
      <component
        :is="state.editing ? 'button' : 'span'" :type="state.editing ? 'button' : undefined"
        class="xp__icon" :class="tones[i % tones.length]"
        :aria-label="state.editing ? 'Change icon' : undefined" @click="state.editing && cycleKind(x)"
      ><Icon :name="x.kind" /></component>
      <div class="xp__body">
        <EditableText v-model="x.role" tag="h3" label="Role" />
        <EditableText v-model="x.org" tag="p" class="org" label="Organisation" />
        <p class="when">
          <EditableText v-model="x.start" label="Start date" /><template v-if="x.end || state.editing"> – <EditableText v-model="x.end" label="End date (leave empty if one day)" /></template>
        </p>
        <EditableText v-if="x.summary || state.editing" v-model="x.summary" tag="p" class="summary" multiline label="What you did" />
        <button v-if="x.image && !state.editing" type="button" class="btn btn--small cert-btn" @click="emit('open', x)">
          <Icon name="award" />View certificate
        </button>
        <CertTools v-if="state.editing" :item="x" resume-toggle @remove="remove(i)" />
      </div>
    </li>
    <li v-if="state.editing"><button type="button" class="btn btn--ghost add" @click="add">Add experience</button></li>
  </ol>
</template>

<style scoped>
.xp { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.xp__item { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 14px; padding: 14px; box-shadow: var(--shadow-sm); }
.xp__icon {
  all: unset; box-sizing: border-box; display: grid; place-items: center; width: 40px; height: 40px;
  border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--tone);
}
button.xp__icon { cursor: pointer; }
button.xp__icon:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.xp__icon svg { width: 20px; height: 20px; }
.xp__body { display: grid; gap: 2px; min-width: 0; }
.xp__body :deep(h3) { margin: 0; font-size: .95rem; font-weight: 700; line-height: 1.3; }
.org { margin: 0; font-size: .88rem; }
.when { margin: 0; font-size: .82rem; color: var(--muted); font-variant-numeric: tabular-nums; }
.summary { margin: 6px 0 0; font-size: .85rem; line-height: 1.5; color: var(--ink-2); }
.cert-btn { justify-self: start; margin-top: 8px; }
.add { width: 100%; }
</style>
