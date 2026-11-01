<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { state } from '../composables/useStore.js'
import { checkPassword, rememberOwner, lockedForMs } from '../lib/auth.js'

const pw = ref('')
const show = ref(false)
const error = ref('')
const checking = ref(false)
const input = ref(null)

const close = () => { state.gateOpen = false }

function lockMessage(ms) {
  return `Too many wrong tries. Try again in ${Math.ceil(ms / 1000)} seconds.`
}

async function submit() {
  if (!pw.value || checking.value) return
  checking.value = true
  error.value = ''
  try {
    const res = await checkPassword(pw.value)
    if (res.ok) {
      state.unlocked = true
      rememberOwner(pw.value)
      state.gateOpen = false
      state.ownerOpen = true
    } else if (res.wait) {
      error.value = lockMessage(res.wait)
    } else {
      error.value = `Wrong password. ${res.left} ${res.left === 1 ? 'try' : 'tries'} left before a 1-minute wait.`
      pw.value = ''
      input.value?.focus()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    checking.value = false
  }
}

const onKey = (e) => e.key === 'Escape' && close()
onMounted(() => {
  window.addEventListener('keydown', onKey)
  const wait = lockedForMs()
  if (wait) error.value = lockMessage(wait)
  input.value?.focus()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="scrim" @click.self="close">
    <form class="gate card" role="dialog" aria-modal="true" aria-labelledby="gate-title" @submit.prevent="submit">
      <h2 id="gate-title">Owner password</h2>
      <p class="hint">Enter the password to download the CV or edit this page.</p>

      <label for="owner-pw" class="sr-only">Password</label>
      <div class="field" :class="{ bad: error }">
        <input
          id="owner-pw"
          ref="input"
          v-model="pw"
          :type="show ? 'text' : 'password'"
          autocomplete="current-password"
          autocapitalize="off"
          spellcheck="false"
          :aria-invalid="error ? 'true' : 'false'"
          aria-describedby="gate-error"
        />
        <button type="button" class="peek" :aria-pressed="show" @click="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
      </div>
      <p id="gate-error" class="error" aria-live="polite">{{ error }}</p>

      <div class="row">
        <button type="button" class="btn btn--ghost" @click="close">Cancel</button>
        <button type="submit" class="btn btn--solid" :disabled="checking || !pw">{{ checking ? 'Checking…' : 'Unlock' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; z-index: 55; background: rgba(43, 0, 22, .5); display: grid; place-items: center; padding: 16px; }
.gate { width: min(420px, 100%); padding: 22px; display: grid; gap: 12px; }
.gate h2 { margin: 0; font-family: var(--display); font-size: 1.1rem; font-weight: 700; letter-spacing: -.03em; }
.hint { margin: 0; color: var(--muted); font-size: .92rem; }
.field {
  display: flex; align-items: stretch; border: var(--bw) solid var(--ink); border-radius: var(--r-sm);
  background: var(--surface); box-shadow: var(--shadow-sm); overflow: hidden;
}
.field:focus-within { outline: 3px solid var(--focus); outline-offset: 3px; }
.field.bad { background: #FFF0F0; }
.field input {
  flex: 1; min-width: 0; border: 0; background: transparent; font: inherit; font-size: 1.05rem;
  padding: 12px 14px; outline: none; letter-spacing: .04em;
}
.peek { border: 0; border-left: var(--bw) solid var(--ink); background: var(--tint); padding: 0 14px; font-weight: 700; cursor: pointer; }
.peek:focus-visible { outline: 3px solid var(--focus); outline-offset: -5px; }
.error { margin: 0; min-height: 1.4em; color: var(--danger); font-weight: 600; font-size: .9rem; }
.row { display: flex; justify-content: flex-end; gap: 10px; }
.btn:disabled { opacity: .55; cursor: not-allowed; transform: none; box-shadow: var(--shadow-sm); }
</style>
