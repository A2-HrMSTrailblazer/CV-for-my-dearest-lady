<script setup>
import { ref, computed } from 'vue'
import SideNav from './components/SideNav.vue'
import ProfileCard from './components/ProfileCard.vue'
import ExperienceList from './components/ExperienceList.vue'
import EducationTimeline from './components/EducationTimeline.vue'
import CertTools from './components/CertTools.vue'
import ChipList from './components/ChipList.vue'
import EditableText from './components/EditableText.vue'
import Icon from './components/Icon.vue'
import CertificateViewer from './components/CertificateViewer.vue'
import OwnerSheet from './components/OwnerSheet.vue'
import PasswordGate from './components/PasswordGate.vue'
import { state, uid, toast, hasUnpublished, publishNow } from './composables/useStore.js'

const p = computed(() => state.profile)
const viewing = ref(null)
const year = new Date().getFullYear()

const certs = computed(() =>
  [...p.value.experience, ...p.value.education].filter((x) => x.image)
)
const navItems = computed(() => [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'experience', label: 'Experience', icon: 'briefcase' },
  { id: 'education', label: 'Education', icon: 'cap' },
  { id: 'languages', label: 'Languages', icon: 'chat' },
  { id: 'skills', label: 'Skills', icon: 'spark' },
  ...(certs.value.length || state.editing ? [{ id: 'certificates', label: 'Certificates', icon: 'award' }] : [])
])

const eduTones = ['tone-hot', 'tone-lilac', 'tone-mint', 'tone-peach']
const langTones = ['tone-hot', 'tone-lilac', 'tone-sky', 'tone-mint', 'tone-peach', 'tone-butter']

const addEdu = () => p.value.education.push({ id: uid(), kind: 'degree', short: 'New', title: 'Programme', school: 'School', start: 'Mon YYYY', end: '', certificate: '', image: '' })
const removeEdu = (i) => { p.value.education.splice(i, 1); toast('Entry deleted.') }
const addLang = () => p.value.languages.push({ id: uid(), name: 'Language', level: 'Level', score: 1 })
const bump = (l, d) => { l.score = Math.min(6, Math.max(1, (Number(l.score) || 1) + d)) }

