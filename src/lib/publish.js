// Sends edits to /api/publish (a Vercel function), which saves them to GitHub.
// New images (data URLs) are uploaded as files under public/content/ and replaced by their paths.

const BATCH = 3_200_000 // stay well under Vercel's 4.5 MB request limit
const uploaded = new Map() // data URL -> path, so the same image isn't uploaded twice in one visit

async function post(body) {
  let r
  try {
    r = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch (e) {
    throw new Error('Could not reach the server. Check the internet connection and try again.')
  }
  const isJson = (r.headers.get('content-type') || '').includes('json')
  if (!r.ok && !isJson) {
    throw new Error('Publishing only works on the deployed site (Vercel). Use Export data here instead.')
  }
  let data = {}
  try { data = await r.json() } catch (e) { /* non-JSON answer */ }
  if (!r.ok) throw new Error(data.error || `Publishing failed (${r.status}).`)
  return data
}

export async function publishProfile(profile, password) {
  const p = JSON.parse(JSON.stringify(profile))
  const stamp = Date.now().toString(36)
  const images = {}
  const take = (obj, key, name) => {
    const v = obj[key]
    if (typeof v !== 'string' || !v.startsWith('data:image/')) return
    if (uploaded.has(v)) { obj[key] = uploaded.get(v); return }
    const path = `content/${String(name).toLowerCase().replace(/[^a-z0-9-]/g, '')}-${stamp}.jpg`
    images[path] = v
    obj[key] = path
    uploaded.set(v, path)
  }
  take(p, 'photo', 'photo')
  p.experience.forEach((x) => take(x, 'image', x.id))
  p.education.forEach((x) => take(x, 'image', x.id))

  // Big uploads go in several requests; the last one carries the content itself
  const batches = []
  let cur = {}
  let size = 0
  for (const [k, v] of Object.entries(images)) {
    if (size + v.length > BATCH && Object.keys(cur).length) { batches.push(cur); cur = {}; size = 0 }
    cur[k] = v
    size += v.length
  }
  try {
    for (const b of batches) await post({ password, images: b })
    await post({ password, profile: p, images: cur })
  } catch (e) {
    Object.keys(images).forEach((path) => { for (const [d, pth] of uploaded) if (pth === path) uploaded.delete(d) })
    throw e
  }
  return p
}
