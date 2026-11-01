import { ref, onMounted, onBeforeUnmount } from 'vue'

// Hidden ways to open the owner menu:
//  1. Press and hold the name for about one second (touch or mouse).
//  2. On a keyboard, type the word "owner" anywhere outside a text field.
// Anyone who reads the source code can find these, so this hides the menu, it does not protect it.

const HOLD_MS = 900
const SECRET = 'owner'

export function useOwnerGesture(onOpen) {
  const holding = ref(false)
  let timer = null
  let start = null

  function down(e) {
    start = { x: e.clientX, y: e.clientY }
    holding.value = true
    timer = setTimeout(() => {
      holding.value = false
      if (navigator.vibrate) { try { navigator.vibrate(20) } catch (err) { /* ignore */ } }
      onOpen()
    }, HOLD_MS)
  }
  function cancel() {
    clearTimeout(timer)
    holding.value = false
  }
  function move(e) {
    if (!start) return
    if (Math.abs(e.clientX - start.x) > 10 || Math.abs(e.clientY - start.y) > 10) cancel()
  }

  let typed = ''
  function onKey(e) {
    const t = e.target
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
    if (e.key.length !== 1) return
    typed = (typed + e.key.toLowerCase()).slice(-SECRET.length)
    if (typed === SECRET) { typed = ''; onOpen() }
  }
  onMounted(() => window.addEventListener('keydown', onKey))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

  return {
    holding,
    holdHandlers: {
      pointerdown: down,
      pointerup: cancel,
      pointerleave: cancel,
      pointercancel: cancel,
      pointermove: move,
      contextmenu: (e) => e.preventDefault()
    }
  }
}
