import { reactive, watch, computed } from 'vue'
import published from '../data/profile.json'
import { forgetOwner, hasOwnerPassword, getOwnerPassword } from '../lib/auth.js'
import { publishProfile } from '../lib/publish.js'

// The site is built from src/data/profile.json (the published version).
// Edits made in edit mode are kept in this browser until they are published.
const KEY = 'econ-cv:profile:v3'
const clone = (o) => JSON.parse(JSON.stringify(o))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const local = { ...clone(published), ...JSON.parse(raw) }
      // Once the published site has caught up with this browser's copy, drop the copy
      if (same(local, published)) { localStorage.removeItem(KEY); return clone(published) }
      return local
    }
  } catch (e) { /* storage unavailable: fall back to the published version */ }
  return clone(published)
}

export const state = reactive({
  profile: load(),
  editing: false,
  ownerOpen: false,
  gateOpen: false,
  unlocked: false,
  publishing: false,
  pendingSnapshot: null, // what was last published from this tab, while the live site rebuilds
  toast: ''
})

// True when this browser has edits that haven't been published yet
export const hasUnpublished = computed(() =>
  JSON.stringify(state.profile) !== (state.pendingSnapshot ?? JSON.stringify(published))
)

export async function publishNow() {
  if (!state.unlocked || !hasOwnerPassword()) { state.gateOpen = true; return }
  if (state.publishing) return
  state.publishing = true
  try {
    const withPaths = await publishProfile(state.profile, getOwnerPassword())
    state.pendingSnapshot = JSON.stringify(state.profile)
    // Keep the published version (image paths, not image data) until the live site catches up
    try { localStorage.setItem(KEY, JSON.stringify(withPaths)) } catch (e) { /* ignore */ }
    toast('Published. Everyone will see it in about a minute.')
  } catch (e) {
    toast(e.message)
  } finally {
    state.publishing = false
  }
}

export function saveLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(state.profile)) }
  catch (e) { toast('Not saved: this browser is out of storage. Publish now, or use a smaller image.') }
}

let toastTimer
export function toast(msg) {
  state.toast = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (state.toast = ''), 2800)
}

// Save edits in this browser while edit mode is on
watch(
  () => state.profile,
  () => { if (state.editing && state.unlocked) saveLocal() },
  { deep: true }
)

// Opening the owner menu always goes through the password unless this tab is already unlocked
export function openOwnerMenu() {
  if (state.unlocked && hasOwnerPassword()) state.ownerOpen = true
  else state.gateOpen = true
}

export function lockOwner() {
  state.unlocked = false
  state.editing = false
  state.ownerOpen = false
  forgetOwner()
}

export function resetProfile() {
  try { localStorage.removeItem(KEY) } catch (e) { /* ignore */ }
  state.profile = clone(published)
}

export const uid = () => Math.random().toString(36).slice(2, 9)

// Parses dates like "Jun 2026", "7 Dec 2024" or "expected 2030" into a decimal year (2026.42)
const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
export function toYear(str, fallbackMonth = 6) {
  const s = String(str || '').toLowerCase()
  const y = s.match(/(19|20)\d{2}/)
  if (!y) return null
  const m = MONTHS.findIndex((mm) => s.includes(mm))
  return Number(y[0]) + ((m >= 0 ? m : fallbackMonth - 1) / 12)
}

export const dateRange = (a, b) => (b ? `${a} – ${b}` : a)