const initials = computed(() => {
  const w = p.value.name.trim().split(/\s+/)
  return ((w[0]?.[0] || '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
})
function finishEditing() {
  state.editing = false
  toast(hasUnpublished.value ? 'Saved in this browser. Publish from the owner menu to make it live.' : 'Done editing.')
}
</script>

<template>
  <div class="frame">
    <SideNav :items="navItems" />

    <main class="main">
      <header class="topbar">
        <div class="topbar__left">
          <EditableText v-model="p.status" tag="p" class="chip chip--status" label="Status" />
          <p class="chip chip--loc"><Icon name="pin" /><EditableText v-model="p.location" label="Location" /></p>
        </div>
        <span class="avatar" aria-hidden="true">
          <img v-if="p.photo" :src="p.photo" alt="" />
          <template v-else>{{ initials }}</template>
        </span>
      </header>

      <div class="row row--hero">
        <section id="profile" class="col" aria-labelledby="profile-h">
          <h2 id="profile-h" class="h-xl">Profile</h2>
          <ProfileCard />
        </section>
        <section id="experience" class="col" aria-labelledby="xp-h">
          <h2 id="xp-h" class="h-lg">Experience</h2>
          <ExperienceList @open="viewing = $event" />
        </section>
      </div>

      <section id="education" class="col" aria-labelledby="edu-h">
        <div class="sec-head">
          <h2 id="edu-h" class="h-xl">Education</h2>
          <button v-if="state.editing" type="button" class="btn btn--small" @click="addEdu">Add education</button>
        </div>
        <div class="edu-row">
          <EducationTimeline />
          <ul class="edu-grid">
            <li v-for="(e, i) in p.education" :key="e.id" class="edu card" :class="eduTones[i % eduTones.length]">
              <div class="edu__top">
                <EditableText v-model="e.title" tag="h3" label="Programme or test" />
                <span class="edu__icon"><Icon :name="e.kind === 'test' ? 'test' : 'cap'" /></span>
              </div>
              <EditableText v-model="e.school" tag="p" class="edu__school" label="School or organisation" />
              <p class="edu__when">
                <EditableText v-model="e.start" label="Start or exam date" /><template v-if="e.end || state.editing"> – <EditableText v-model="e.end" label="End (leave empty for one date)" /></template>
              </p>
              <p v-if="state.editing" class="edu__short">Timeline label: <EditableText v-model="e.short" label="Short label for the timeline" /></p>
              <button v-if="e.image && !state.editing" type="button" class="btn btn--small edu__cert" @click="viewing = e"><Icon name="award" />View certificate</button>
              <CertTools v-if="state.editing" :item="e" @remove="removeEdu(i)" />
            </li>
          </ul>
        </div>
      </section>

      <section id="languages" class="col" aria-labelledby="lang-h">
        <div class="sec-head">
          <h2 id="lang-h" class="h-xl">Languages</h2>
          <span class="count">{{ p.languages.length }}</span>
        </div>
        <ul class="lang-grid">
          <li v-for="(l, i) in p.languages" :key="l.id" class="lang card" :class="langTones[i % langTones.length]">
            <div class="lang__top">
              <EditableText v-model="l.name" tag="h3" label="Language" />
              <EditableText v-model="l.level" class="lang__level" label="Level" />
            </div>
            <div class="meter" role="img" :aria-label="`${l.name}: ${l.level}, about ${l.score} of 6`">
              <span v-for="n in 6" :key="n" :class="{ on: n <= l.score }"></span>
            </div>
            <div v-if="state.editing" class="lang__tools">
              <button type="button" class="btn btn--small" aria-label="Lower level" @click="bump(l, -1)">−</button>
              <button type="button" class="btn btn--small" aria-label="Raise level" @click="bump(l, 1)">+</button>
              <button type="button" class="btn btn--small btn--danger" @click="p.languages.splice(i, 1)">Delete</button>
            </div>
          </li>
          <li v-if="state.editing"><button type="button" class="btn btn--ghost lang-add" @click="addLang">Add language</button></li>
        </ul>
        <p class="note">Meters are a rough guide. Each language is measured on its own test scale.</p>
      </section>

      <section id="skills" class="col" aria-labelledby="skills-h">
        <h2 id="skills-h" class="h-xl">Skills</h2>
        <div class="skill-row">
          <article class="skill card tone-lilac">
            <h3><span class="skill__icon"><Icon name="code" /></span>Programming</h3>
            <ChipList :items="p.programming" label="language" variant="tone" />
          </article>
          <article class="skill card tone-rose">
            <h3><span class="skill__icon"><Icon name="spark" /></span>Other skills</h3>
            <ChipList :items="p.skills" label="skill" />
          </article>
        </div>
      </section>

      <section v-if="certs.length || state.editing" id="certificates" class="col" aria-labelledby="cert-h">
        <h2 id="cert-h" class="h-xl">Certificates</h2>
        <ul v-if="certs.length" class="cert-grid">
          <li v-for="c in certs" :key="c.id">
            <button type="button" class="cert card" @click="viewing = c">
              <img :src="c.image" alt="" />
              <span class="cert__cap">
                <strong>{{ c.certificate || 'Certificate' }}</strong>
                <span>{{ c.org || c.school }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-else class="tip card">No certificate images yet. Use "Add certificate image" on any experience or education entry.</p>
      </section>

      <footer class="foot">
        <span>© {{ year }} {{ p.name }}</span>
        <a :href="`mailto:${p.email}`">{{ p.email }}</a>
      </footer>
    </main>
  </div>

  <div v-if="state.editing && state.unlocked" class="editbar" role="status">
    <span>{{ hasUnpublished ? 'Editing. Not published yet.' : 'Editing. Everything is published.' }}</span>
    <button v-if="hasUnpublished" type="button" class="btn btn--small btn--dark" :disabled="state.publishing" @click="publishNow">{{ state.publishing ? 'Publishing…' : 'Publish' }}</button>
    <button type="button" class="btn btn--small" @click="finishEditing">Finish editing</button>
  </div>

  <CertificateViewer v-if="viewing" :item="viewing" @close="viewing = null" />
  <PasswordGate v-if="state.gateOpen" />
  <OwnerSheet v-if="state.ownerOpen && state.unlocked" />
  <p v-if="state.toast" class="toast" :class="{ 'toast--high': state.editing }" role="status" aria-live="polite">{{ state.toast }}</p>
</template>

<style scoped>
.frame {
  max-width: 1280px; margin: clamp(10px, 3vw, 36px) auto; width: calc(100% - 2 * clamp(10px, 3vw, 36px));
  display: grid; grid-template-columns: 220px minmax(0, 1fr);
  background: var(--cream); border: var(--bw) solid var(--ink); border-radius: 6px; box-shadow: 8px 8px 0 var(--ink);
}
.main { min-width: 0; padding: clamp(16px, 3vw, 32px); display: grid; gap: clamp(36px, 5vw, 52px); align-content: start; }
.col { display: grid; gap: 16px; align-content: start; min-width: 0; }

.topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.topbar__left { display: flex; flex-wrap: wrap; gap: 8px; }
.chip--status { margin: 0; background: var(--hot); font-weight: 700; }
.chip--loc { margin: 0; }
.chip--loc svg { width: 15px; height: 15px; }
.avatar {
  width: 40px; height: 40px; flex: none; display: grid; place-items: center; overflow: hidden;
  border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--bubblegum); font-weight: 700; font-size: .9rem;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }

.h-xl { margin: 0; font-size: clamp(1.7rem, 4vw, 2.5rem); font-weight: 700; letter-spacing: -.045em; line-height: 1.05; }
.h-lg { margin: 0; font-size: clamp(1.25rem, 2.6vw, 1.55rem); font-weight: 700; letter-spacing: -.03em; line-height: 1.1; padding-top: .55em; }
.sec-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.count {
  display: inline-grid; place-items: center; min-width: 38px; height: 34px; padding: 0 10px;
  border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--surface); font-weight: 700; box-shadow: var(--shadow-sm);
}

.row--hero { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(0, 1fr); gap: 28px; align-items: start; }
@media (max-width: 1150px) { .row--hero { grid-template-columns: 1fr; } .h-lg { padding-top: 0; font-size: clamp(1.7rem, 4vw, 2.5rem); letter-spacing: -.045em; } }

/* Education */
.edu-row { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr); gap: 18px; align-items: start; }
.edu-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 14px; }
.edu { padding: 14px; display: grid; gap: 6px; align-content: start; box-shadow: var(--shadow-sm); }
.edu__top { display: flex; justify-content: space-between; gap: 10px; align-items: start; }
.edu__top :deep(h3) { margin: 0; font-size: .95rem; font-weight: 700; line-height: 1.3; }
.edu__icon { display: grid; place-items: center; width: 30px; height: 30px; flex: none; border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--tone); }
.edu__icon svg { width: 17px; height: 17px; }
.edu__school { margin: 0; font-size: .86rem; color: var(--ink-2); }
.edu__when { margin: 4px 0 0; justify-self: start; padding: 1px 8px; border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--tone); font-size: .8rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.edu__short { margin: 0; font-size: .8rem; color: var(--muted); }
.edu__cert { justify-self: start; margin-top: 4px; }
@media (max-width: 1000px) { .edu-row { grid-template-columns: 1fr; } }

