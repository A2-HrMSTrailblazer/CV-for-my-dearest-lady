// Shrinks a picked image file to a JPEG data URL small enough for browser storage
export function readImage(file, max = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Choose an image file (JPG or PNG).'))
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read. Try a JPG or PNG.')) }
    img.src = url
  })
}

// The PDF maker needs image data, not file paths: turn published image paths back into data URLs
async function toDataUrl(src) {
  const r = await fetch(src)
  if (!r.ok) throw new Error('missing')
  const blob = await r.blob()
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = reject
    fr.readAsDataURL(blob)
  })
}

export async function withImageData(profile) {
  const p = JSON.parse(JSON.stringify(profile))
  const fix = async (obj, key) => {
    const v = obj[key]
    if (!v || v.startsWith('data:')) return
    try { obj[key] = await toDataUrl(v) } catch (e) { obj[key] = '' }
  }
  await fix(p, 'photo')
  for (const x of [...p.experience, ...p.education]) await fix(x, 'image')
  return p
}
