<script setup>
// Small stroke icon set drawn for this site (24 x 24, uses currentColor)
defineProps({ name: { type: String, required: true } })
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'user'"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></template>
    <template v-else-if="name === 'briefcase'"><rect x="3" y="7" width="18" height="13" rx="1" /><path d="M8 7V4h8v3M3 12h18" /></template>
    <template v-else-if="name === 'cap' || name === 'degree'"><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /></template>
    <template v-else-if="name === 'chat'"><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></template>
    <template v-else-if="name === 'spark'"><path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z" /></template>
    <template v-else-if="name === 'award'"><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></template>
    <template v-else-if="name === 'mail'"><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 7l9 6 9-6" /></template>
    <template v-else-if="name === 'phone'"><path d="M5 3h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 5a2 2 0 012-2z" /></template>
    <template v-else-if="name === 'pin'"><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></template>
    <template v-else-if="name === 'research'"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4M8 11h6M11 8v6" /></template>
    <template v-else-if="name === 'people'"><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.9 3.1-7 7-7s7 3.1 7 7" /><path d="M16 4.5a3.5 3.5 0 010 7M18 13.5c2.4.9 4 3.2 4 6.5" /></template>
    <template v-else-if="name === 'science'"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 001.3 2h12.4a1.5 1.5 0 001.3-2L14 9V3" /><path d="M7 15h10" /></template>
    <template v-else-if="name === 'test'"><path d="M6 3h9l4 4v14H6z" /><path d="M9 14l2 2 4-4" /></template>
    <template v-else-if="name === 'chart'"><path d="M4 4v16h16" /><path d="M7 7l11 11M7 17L18 6" /></template>
    <template v-else-if="name === 'image'"><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="2" /><path d="M21 17l-5-5-9 8" /></template>
    <template v-else-if="name === 'code'"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14" /></template>
    <template v-else><circle cx="12" cy="12" r="8" /></template>
  </svg>
</template>
