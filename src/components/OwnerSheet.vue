<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { state, toast, resetProfile, lockOwner, hasUnpublished, publishNow } from '../composables/useStore.js'
import { saveFile } from '../lib/saveFile.js'
import { withImageData } from '../lib/image.js'

const busy = ref('')
const confirmReset = ref(false)
const firstBtn = ref(null)

const slug = () => state.profile.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cv'
const close = () => { state.ownerOpen = false; confirmReset.value = false }

async function download(kind) {
  if (!state.unlocked) { close(); state.gateOpen = true; return }
  busy.value = kind
  try {
    const { buildCV, buildResume } = await import('../lib/pdf.js')
    const raw = await withImageData(state.profile)
    const blob = kind === 'cv' ? buildCV(raw) : buildResume(raw)
    const name = `${slug()}-${kind === 'cv' ? 'cv' : 'resume'}.pdf`
    const res = await saveFile(name, blob)
    toast(res === 'declined' ? 'Download cancelled.' : `${kind === 'cv' ? 'CV' : 'Resume'} downloaded.`)
  } catch (e) {
    toast(`Couldn't create the PDF: ${e.message}`)
  } finally {
    busy.value = ''
  }
}

function toggleEdit() {
  if (!state.unlocked) { close(); state.gateOpen = true; return }
  state.editing = !state.editing
  close()
  toast(state.editing ? 'Editing. Tap any text to change it.' : (hasUnpublished.value ? 'Saved in this browser. Publish to make it live.' : 'Done editing.'))
}

async function exportData() {
  const json = JSON.stringify(state.profile, null, 2)
  try {
    const res = await saveFile(`${slug()}-profile.json`, new Blob([json], { type: 'application/json' }))
    if (res !== 'declined') toast('Data exported as a backup file.')
  } catch (e) {
    try { await navigator.clipboard.writeText(json); toast('Data copied to the clipboard.') }
    catch (err) { toast('Export is not available in this browser.') }
  }
}

function lockNow() {
  lockOwner()
  toast('Locked. The password is needed again.')
}

function doReset() {
  resetProfile()
  state.editing = false
  close()
  toast('Back to the live version.')
}

const onKey = (e) => e.key === 'Escape' && close()
onMounted(() => { window.addEventListener('keydown', onKey); firstBtn.value?.focus() })
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="scrim" @click.self="close">
    <section class="sheet card" role="dialog" aria-modal="true" aria-labelledby="owner-title">
      <div class="sheet__head">
        <h2 id="owner-title">Owner menu</h2>
        <div class="head-btns">
          <button type="button" class="btn btn--small" @click="lockNow">Lock</button>
          <button type="button" class="btn btn--small btn--ghost" @click="close">Close</button>
        </div>
      </div>

      <div class="grid">
        <button ref="firstBtn" type="button" class="act act--accent" :disabled="!!busy" @click="download('cv')">
          <strong>{{ busy === 'cv' ? 'Creating…' : 'Download CV' }}</strong>
          <span>Full PDF with every entry and certificate images</span>
        </button>
        <button type="button" class="act tone-lilac" :disabled="!!busy" @click="download('resume')">
          <strong>{{ busy === 'resume' ? 'Creating…' : 'Download resume' }}</strong>
          <span>One-page PDF with the entries marked for the resume</span>
        </button>
        <button type="button" class="act tone-butter" @click="toggleEdit">
          <strong>{{ state.editing ? 'Finish editing' : 'Edit page' }}</strong>
          <span>{{ state.editing ? 'Save and go back to viewing' : 'Change text, entries and certificate images' }}</span>
        </button>
        <button type="button" class="act tone-peach" :disabled="!hasUnpublished || state.publishing" @click="publishNow">
          <strong>{{ state.publishing ? 'Publishing…' : 'Publish changes' }}</strong>
          <span>{{ hasUnpublished ? 'Make your edits live for everyone' : 'Nothing new to publish' }}</span>
        </button>
        <button type="button" class="act tone-mint" @click="exportData">
          <strong>Export data</strong>
          <span>Save all content as a backup file</span>
        </button>
      </div>

      <div class="reset">
        <button v-if="!confirmReset" type="button" class="link" @click="confirmReset = true">Discard unpublished edits</button>
        <template v-else>
          <span>Throw away edits that haven't been published?</span>
          <button type="button" class="btn btn--small btn--danger" @click="doReset">Remove edits</button>
          <button type="button" class="btn btn--small btn--ghost" @click="confirmReset = false">Keep them</button>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; z-index: 50; background: rgba(0, 0, 0, .45); display: grid; align-items: end; justify-items: center; }
.sheet {
  width: min(640px, 100%); border-bottom-left-radius: 0; border-bottom-right-radius: 0;
  border-bottom: 0; box-shadow: none; padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  display: grid; gap: 16px; animation: up .22s ease-out;
}
@keyframes up { from { transform: translateY(24px); opacity: .6; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .sheet { animation: none; } }
@media (min-width: 700px) {
  .scrim { align-items: center; }
  .sheet { border-radius: var(--r); border-bottom: var(--bw) solid var(--ink); box-shadow: var(--shadow); }
}
.sheet__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.head-btns { display: flex; gap: 8px; }
.sheet h2 { margin: 0; font-family: var(--display); font-size: 1.1rem; font-weight: 700; letter-spacing: -.03em; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.act {
  all: unset; box-sizing: border-box; cursor: pointer; display: grid; gap: 4px; padding: 14px 16px;
  border: var(--bw) solid var(--ink); border-radius: var(--r-sm); background: var(--tone);
  box-shadow: var(--shadow-sm); transition: transform .08s, box-shadow .08s;
}
.act strong { font-weight: 700; font-size: 1.02rem; }
.act span { font-size: .85rem; color: var(--ink-2); line-height: 1.35; }
.act--accent { background: var(--hot); color: var(--ink); }
.act--accent span { color: var(--accent-ink); opacity: .8; }
.act:hover { transform: translate(-1px, -1px); box-shadow: var(--shadow); }
.act:active { transform: translate(3px, 3px); box-shadow: none; }
.act:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
.act:disabled { opacity: .6; cursor: progress; }
.reset { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: .9rem; }
.link { all: unset; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; color: var(--muted); }
.link:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
</style>