/* Languages */
.lang-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 190px), 1fr)); gap: 14px; }
.lang { padding: 14px; display: grid; gap: 12px; box-shadow: var(--shadow-sm); }
.lang__top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.lang__top :deep(h3) { margin: 0; font-size: 1.05rem; font-weight: 700; }
.lang__level { font-size: .78rem; font-weight: 600; padding: 1px 7px; border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--tone); }
.meter { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
.meter span { height: 12px; border: var(--bw) solid var(--ink); border-radius: 2px; background: var(--surface); }
.meter span.on { background: var(--tone); }
.lang__tools { display: flex; gap: 6px; flex-wrap: wrap; }
.lang-add { width: 100%; height: 100%; min-height: 80px; }
.note { margin: 0; font-size: .78rem; color: var(--muted); }

/* Skills */
.skill-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 18px; }
.skill { padding: 16px; display: grid; gap: 12px; align-content: start; }
.skill h3 { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; }
.skill__icon { display: grid; place-items: center; width: 30px; height: 30px; border: var(--bw) solid var(--ink); border-radius: var(--r); background: var(--tone); }
.skill__icon svg { width: 17px; height: 17px; }

/* Certificates */
.cert-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 16px; }
.cert { all: unset; box-sizing: border-box; cursor: pointer; display: grid; width: 100%; background: var(--surface); border: var(--bw) solid var(--ink); border-radius: var(--r); box-shadow: var(--shadow-sm); overflow: hidden; }
.cert:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow); }
.cert:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
.cert img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-bottom: var(--bw) solid var(--ink); display: block; }
.cert__cap { display: grid; gap: 2px; padding: 10px 12px; font-size: .85rem; }
.cert__cap span { color: var(--ink-2); font-size: .8rem; }
.tip { margin: 0; padding: 16px; background: var(--butter-2); box-shadow: var(--shadow-sm); }

.foot { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding-top: 16px; border-top: var(--bw) solid var(--ink); font-size: .85rem; }

.editbar {
  position: fixed; left: 50%; bottom: calc(14px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 30;
  display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; width: max-content; max-width: calc(100% - 24px);
  padding: 10px 14px; background: var(--hot); border: var(--bw) solid var(--ink); border-radius: var(--r); box-shadow: var(--shadow-sm);
  font-weight: 600; font-size: .9rem;
}
.toast {
  position: fixed; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 60;
  margin: 0; max-width: calc(100% - 32px); padding: 12px 16px; background: var(--ink); color: var(--surface);
  border-radius: var(--r); font-weight: 600; font-size: .9rem; box-shadow: 4px 4px 0 var(--hot);
}
.toast--high { bottom: calc(86px + env(safe-area-inset-bottom)); }

@media (max-width: 900px) {
  .frame { grid-template-columns: 1fr; }
}
</style>
