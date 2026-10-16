// Rip a prospect's existing web presence into a research folder the brief can be built from.
//
//   npm run capture -- https://their-site.com                       crawl their site (same origin, up to --pages)
//   npm run capture -- https://their-site.com https://yelp.com/...  plus single public pages
//   npm run capture -- <url> --out research --pages 12 --images 40
//   npm run capture -- <url> --no-audit                             skip auditing their current site
//
// Writes, under --out (default research/):
//   facts.json          name, phones, emails, address, hours, socials, services; each with its source URL
//   pages/<slug>.txt    visible text per page           pages/<slug>.json   title, meta, headings, JSON-LD, og
//   images/             the larger images with a manifest (images.json: url, alt, size, page, file)
//   logo/               logo candidates (header images, "logo" in src or alt)
//   design.json         their current design system from computed styles: fonts, sizes, colours by role, radii, shadows
//   screens/            desktop and mobile full-page screenshots of each page
//   current-site-audit.json + current-site-*.png   our audit run on their site, defects outlined (pitch material)
//   sources.json        every URL fetched, when, and whether it returned content
//
// Public pages only; nothing here logs in. Instagram and Facebook often return a login wall
// to headless browsers, and the sources file says so when they do. No third-party services.

import { mkdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { chromium } from '@playwright/test'
import { runChecks, annotate, clearAnnotations } from './audit/checks.js'

const args = process.argv.slice(2)
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1] }
const flag = name => args.includes(name)
const urls = args.filter(a => /^https?:\/\//.test(a))
const out = resolve(option('--out') || 'research')
const maxPages = Number(option('--pages') || 12), maxImages = Number(option('--images') || 40)
if (!urls.length) { console.error('Pass at least one http(s) URL.'); process.exit(1) }

const slug = u => { const p = new URL(u); return (p.hostname.replace(/^www\./, '') + p.pathname).replace(/\/$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80) || 'index' }
const SOCIAL = /facebook\.com|instagram\.com|tiktok\.com|yelp\.com|google\.com\/maps|maps\.app\.goo\.gl|linkedin\.com|x\.com|twitter\.com|youtube\.com|nextdoor\.com|thumbtack\.com|houzz\.com|angi\.com/i

// Runs in the page: everything the brief needs from one document, plus image candidates.
function harvest() {
  const text = sel => [...document.querySelectorAll(sel)].map(n => n.innerText.trim()).filter(Boolean)
  const meta = name => document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.content || null
  const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent) } catch { return null } }).filter(Boolean)
  const body = document.body.innerText || ''
  const phones = [...new Set((body.match(/(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g) || []).map(p => p.trim()))]
  const emails = [...new Set(body.match(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g) || [])]
  const tel = [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.getAttribute('href').slice(4))
  const mailto = [...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.getAttribute('href').slice(7).split('?')[0])
  const links = [...document.querySelectorAll('a[href]')].map(a => { try { return new URL(a.getAttribute('href'), location.href).href } catch { return null } }).filter(Boolean)
  const images = [...document.images].filter(i => i.naturalWidth > 0).map(i => ({ src: i.currentSrc || i.src, alt: i.alt || '', width: i.naturalWidth, height: i.naturalHeight, rendered: [Math.round(i.getBoundingClientRect().width), Math.round(i.getBoundingClientRect().height)], inHeader: !!i.closest('header, nav, [role="banner"]'), looksLikeLogo: /logo/i.test(i.src + ' ' + i.alt + ' ' + (i.className || '')) }))
  const bg = [...document.querySelectorAll('*')].map(el => getComputedStyle(el).backgroundImage).filter(v => v && v !== 'none').flatMap(v => [...v.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1])).filter(u => !u.startsWith('data:'))
  return {
    title: document.title, description: meta('description'), canonical: document.querySelector('link[rel="canonical"]')?.href || null,
    og: { title: meta('og:title'), description: meta('og:description'), image: meta('og:image'), siteName: meta('og:site_name'), type: meta('og:type') },
    h1: text('h1'), h2: text('h2'), h3: text('h3'), navLabels: text('nav a, header a').slice(0, 40), buttons: text('button, a.btn, a[class*="button"]').slice(0, 30),
    phones: [...new Set([...tel, ...phones])], emails: [...new Set([...mailto, ...emails])], jsonld, links, images, backgroundImages: [...new Set(bg)], text: body,
  }
}
// Runs in the page: the design system as actually rendered, weighted by on-screen use.
function design() {
  const cs = el => getComputedStyle(el)
  const vis = el => { const r = el.getBoundingClientRect(); const s = cs(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
  const tally = (map, key, w = 1) => { if (!key || key === 'none' || key === 'rgba(0, 0, 0, 0)' || key === 'transparent') return; map[key] = (map[key] || 0) + w }
  const top = (map, n = 12) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, weight]) => ({ value, weight: Math.round(weight) }))
  const fonts = {}, textColors = {}, bgColors = {}, radii = {}, shadows = {}, weights = {}, sizes = {}, borders = {}
  const scale = {}
  for (const el of document.body.querySelectorAll('*')) {
    if (!vis(el) || /^(SCRIPT|STYLE|SVG|PATH)$/.test(el.tagName)) continue
    const s = cs(el), r = el.getBoundingClientRect(), area = Math.max(1, r.width * r.height) / 10000
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
    tally(bgColors, s.backgroundColor, area); tally(radii, s.borderTopLeftRadius, 1); tally(shadows, s.boxShadow, 1)
    if (parseFloat(s.borderTopWidth) > 0) tally(borders, `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`, 1)
    if (hasText) {
      const chars = el.textContent.trim().length
      tally(fonts, s.fontFamily.split(',')[0].replace(/["']/g, '').trim(), chars); tally(textColors, s.color, chars); tally(weights, s.fontWeight, chars); tally(sizes, s.fontSize, chars)
      const tag = el.tagName.toLowerCase()
      if (/^(h[1-6]|p|a|button|li|blockquote|small|label)$/.test(tag)) { const k = `${tag}`; scale[k] ||= {}; const sig = `${s.fontFamily.split(',')[0].replace(/["']/g, '')} ${s.fontSize}/${s.lineHeight} ${s.fontWeight} ${s.letterSpacing}`; scale[k][sig] = (scale[k][sig] || 0) + 1 }
    }
  }
  const sections = [...document.querySelectorAll('header, main > *, body > section, footer')].filter(vis).slice(0, 30).map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), id: el.id || null, cls: (el.className && String(el.className).split(' ').slice(0, 3).join(' ')) || null, top: Math.round(r.top + scrollY), height: Math.round(r.height), heading: el.querySelector('h1,h2,h3')?.innerText.trim().slice(0, 80) || null } })
  return { fonts: top(fonts, 6), textColors: top(textColors), backgroundColors: top(bgColors), fontSizes: top(sizes), fontWeights: top(weights, 6), radii: top(radii, 8), shadows: top(shadows, 6), borders: top(borders, 6), typeScale: Object.fromEntries(Object.entries(scale).map(([k, v]) => [k, Object.entries(v).sort((a, b) => b[1] - a[1])[0][0]])), sections }
}

