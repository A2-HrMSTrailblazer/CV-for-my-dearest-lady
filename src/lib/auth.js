// Checks the owner password in the browser against the salted hash in src/config.js.
// This keeps casual visitors out of the owner menu. It is not server-side security:
// someone who downloads and edits the JavaScript can still get around it.
import { OWNER_PASSWORD } from '../config.js'

const LOCK_KEY = 'econ-cv:lockout'
const MAX_TRIES = 5
const LOCK_MS = 60_000

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const bytes = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)))

function readLock() {
  try { return JSON.parse(localStorage.getItem(LOCK_KEY)) || { tries: 0, until: 0 } }
  catch (e) { return { tries: 0, until: 0 } }
}
function writeLock(v) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(v)) } catch (e) { /* ignore */ }
}

export function lockedForMs() {
  return Math.max(0, readLock().until - Date.now())
}

export async function checkPassword(pw) {
  if (!window.crypto?.subtle) throw new Error('This browser cannot check passwords here. Open the site over https.')
  const wait = lockedForMs()
  if (wait) return { ok: false, wait }

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: bytes(OWNER_PASSWORD.salt), iterations: OWNER_PASSWORD.iterations },
    key,
    256
  )
  if (hex(bits) === OWNER_PASSWORD.hash) {
    writeLock({ tries: 0, until: 0 })
    return { ok: true }
  }
  const lock = readLock()
  lock.tries += 1
  if (lock.tries >= MAX_TRIES) { lock.tries = 0; lock.until = Date.now() + LOCK_MS }
  writeLock(lock)
  return { ok: false, left: lock.until ? 0 : MAX_TRIES - lock.tries, wait: lockedForMs() }
}

// The password is kept in memory only (never stored), so reloading the page locks the menu again.
// Publishing sends it to the server, which checks it again before saving anything.
let ownerPassword = ''
export function rememberOwner(pw) { ownerPassword = pw }
export function forgetOwner() { ownerPassword = '' }
export function hasOwnerPassword() { return !!ownerPassword }
export function getOwnerPassword() { return ownerPassword }
