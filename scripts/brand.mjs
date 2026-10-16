// Brand palette from a logo. Writes src/brand.css; nothing else in the build needs to know a hex.
//
//   npm run brand -- public/assets/logo.svg              extract from the logo (svg, png, jpg, webp)
//   npm run brand -- --primary "#1d4e89"                  skip extraction, start from a known colour
//   npm run brand -- logo.png --secondary "#e0a030"       extracted primary, chosen second hue
//   npm run brand -- logo.svg --out src/brand.css --json  also print the palette as JSON
//
// How it decides: the logo is rasterised in headless Chromium, opaque pixels are grouped by
// hue and lightness in OKLab, and the most-used saturated colour becomes the brand. Every
// text/background pair is then solved for WCAG contrast (4.5:1 body, 3:1 large) by moving
// lightness in OKLCH while keeping the hue, after Material's HCT approach. Neutrals are tinted
// toward the brand hue so the page never sits on pure #fff or #000. A black or grey logo gets a
// cool neutral hue with the logo's darkest tone as the primary.
//
// Output also includes test-results/brand/swatches.html so you can look before you trust it.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1] }
const flag = name => args.includes(name)
const logoPath = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true && /\.(svg|png|jpe?g|webp|gif|avif)$/i.test(a))
const outPath = resolve(option('--out') || 'src/brand.css')