let browser
const sources = [], facts = { name: [], phones: [], emails: [], addresses: [], hours: [], socials: [], services: [], description: [] }
const push = (key, value, source) => { if (value && !facts[key].some(f => f.value === value)) facts[key].push({ value, source }) }
try {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath()
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
  for (const d of ['pages', 'images', 'logo', 'screens']) await mkdir(join(out, d), { recursive: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' })
  const page = await context.newPage()
  const primary = new URL(urls[0])
  const queue = [urls[0]], seen = new Set([urls[0]]), imageCandidates = new Map(), logoCandidates = new Map()
  const singles = urls.slice(1)
  let designDone = false, home = null

  const visit = async (url, crawl) => {
    const entry = { url, fetchedAt: new Date().toISOString(), ok: false, note: null }
    sources.push(entry)
    let response
    try { response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }) } catch (e) { entry.note = e.message.split('\n')[0]; return }
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)) } scrollTo(0, 0) })
    const status = response?.status() || 0
    const h = await page.evaluate(harvest)
    const wall = /log in|sign up to see|login • instagram|you must log in/i.test(h.title + ' ' + h.text.slice(0, 600))
    entry.ok = status < 400 && !wall; entry.status = status; entry.note = wall ? 'login wall; nothing public here' : null
    if (!entry.ok) return
    const s = slug(url)
    await writeFile(join(out, 'pages', `${s}.txt`), `# ${h.title}\n# ${url}\n\n${h.text}\n`)
    const { text, images, links, ...metaOnly } = h
    await writeFile(join(out, 'pages', `${s}.json`), JSON.stringify({ url, ...metaOnly, imageCount: images.length }, null, 2))
    await page.screenshot({ path: join(out, 'screens', `${s}-desktop.png`), fullPage: true }).catch(() => {})
    // Facts
    push('name', h.og.siteName || (h.jsonld.find(j => j?.name)?.name) || null, url)
    push('description', h.description || h.og.description, url)
    for (const p of h.phones) push('phones', p, url)
    for (const e of h.emails) push('emails', e, url)
    for (const l of links) if (SOCIAL.test(l) && !/share|intent|sharer/.test(l)) push('socials', l.split('?')[0], url)
    const walk = node => { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(walk); if (node.address) { const a = node.address; push('addresses', typeof a === 'string' ? a : [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].filter(Boolean).join(', '), url) } if (node.openingHours || node.openingHoursSpecification) push('hours', JSON.stringify(node.openingHours || node.openingHoursSpecification), url); if (node.telephone) push('phones', node.telephone, url); if (node.email) push('emails', node.email, url); if (node.makesOffer || node.hasOfferCatalog) push('services', JSON.stringify(node.makesOffer || node.hasOfferCatalog).slice(0, 400), url); for (const v of Object.values(node)) if (v && typeof v === 'object') walk(v) }
    walk(h.jsonld)
    if (url === urls[0]) { home = h; for (const t of h.h2.slice(0, 12)) push('services', t, url) }
    // Images
    for (const im of images) {
      const abs = im.src; if (!abs || abs.startsWith('data:')) continue
      const big = Math.max(im.width, im.height) >= 300
      if (im.looksLikeLogo || (im.inHeader && Math.max(im.width, im.height) < 600)) logoCandidates.set(abs, { ...im, page: url })
      else if (big && !imageCandidates.has(abs)) imageCandidates.set(abs, { ...im, page: url })
    }
    for (const bgu of h.backgroundImages) { try { const abs = new URL(bgu, url).href; if (!imageCandidates.has(abs)) imageCandidates.set(abs, { src: abs, alt: '', width: 0, height: 0, rendered: [0, 0], page: url, background: true }) } catch {} }
    // Design + audit of their current site, once, on the first page
    if (!designDone && url === urls[0]) {
      designDone = true
      await writeFile(join(out, 'design.json'), JSON.stringify({ url, capturedAt: new Date().toISOString(), ...(await page.evaluate(design)) }, null, 2))
      if (!flag('--no-audit')) {
        const auditOut = {}
        for (const [name, width, height, mobile] of [['desktop', 1440, 900, false], ['mobile', 390, 844, true]]) {
          const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce' })
          const p2 = await ctx.newPage()
          try {
            await p2.goto(url, { waitUntil: 'load', timeout: 30000 }); await p2.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
            const r = await p2.evaluate(runChecks, { viewport: name, mobile, tells: true })
            await p2.evaluate(annotate, [...new Set(r.findings.filter(f => f.mark).map(f => f.mark))])
            await p2.screenshot({ path: join(out, `current-site-${name}.png`), fullPage: true })
            await p2.evaluate(clearAnnotations)
            auditOut[name] = { fail: r.findings.filter(f => f.level === 'fail').length, warn: r.findings.filter(f => f.level === 'warn').length, findings: r.findings, stats: r.stats }
          } catch (e) { auditOut[name] = { error: e.message.split('\n')[0] } }
          await ctx.close()
        }
        await writeFile(join(out, 'current-site-audit.json'), JSON.stringify({ url, ...auditOut }, null, 2))
      }
    }
    // Mobile screenshot of each page
    const m = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    const mp = await m.newPage(); await mp.goto(url, { waitUntil: 'load', timeout: 30000 }).then(() => mp.screenshot({ path: join(out, 'screens', `${s}-mobile.png`), fullPage: true })).catch(() => {}); await m.close()
    // Crawl
    if (crawl) for (const l of links) { try { const u = new URL(l); u.hash = ''; const href = u.href; if (u.origin === primary.origin && !seen.has(href) && !/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|mp4|css|js)$/i.test(u.pathname) && !/mailto:|tel:/.test(href) && queue.length + seen.size < maxPages * 3) { seen.add(href); queue.push(href) } } catch {} }
  }

  while (queue.length && sources.filter(s => s.ok).length < maxPages) await visit(queue.shift(), true)
  for (const u of singles) await visit(u, false)

  // Downloads
  const manifest = []
  const download = async (candidates, dir, limit) => {
    const list = [...candidates.values()].sort((a, b) => (b.width * b.height) - (a.width * a.height)).slice(0, limit)
    for (const im of list) {
      try {
        const res = await page.request.get(im.src, { timeout: 20000 }); if (!res.ok()) continue
        const type = res.headers()['content-type'] || ''; const ext = type.includes('svg') ? 'svg' : type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : type.includes('avif') ? 'avif' : 'jpg'
        const body = await res.body(); if (body.length < 2000 && ext !== 'svg') continue
        const file = `${slug(im.src).slice(0, 60)}-${manifest.length + 1}.${ext}`
        await writeFile(join(out, dir, file), body)
        manifest.push({ file: `${dir}/${file}`, url: im.src, alt: im.alt, width: im.width, height: im.height, page: im.page, bytes: body.length, background: !!im.background })
      } catch {}
    }
  }
  await download(logoCandidates, 'logo', 8)
  await download(imageCandidates, 'images', maxImages)
  await writeFile(join(out, 'images.json'), JSON.stringify(manifest, null, 2))
  await writeFile(join(out, 'sources.json'), JSON.stringify(sources, null, 2))
  await writeFile(join(out, 'facts.json'), JSON.stringify({ capturedAt: new Date().toISOString(), primaryUrl: urls[0], ...facts, note: 'Each value carries the page it came from. Verify before publishing; owner confirmation beats any of these.' }, null, 2))
  const okPages = sources.filter(s => s.ok)
  console.log(`Captured ${okPages.length} page(s) from ${urls.length} URL(s) into ${out}/`)
  for (const s of sources.filter(s => !s.ok)) console.log(`  skipped ${s.url}: ${s.note || `HTTP ${s.status}`}`)
  console.log(`  facts: ${facts.phones.length} phone, ${facts.emails.length} email, ${facts.addresses.length} address, ${facts.socials.length} social, ${facts.services.length} service lines`)
  console.log(`  images: ${manifest.filter(m => m.file.startsWith('images')).length} downloaded, ${manifest.filter(m => m.file.startsWith('logo')).length} logo candidates`)
  if (home) console.log(`  design: ${(JSON.parse(await (await import('node:fs/promises')).readFile(join(out, 'design.json'), 'utf8'))).fonts.slice(0, 3).map(f => f.value).join(', ')} in use; see design.json`)
  if (!flag('--no-audit')) console.log('  audit: current-site-audit.json and current-site-{desktop,mobile}.png (defects outlined)')
} catch (error) { console.error(error.stack || error.message); process.exitCode = 1 }
finally { await browser?.close() }
