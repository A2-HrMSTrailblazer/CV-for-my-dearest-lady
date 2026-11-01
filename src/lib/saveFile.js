// Saves a generated file.
// On a normal website this is a plain browser download.
// Inside a Claude artifact preview, downloads go through the host's "downloads" capability instead.

let hostDownloads = null
if (typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function') {
  hostDownloads = window.claude.use('downloads').catch(() => null)
}

export async function saveFile(filename, blob) {
  if (hostDownloads) {
    const dl = await hostDownloads
    if (dl) {
      try {
        await dl.save({ filename, data: blob })
        return 'saved'
      } catch (e) {
        if (e && e.code === 'declined') return 'declined'
        throw new Error((e && e.message) || 'Download is not available here.')
      }
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
  return 'saved'
}
