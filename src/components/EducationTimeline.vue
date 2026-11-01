<script setup>
// Highlight card: how many degrees are in progress, plus a small timeline drawn from the education dates
import { computed } from 'vue'
import { state, toYear } from '../composables/useStore.js'

const now = new Date().getFullYear() + new Date().getMonth() / 12

const rows = computed(() =>
  state.profile.education
    .map((e) => ({ id: e.id, label: e.short || e.title, a: toYear(e.start), b: toYear(e.end), kind: e.kind }))
    .filter((r) => r.a !== null)
    .sort((r1, r2) => r1.a - r2.a)
)
const inProgress = computed(() =>
  state.profile.education.filter((e) => e.kind === 'degree' && (toYear(e.end) ?? Infinity) > now).length
)

const W = 340, L = 118, R = 12, ROW = 24, TOP = 8
const span = computed(() => {
  const ys = rows.value.flatMap((r) => [r.a, r.b ?? r.a]).concat(now)
  return [Math.floor(Math.min(...ys)), Math.ceil(Math.max(...ys) + 0.01)]
})
const H = computed(() => TOP + rows.value.length * ROW + 26)
const x = (y) => L + ((y - span.value[0]) / (span.value[1] - span.value[0])) * (W - L - R)
const ticks = computed(() => {
  const out = []
  for (let y = span.value[0]; y <= span.value[1]; y += 1) out.push(y)
  return out.length > 6 ? out.filter((_, i) => i % 2 === 0) : out
})
</script>

<template>
  <article class="hl-card card">
    <div class="big">
      <p class="big__num">{{ inProgress }}</p>
      <p class="big__label">{{ inProgress === 1 ? 'degree' : 'degrees' }} in progress at the same time</p>
    </div>
    <figure class="tl">
      <svg :viewBox="`0 0 ${W} ${H}`" role="img" :aria-label="`Education timeline from ${span[0]} to ${span[1]}`">
        <line v-for="t in ticks" :key="'g' + t" :x1="x(t)" :x2="x(t)" :y1="TOP - 4" :y2="H - 22" class="grid" />
        <g v-for="(r, i) in rows" :key="r.id">
          <text :x="0" :y="TOP + i * ROW + 15" class="lab">{{ r.label }}</text>
          <rect v-if="r.b" :x="x(r.a)" :y="TOP + i * ROW + 5" :width="Math.max(4, x(r.b) - x(r.a))" height="12"
                class="bar" :class="i % 2 ? 'bar--b' : 'bar--a'" />
          <circle v-else :cx="x(r.a)" :cy="TOP + i * ROW + 11" r="6" class="dot" />
        </g>
        <line :x1="x(now)" :x2="x(now)" :y1="TOP - 4" :y2="H - 22" class="now" />
        <text :x="x(now) + 4" :y="H - 24" class="now-lab">now</text>
        <text v-for="t in ticks" :key="'t' + t" :x="x(t)" :y="H - 6" text-anchor="middle" class="tick">{{ t }}</text>
      </svg>
      <figcaption class="sr-only">Bars show study periods; dots show exam dates.</figcaption>
    </figure>
  </article>
</template>

<style scoped>
.hl-card { background: var(--orchid); display: grid; gap: 14px; padding: 16px; align-content: start; }
.big { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: var(--bw) solid var(--ink); }
.big__num { margin: 0; font-size: 2.6rem; font-weight: 700; line-height: 1; letter-spacing: -.05em; }
.big__label { margin: 0; font-size: .85rem; line-height: 1.35; max-width: 22ch; }
.tl { margin: 0; overflow-x: auto; }
svg { display: block; width: 100%; min-width: 280px; height: auto; font-family: var(--font); }
.grid { stroke: var(--ink); stroke-opacity: .18; }
.lab { font-size: 11px; font-weight: 600; fill: var(--ink); }
.bar { stroke: var(--ink); stroke-width: 2; rx: 2; }
.bar--a { fill: var(--hot); }
.bar--b { fill: var(--lilac); }
.dot { fill: var(--butter); stroke: var(--ink); stroke-width: 2; }
.now { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 3 3; }
.now-lab { font-size: 10px; font-weight: 600; fill: var(--ink); }
.tick { font-size: 10.5px; fill: var(--ink-2); font-variant-numeric: tabular-nums; }
</style>