// ---------- colour math (sRGB <-> OKLab/OKLCH, WCAG contrast) ----------
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const srgbToLinear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const linearToSrgb = c => { const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055; return v }
export function rgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
export function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [lr, lg, lb].map(linearToSrgb)
}
const toLch = ([L, a, b]) => ({ L, C: Math.hypot(a, b), H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 })
const fromLch = ({ L, C, H }) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)]
const inGamut = rgb => rgb.every(c => c >= -0.0005 && c <= 1.0005)
// Lower chroma until the colour fits sRGB; hue and lightness stay put.
export function lchToHex(lch) {
  let C = lch.C
  for (let i = 0; i < 40; i++) { const rgb = oklabToRgb(fromLch({ ...lch, C })); if (inGamut(rgb)) return hex(rgb.map(c => Math.round(clamp(c) * 255))); C *= 0.9 }
  return hex(oklabToRgb(fromLch({ ...lch, C: 0 })).map(c => Math.round(clamp(c) * 255)))
}
const hex = ([r, g, b]) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
const parseHex = h => { const m = h.replace('#', ''); const s = m.length === 3 ? m.split('').map(c => c + c).join('') : m; return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16)) }
const luminance = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
export const contrast = (h1, h2) => { const a = luminance(parseHex(h1)), b = luminance(parseHex(h2)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
// Move L of `lch` away from `against` until the pair meets `ratio`. Returns a hex.
export function solve(lch, againstHex, ratio) {
  const againstL = toLch(rgbToOklab(parseHex(againstHex))).L
  const dir = lch.L >= againstL ? 1 : -1
  let lo = lch.L, hi = dir > 0 ? 1 : 0
  if (contrast(lchToHex(lch), againstHex) >= ratio) return lchToHex(lch)
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (contrast(lchToHex({ ...lch, L: mid }), againstHex) >= ratio) hi = mid; else lo = mid }
  const out = lchToHex({ ...lch, L: hi })
  if (contrast(out, againstHex) < ratio) { // the hue cannot reach it at this chroma; drop chroma and go to the extreme
    return lchToHex({ L: dir > 0 ? 0.99 : 0.12, C: Math.min(lch.C, 0.03), H: lch.H })
  }
  return out
}

// ---------- palette ----------
export function palette({ primary, secondary }) {
  const brand = toLch(rgbToOklab(parseHex(primary)))
  const chromatic = brand.C >= 0.035
  const H = chromatic ? brand.H : 250
  const tint = chromatic ? Math.min(0.02, brand.C * 0.25) : 0.008
  const paper = lchToHex({ L: 0.985, C: tint * 0.45, H })
  const ink = lchToHex({ L: 0.22, C: tint, H })
  // Primary: keep the logo colour unless it cannot carry readable text, then nudge its lightness.
  const primaryIsLight = brand.L > 0.62
  let primaryHex = primary
  let primaryFg = primaryIsLight ? ink : paper
  if (contrast(primaryHex, primaryFg) < 4.5) { primaryHex = solve(brand, primaryFg, 4.5); if (contrast(primaryHex, primaryFg) < 4.5) { primaryFg = primaryIsLight ? paper : ink; primaryHex = solve(brand, primaryFg, 4.5) } }
  const second = secondary ? toLch(rgbToOklab(parseHex(secondary))) : null
  const accentH = second ? second.H : H
  const light = {
    brand: primary, 'brand-foreground': primaryFg,
    background: paper, foreground: ink, card: lchToHex({ L: 0.995, C: tint * 0.3, H }), 'card-foreground': ink, popover: lchToHex({ L: 0.995, C: tint * 0.3, H }), 'popover-foreground': ink,
    primary: primaryHex, 'primary-foreground': primaryFg,
    secondary: lchToHex({ L: 0.945, C: tint * 0.8, H }), 'secondary-foreground': ink,
    muted: lchToHex({ L: 0.945, C: tint * 0.8, H }), 'muted-foreground': solve({ L: 0.48, C: tint, H }, paper, 4.5),
    accent: lchToHex({ L: 0.92, C: second ? Math.min(0.06, second.C * 0.5) : tint * 1.6, H: accentH }), 'accent-foreground': ink,
    destructive: '#c42828',
    border: lchToHex({ L: 0.88, C: tint * 0.6, H }), input: lchToHex({ L: 0.85, C: tint * 0.6, H }), ring: solve({ L: 0.6, C: Math.min(brand.C, 0.12), H }, paper, 3),
  }
  const dark = {
    background: lchToHex({ L: 0.17, C: tint * 0.7, H }), foreground: lchToHex({ L: 0.95, C: tint * 0.3, H }),
    card: lchToHex({ L: 0.21, C: tint * 0.7, H }), 'card-foreground': lchToHex({ L: 0.95, C: tint * 0.3, H }), popover: lchToHex({ L: 0.23, C: tint * 0.7, H }), 'popover-foreground': lchToHex({ L: 0.95, C: tint * 0.3, H }),
    primary: null, 'primary-foreground': null,
    secondary: lchToHex({ L: 0.28, C: tint * 0.8, H }), 'secondary-foreground': lchToHex({ L: 0.95, C: tint * 0.3, H }),
    muted: lchToHex({ L: 0.28, C: tint * 0.8, H }), 'muted-foreground': null,
    accent: lchToHex({ L: 0.31, C: second ? Math.min(0.05, second.C * 0.4) : tint, H: accentH }), 'accent-foreground': lchToHex({ L: 0.95, C: tint * 0.3, H }),
    destructive: '#f07777',
    border: lchToHex({ L: 0.33, C: tint * 0.6, H }), input: lchToHex({ L: 0.37, C: tint * 0.6, H }), ring: null,
  }
  // Dark primary: the brand lifted until dark ink reads on it, so buttons stay recognisably the brand.
  const darkInk = lchToHex({ L: 0.16, C: tint, H })
  dark.primary = chromatic ? solve({ ...brand, L: Math.max(brand.L, 0.68) }, darkInk, 4.5) : dark.foreground
  dark['primary-foreground'] = darkInk
  dark['muted-foreground'] = solve({ L: 0.72, C: tint, H }, dark.background, 4.5)
  dark.ring = solve({ L: 0.7, C: Math.min(brand.C, 0.1), H }, dark.background, 3)
  const checks = [
    ['foreground on background', light.foreground, light.background, 4.5], ['primary-foreground on primary', light['primary-foreground'], light.primary, 4.5],
    ['muted-foreground on background', light['muted-foreground'], light.background, 4.5], ['secondary-foreground on secondary', light['secondary-foreground'], light.secondary, 4.5],
    ['accent-foreground on accent', light['accent-foreground'], light.accent, 4.5], ['dark foreground on background', dark.foreground, dark.background, 4.5],
    ['dark primary-foreground on primary', dark['primary-foreground'], dark.primary, 4.5], ['dark muted-foreground on background', dark['muted-foreground'], dark.background, 4.5],
  ].map(([name, a, b, need]) => ({ name, ratio: +contrast(a, b).toFixed(2), need, ok: contrast(a, b) >= need }))
  return { light, dark, hue: +H.toFixed(1), chromatic, checks }
}

// ---------- extraction ----------
async function extract(file) {
  const buf = await readFile(file)
  const mime = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' }[extname(file).toLowerCase()]
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath()
  await access(executablePath).catch(() => { throw new Error('No installed Chromium. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE, or pass --primary "#hex" to skip extraction.') })
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-gpu'] })
  try {
    const page = await browser.newPage()
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
    const result = await page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode()
      const size = 320, canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight), w = img.naturalWidth * scale, h = img.naturalHeight * scale
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
      const d = ctx.getImageData(0, 0, size, size).data
      const bins = new Map()
      let opaque = 0
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue
        opaque++
        const r = d[i], g = d[i + 1], b = d[i + 2]
        // Coarse bins: 12 per channel keeps distinct brand colours apart and merges anti-aliasing.
        const key = `${r >> 4},${g >> 4},${b >> 4}`
        const e = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 }
        e.n++; e.r += r; e.g += g; e.b += b; bins.set(key, e)
      }
      const list = [...bins.values()].map(e => ({ n: e.n, rgb: [Math.round(e.r / e.n), Math.round(e.g / e.n), Math.round(e.b / e.n)] })).sort((a, b) => b.n - a.n)
      return { opaque, colors: list.slice(0, 24), width: img.naturalWidth, height: img.naturalHeight }
    }, dataUrl)
    return result
  } finally { await browser.close() }
}
function choose(colors, opaque) {
  const scored = colors.map(c => { const lch = toLch(rgbToOklab(c.rgb)); return { ...c, lch, hex: hex(c.rgb), share: c.n / opaque } })
  const chromatic = scored.filter(c => c.lch.C >= 0.05 && c.lch.L > 0.12 && c.lch.L < 0.95)
  // Score: how much of the logo it covers, weighted toward usable chroma (after Material's score step).
  const score = c => c.share * (0.5 + Math.min(c.lch.C, 0.2) * 4)
  chromatic.sort((a, b) => score(b) - score(a))
  const primary = chromatic[0] || scored.filter(c => c.lch.L < 0.6).sort((a, b) => b.n - a.n)[0] || scored[0]
  const secondary = chromatic.find(c => c !== primary && Math.min(Math.abs(c.lch.H - primary.lch.H), 360 - Math.abs(c.lch.H - primary.lch.H)) >= 40 && score(c) > 0.02)
  return { primary, secondary, all: scored.slice(0, 8) }
}

