// Vercel serverless function: POST /api/publish
// Checks the owner password on the server, then saves the new content (and any new images)
// to the GitHub repository in a single commit. Vercel sees the commit and redeploys the site.
//
// Needs these environment variables in Vercel (Project → Settings → Environment Variables):
//   GITHUB_TOKEN   fine-grained token with "Contents: Read and write" on this one repository
//   GITHUB_REPO    owner/name, e.g. eieimon/cv-site
//   GITHUB_BRANCH  optional, defaults to main
import { pbkdf2Sync, timingSafeEqual } from 'node:crypto'
import { OWNER_PASSWORD } from '../src/config.js'

const GH = process.env.GITHUB_API_URL || 'https://api.github.com' // override only for tests
const DATA_PATH = 'src/data/profile.json'
const IMG_DIR = 'public/content/'
const IMG_KEY = /^content\/[a-z0-9-]{1,60}\.jpg$/
const IMG_VALUE = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/
const MAX_JSON = 512 * 1024

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function passwordOk(pw) {
  if (typeof pw !== 'string' || !pw || pw.length > 200) return false
  const got = pbkdf2Sync(pw, Buffer.from(OWNER_PASSWORD.salt, 'hex'), OWNER_PASSWORD.iterations, 32, 'sha256')
  const want = Buffer.from(OWNER_PASSWORD.hash, 'hex')
  return got.length === want.length && timingSafeEqual(got, want)
}

async function gh(path, init = {}) {
  const r = await fetch(GH + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    }
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    const e = new Error(body.message || `GitHub answered ${r.status}`)
    e.status = r.status
    throw e
  }
  return body
}

function validProfile(p) {
  return p && typeof p === 'object' && !Array.isArray(p) &&
    typeof p.name === 'string' && Array.isArray(p.experience) && Array.isArray(p.education) && Array.isArray(p.languages)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' })

  const { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH = 'main' } = process.env
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return res.status(500).json({ error: 'Publishing is not set up yet. Add GITHUB_TOKEN and GITHUB_REPO in Vercel, then redeploy.' })
  }

  const { password, profile, images = {} } = req.body || {}
  if (!passwordOk(password)) {
    await sleep(1000) // slow down guessing
    return res.status(401).json({ error: 'Wrong password.' })
  }

  // Check what we were sent before touching the repository
  const files = []
  for (const [key, value] of Object.entries(images)) {
    const m = typeof value === 'string' && value.match(IMG_VALUE)
    if (!IMG_KEY.test(key) || !m) return res.status(400).json({ error: `Image ${key} is not a valid JPEG upload.` })
    files.push({ path: 'public/' + key, base64: m[1] })
  }
  let json = null
  if (profile !== undefined) {
    if (!validProfile(profile)) return res.status(400).json({ error: 'The content is missing required parts.' })
    json = JSON.stringify(profile, null, 2) + '\n'
    if (json.length > MAX_JSON) return res.status(400).json({ error: 'The content is too large.' })
    if (json.includes('data:')) return res.status(400).json({ error: 'Images must be sent separately.' })
  }
  if (!files.length && json === null) return res.status(400).json({ error: 'Nothing to publish.' })

  try {
    const repo = `/repos/${GITHUB_REPO}`
    const ref = await gh(`${repo}/git/ref/heads/${GITHUB_BRANCH}`)
    const parent = ref.object.sha
    const base = await gh(`${repo}/git/commits/${parent}`)

    const tree = []
    for (const f of files) {
      const blob = await gh(`${repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: f.base64, encoding: 'base64' }) })
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha })
    }
    if (json !== null) {
      tree.push({ path: DATA_PATH, mode: '100644', type: 'blob', content: json })
      // Remove uploaded images that the new content no longer uses
      const current = await gh(`${repo}/git/trees/${base.tree.sha}?recursive=1`)
      const incoming = new Set(files.map((f) => f.path))
      for (const t of current.tree || []) {
        if (t.type !== 'blob' || !t.path.startsWith(IMG_DIR) || incoming.has(t.path)) continue
        const rel = t.path.slice('public/'.length)
        if (!json.includes(`"${rel}"`)) tree.push({ path: t.path, mode: '100644', type: 'blob', sha: null })
      }
    }

    const newTree = await gh(`${repo}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) })
    const message = json !== null ? 'Update profile from the website' : 'Upload images from the website'
    const commit = await gh(`${repo}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }) })
    await gh(`${repo}/git/refs/heads/${GITHUB_BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) })

    return res.status(200).json({ ok: true, commit: commit.sha })
  } catch (e) {
    const hint = e.status === 401 || e.status === 403
      ? 'GitHub refused the token. It may have expired or lack "Contents: Read and write". Make a new one and update GITHUB_TOKEN in Vercel.'
      : e.status === 404
        ? 'GitHub could not find the repository or branch. Check GITHUB_REPO and GITHUB_BRANCH in Vercel.'
        : `GitHub error: ${e.message}`
    return res.status(502).json({ error: hint })
  }
}
