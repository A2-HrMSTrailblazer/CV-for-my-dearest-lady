import { jsPDF } from 'jspdf'

// Two PDFs from the same data:
//  CV     - everything, plus an appendix of certificate images
//  Resume - one page, only volunteer entries marked "on resume"
// Text stays selectable (not a screenshot), so applicant-tracking systems can read it.
// Headings use Courier to echo the site's monospace look; body text stays Helvetica for readability.
// Note: jsPDF's built-in fonts cover English only. Thai text needs an embedded Thai font.

const A4 = { w: 210, h: 297 }
const M = 18
const PINK = [255, 79, 163]
const LILAC = [205, 180, 255]
const PEACH = [255, 184, 148]
const INK = [0, 0, 0]
const GREY = [90, 90, 90]

const clean = (s) =>
  String(s ?? '')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')

function writer(doc) {
  let y = M
  const width = A4.w - M * 2
  const api = {
    get y() { return y },
    set y(v) { y = v },
    ensure(h) {
      if (y + h > A4.h - M) { doc.addPage(); y = M }
    },
    text(str, { size = 10, style = 'normal', color = INK, gap = 1.5, indent = 0, lh = 1.35, font = 'helvetica' } = {}) {
      doc.setFont(font, style)
      doc.setFontSize(size)
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(clean(str), width - indent)
      const step = size * 0.3528 * lh
      lines.forEach((ln) => {
        api.ensure(step)
        doc.text(ln, M + indent, y + size * 0.3528)
        y += step
      })
      y += gap
    },
    heading(str) {
      api.ensure(16)
      y += 4
      doc.setFillColor(...PINK)
      doc.rect(M, y, 3, 5.2, 'F')
      doc.setFont('courier', 'bold')
      doc.setFontSize(12.5)
      doc.setTextColor(...INK)
      doc.text(clean(str), M + 6, y + 4.2)
      y += 7.5
      doc.setDrawColor(...INK)
      doc.setLineWidth(0.6)
      doc.line(M, y, A4.w - M, y)
      y += 4
    },
    entry({ title, sub, right, body, extra }) {
      api.ensure(14)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(...INK)
      const rightW = right ? doc.getTextWidth(clean(right)) + 4 : 0
      const titleLines = doc.splitTextToSize(clean(title), width - rightW)
      titleLines.forEach((ln, i) => {
        doc.text(ln, M, y + 3.7)
        if (i === 0 && right) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9.5)
          doc.setTextColor(...GREY)
          doc.text(clean(right), A4.w - M, y + 3.7, { align: 'right' })
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10.5)
          doc.setTextColor(...INK)
        }
        y += 5
      })
      if (sub) api.text(sub, { size: 9.5, color: GREY, gap: 0.8 })
      if (body) api.text(body, { size: 9.5, gap: 0.8 })
      if (extra) api.text(extra, { size: 8.5, style: 'italic', color: GREY, gap: 0.8 })
      y += 2.5
    }
  }
  return api
}

function header(doc, w, p, compact) {
  // three-colour stripe matching the site
  const third = A4.w / 3
  ;[PINK, LILAC, PEACH].forEach((c, i) => { doc.setFillColor(...c); doc.rect(third * i, 0, third + 0.5, 4, 'F') })
  w.y = compact ? 14 : 16
  w.text(p.name, { size: compact ? 22 : 26, style: 'bold', gap: 1, lh: 1.1, font: 'courier' })
  if (p.nickname) w.text(`Also known as ${p.nickname}`, { size: 10, style: 'italic', color: GREY, gap: 0.8 })
  w.text([p.status, p.location].filter(Boolean).join('  |  '), { size: 10, color: GREY, gap: 0.5 })
  const contact = [p.email, p.phone, ...(p.links || []).map((l) => l.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))]
    .filter(Boolean)
    .join('  |  ')
  w.text(contact, { size: 9.5, color: GREY, gap: 3 })
  doc.setDrawColor(...INK)
  doc.setLineWidth(1.2)
  doc.line(M, w.y, A4.w - M, w.y)
  w.y += 3
}

function footer(doc, p, label) {
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GREY)
    doc.text(clean(`${p.name}  ${label}`), M, A4.h - 8)
    if (n > 1) doc.text(`${i} / ${n}`, A4.w - M, A4.h - 8, { align: 'right' })
  }
}

const range = (e) => `${e.start}${e.end ? ' - ' + e.end : ''}`
const certNote = (x) => (x.certificate ? `Certificate: ${x.certificate}` : '')
const langLine = (p) => p.languages.map((l) => `${l.name} (${l.level})`).join(', ')

function education(w, p, withCerts) {
  w.heading('Education')
  p.education.forEach((e) => w.entry({ title: e.title, sub: e.school, right: range(e), extra: withCerts ? certNote(e) : '' }))
}

export function buildCV(p) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = writer(doc)
  header(doc, w, p, false)

  if (p.bio) { w.heading('Profile'); w.text(p.bio, { size: 10 }) }
  education(w, p, true)

  if (p.experience.length) {
    w.heading('Experience')
    p.experience.forEach((x) => w.entry({ title: x.role, sub: x.org, right: range(x), body: x.summary, extra: certNote(x) }))
  }

  w.heading('Languages')
  p.languages.forEach((l) => w.text(`${l.name}: ${l.level}`, { size: 10, gap: 0.6 }))
  w.y += 1

  w.heading('Skills')
  if (p.programming?.length) w.text(`Programming: ${p.programming.join(', ')}`, { size: 10, gap: 1 })
  if (p.skills?.length) w.text(`Other: ${p.skills.join(', ')}`, { size: 10 })

  // Appendix: certificate images
  const withImg = [...p.experience, ...p.education].filter((x) => x.image)
  if (withImg.length) {
    doc.addPage()
    w.y = M
    w.heading('Appendix: certificates')
    withImg.forEach((x) => {
      let props
      try { props = doc.getImageProperties(x.image) } catch (e) { return }
      const maxW = A4.w - M * 2
      const maxH = 105
      const ratio = Math.min(maxW / props.width, maxH / props.height)
      const iw = props.width * ratio
      const ih = props.height * ratio
      w.ensure(ih + 14)
      w.text(`${x.certificate || 'Certificate'}: ${x.role || x.title}, ${x.org || x.school}`, { size: 9.5, style: 'bold', gap: 1.5 })
      doc.setDrawColor(...INK)
      doc.setLineWidth(0.6)
      doc.addImage(x.image, props.fileType || 'JPEG', M, w.y, iw, ih)
      doc.rect(M, w.y, iw, ih)
      w.y += ih + 8
    })
  }

  footer(doc, p, 'Curriculum vitae')
  return doc.output('blob')
}

export function buildResume(p) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const w = writer(doc)
  header(doc, w, p, true)

  if (p.bio) { w.heading('Summary'); w.text(p.bio, { size: 10 }) }
  education(w, p, false)

  const picks = p.experience.filter((x) => x.onResume).slice(0, 4)
  if (picks.length) {
    w.heading('Experience')
    picks.forEach((x) => w.entry({ title: x.role, sub: x.org, right: range(x) }))
  }

  w.heading('Languages and skills')
  w.text(`Languages: ${langLine(p)}`, { size: 10, gap: 1 })
  const sk = [...(p.programming || []), ...(p.skills || [])]
  if (sk.length) w.text(`Skills: ${sk.join(', ')}`, { size: 10 })

  footer(doc, p, 'Resume')
  return doc.output('blob')
}