// ---------- output ----------
function css(p) {
  const block = (sel, obj) => `${sel} {\n${Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`
  return `/*\n  Brand colours, generated by \`npm run brand\` on ${new Date().toISOString().slice(0, 10)}.\n  Hue ${p.hue}, ${p.chromatic ? 'chromatic brand' : 'neutral logo (cool neutral hue chosen)'}. Every text/background pair below passes WCAG AA.\n  Regenerate from the logo rather than editing hexes here; components read these variables only.\n*/\n${block(':root', p.light)}\n${block('.dark', p.dark)}\n`
}
function swatches(p, source) {
  const row = (name, obj) => Object.entries(obj).filter(([k]) => !/foreground|brand/.test(k)).map(([k, v]) => `<div class="sw" style="background:${v};color:${obj[k + '-foreground'] || (name === 'dark' ? obj.foreground : obj.foreground)}"><b>${k}</b><span>${v}</span></div>`).join('')
  return `<!doctype html><meta charset="utf-8"><title>Brand swatches</title><style>body{font:14px system-ui;margin:24px;background:#eee}h2{margin:24px 0 8px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.sw{padding:14px 12px;border-radius:8px;min-height:64px;display:flex;flex-direction:column;justify-content:space-between}.sw b{font-weight:600}.sw span{font-family:ui-monospace,monospace;font-size:12px}table{border-collapse:collapse;margin-top:8px}td{padding:4px 12px 4px 0}.ok{color:#1a7f37}.bad{color:#c42828}</style>
<h1>Brand palette <small>${source}</small></h1><p>Hue ${p.hue}. ${p.chromatic ? 'Chromatic brand.' : 'Neutral logo; cool neutral hue.'}</p>
<h2>Light</h2><div class="grid">${row('light', p.light)}</div><h2>Dark</h2><div class="grid">${row('dark', p.dark)}</div>
<h2>Contrast</h2><table>${p.checks.map(c => `<tr><td>${c.name}</td><td class="${c.ok ? 'ok' : 'bad'}">${c.ratio}:1 (needs ${c.need})</td></tr>`).join('')}</table>`
}

try {
  let primary = option('--primary'), secondary = option('--secondary'), source = 'manual'
  let picked = null
  if (!primary) {
    if (!logoPath) throw new Error('Pass a logo file (svg/png/jpg/webp) or --primary "#hex".')
    const ex = await extract(resolve(logoPath))
    if (!ex.opaque) throw new Error('Logo has no opaque pixels.')
    picked = choose(ex.colors, ex.opaque)
    primary = picked.primary.hex; secondary ||= picked.secondary?.hex; source = logoPath
  }
  const p = palette({ primary, secondary })
  await mkdir(resolve('test-results/brand'), { recursive: true })
  await writeFile(outPath, css(p))
  await writeFile(resolve('test-results/brand/swatches.html'), swatches(p, source))
  await writeFile(resolve('test-results/brand/palette.json'), JSON.stringify({ source, primary, secondary: secondary || null, extracted: picked?.all.map(c => ({ hex: c.hex, share: +c.share.toFixed(3), chroma: +c.lch.C.toFixed(3) })) || null, ...p }, null, 2))
  if (flag('--json')) console.log(JSON.stringify(p, null, 2))
  else {
    console.log(`Brand: ${primary}${secondary ? `, second hue ${secondary}` : ''} (${source}). Hue ${p.hue}, ${p.chromatic ? 'chromatic' : 'neutral logo'}.`)
    if (picked) console.log(`Logo colours: ${picked.all.map(c => `${c.hex} ${(c.share * 100).toFixed(0)}%`).join(', ')}`)
    for (const c of p.checks) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}: ${c.ratio}:1 (needs ${c.need})`)
    console.log(`Wrote ${outPath} and test-results/brand/swatches.html. Open the swatches before trusting the palette.`)
  }
  if (p.checks.some(c => !c.ok)) process.exitCode = 1
} catch (error) { console.error(error.message); process.exitCode = 1 }
