import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Absolute site address for the link-preview tags in index.html.
// Set SITE_URL yourself (e.g. a custom domain), or let Vercel provide its production address.
const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
).replace(/\/$/, '')

const siteUrlPlugin = {
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl || '.')
}

// `npm run build`        -> normal build in dist/ (what Vercel deploys)
// `npm run build:single` -> one self-contained dist-single/index.html (handy for previews)
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [vue(), siteUrlPlugin, viteSingleFile()] : [vue(), siteUrlPlugin],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' }
}))
