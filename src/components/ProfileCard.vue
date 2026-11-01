<script setup>
import { computed } from 'vue'
import EditableText from './EditableText.vue'
import PhotoSlot from './PhotoSlot.vue'
import Icon from './Icon.vue'
import { state, openOwnerMenu, uid } from '../composables/useStore.js'
import { useOwnerGesture } from '../composables/useOwnerGesture.js'

const p = computed(() => state.profile)
const { holding, holdHandlers } = useOwnerGesture(openOwnerMenu)
const tel = computed(() => p.value.phone.replace(/[^\d+]/g, ''))
const addStat = () => p.value.stats.push({ value: '0', label: 'label' })
</script>

<template>
  <article class="profile card">
    <PhotoSlot class="profile__photo" />

    <div class="profile__body">
      <div class="profile__top">
        <div class="who">
          <h1 class="name" :class="{ holding }" v-on="state.editing ? {} : holdHandlers">
            <EditableText v-model="p.name" label="Full name" />
          </h1>
          <p class="nick">Also known as <EditableText v-model="p.nickname" label="Nickname" /></p>
        </div>
        <div class="quick">
          <a v-if="!state.editing" class="btn btn--icon" :href="`mailto:${p.email}`" :aria-label="`Email ${p.email}`"><Icon name="mail" /></a>
          <a v-if="!state.editing && p.showPhone && p.phone" class="btn btn--icon" :href="`tel:${tel}`" :aria-label="`Call ${p.phone}`"><Icon name="phone" /></a>
        </div>
      </div>

      <p class="contact-line">
        <EditableText v-model="p.email" label="Email address" />
        <template v-if="p.showPhone || state.editing">
          <span class="sep" aria-hidden="true">/</span>
          <EditableText v-model="p.phone" label="Phone number" />
        </template>
      </p>
      <label v-if="state.editing" class="check">
        <input type="checkbox" v-model="p.showPhone" /> Show phone number on the website (always in the PDFs)
      </label>

      <dl class="stats">
        <div v-for="(s, i) in p.stats" :key="i" class="stat">
          <dt><EditableText v-model="s.label" label="Stat label" /></dt>
          <dd><EditableText v-model="s.value" label="Stat value" /></dd>
          <button v-if="state.editing" type="button" class="x" aria-label="Remove stat" @click="p.stats.splice(i, 1)">×</button>
        </div>
        <button v-if="state.editing && p.stats.length < 4" type="button" class="stat stat--add" @click="addStat">Add stat</button>
      </dl>

      <EditableText v-model="p.bio" tag="p" class="bio" multiline label="Short bio" />

      <div class="actions">
        <a class="btn btn--dark" :href="state.editing ? undefined : `mailto:${p.email}`"><Icon name="mail" />Email me</a>
        <a class="btn" href="#experience">See experience</a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.profile {
  background: var(--butter); padding: 18px; display: grid; grid-template-columns: minmax(150px, 210px) minmax(0, 1fr); gap: 20px;
  --muted: var(--ink-2);
}
.profile__photo { align-self: start; }
.profile__body { display: grid; gap: 12px; align-content: start; min-width: 0; }
.profile__top { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
.who { min-width: 0; }
.name {
  margin: 0; font-size: clamp(1.7rem, 3.6vw, 2.4rem); line-height: 1.05; letter-spacing: -.04em; font-weight: 700;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation;
  position: relative; display: inline-block;
}
.name::after { content: ''; position: absolute; left: 0; bottom: -5px; height: 4px; width: 0; background: var(--ink); }
.name.holding::after { width: 100%; transition: width .9s linear .15s; }
@media (prefers-reduced-motion: reduce) { .name.holding::after { transition: none; } }
.nick { margin: 6px 0 0; font-size: .9rem; color: var(--ink-2); }
.nick :deep(span) { font-weight: 600; }
.quick { display: flex; gap: 8px; flex: none; }
.contact-line { margin: -4px 0 0; font-size: .9rem; display: flex; flex-wrap: wrap; gap: 4px 8px; overflow-wrap: anywhere; }
.sep { color: var(--ink-2); }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 8px; margin: 4px 0 0; }
.stat {
  position: relative; display: flex; flex-direction: column-reverse; gap: 2px; padding: 8px 10px;
  border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--butter-2);
}
.stat dt { font-size: .74rem; line-height: 1.25; color: var(--ink-2); }
.stat dd { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -.03em; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; }
.stat .x { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; font-size: 12px; }
.stat--add { all: unset; cursor: pointer; display: grid; place-items: center; padding: 8px; border: var(--bw) dashed var(--ink); border-radius: var(--r); font-weight: 600; font-size: .85rem; }

.bio { margin: 0; font-size: .92rem; line-height: 1.6; max-width: 62ch; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

@media (max-width: 640px) {
  .profile { grid-template-columns: 1fr; }
  .profile__photo { width: min(180px, 52%); }
}
@media (max-width: 380px) { .actions { grid-template-columns: 1fr; } }
</style>
