// Audit the page the way a careful reviewer would, then write it down.
//
//   npm run audit                          dev server, all three viewports, every check
//   npm run audit -- --path "/?ui=1"       a specific route
//   npm run audit -- --url https://...     a deployed page (no Vite)
//   npm run audit -- --no-states           skip opening menus, selects and dialogs
//   npm run audit -- --no-tells --no-copy  structure and accessibility only
//   npm run audit -- --baseline            save this run's screenshots as the comparison set
//   npm run audit -- --scope "#reviews"    restrict to one section (hero/page checks skip)
//
// Output: test-results/audit/report.json, report.md and screenshots per viewport
// ({viewport}.png, {viewport}-full.png, {viewport}-open-N.png) with failing elements
// outlined and numbered. Exit code 1 on any FAIL. Checks live in scripts/audit/checks.js
// (browser) and scripts/audit/copy.mjs (copy). Add rules there, with a fixture, not in prose.

import { access, mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { chromium } from '@playwright/test'
import { runChecks, annotate, clearAnnotations } from './audit/checks.js'
import { lintCopy } from './audit/copy.mjs'

const args = process.argv.slice(2)
const flag = name => args.includes(name)
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1] }
const VIEWPORTS = { desktop: [1440, 900], mobile: [390, 844], short: [375, 667] }
const wanted = (option('--viewports') || 'desktop,mobile,short').split(',').map(s => s.trim()).filter(s => VIEWPORTS[s])
const outDir = resolve(option('--output') || 'test-results/audit')
const limit = Number(option('--max') || 80)
const TRIGGERS = '[aria-haspopup]:not([aria-haspopup="false"]), [role="combobox"], [data-slot$="-trigger"]:not([data-slot="accordion-trigger"]), summary, button[aria-expanded="false"], nav button, header button'
const OPENED = '[role="menu"], [role="listbox"], [role="dialog"], details[open] > :not(summary), [data-state="open"][data-slot$="-content"], [data-slot="sheet-content"][data-state="open"], [data-slot="navigation-menu-viewport"]'

let server, browser
const t0 = Date.now()
try {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || chromium.executablePath()
  try { await access(executablePath) } catch { throw new Error('No installed Chromium. Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to a Chrome or Chromium binary. This command does not download browsers.') }
  let origin = option('--url')
  if (!origin) {
    const { createServer } = await import('vite')
    server = await createServer({ server: { host: '127.0.0.1', port: 4179, strictPort: true }, logLevel: 'error' })
    await server.listen(); origin = 'http://127.0.0.1:4179'
  }
  const target = option('--path') ? new URL(option('--path'), origin).href : option('--url') ? origin : new URL('/', origin).href
  await mkdir(outDir, { recursive: true })
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] })
  const report = { target, startedAt: new Date().toISOString(), viewports: {}, summary: { fail: 0, warn: 0, note: 0 } }

  for (const name of wanted) {
    const [width, height] = VIEWPORTS[name]
    const mobile = width < 600
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'reduce', deviceScaleFactor: 1 })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`))
    // Resource failures arrive through the response listener with a URL; the console copy has none.
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text().slice(0, 200)}`) })
    page.on('response', r => { if (r.status() >= 400 && !/\/favicon\.ico$/.test(r.url())) errors.push(`${r.status()} ${r.url()}`) })
    const load = async () => {
      await page.goto(target, { waitUntil: 'load', timeout: 30000 })
      // Lazy React chunks: wait for the network to settle and for a heading to exist before measuring.
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.locator('h1, h2').first().waitFor({ state: 'attached', timeout: 8000 }).catch(() => {})
      await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(d => setTimeout(d, 3000))])
      await page.waitForTimeout(150)
    }
    await load()
    const opts = { viewport: name, mobile, tells: !flag('--no-tells'), scope: option('--scope') || null }

    // 1. Static pass over the page as loaded.
    const base = await page.evaluate(runChecks, opts)
    let findings = base.findings
    for (const e of errors.splice(0)) findings.push({ level: 'fail', id: 'runtime-error', message: e, viewport: name })
    if (!flag('--no-copy')) findings.push(...lintCopy(base.text, { viewport: name }))

    // 2. Keyboard focus: Tab through the first controls and demand a visible change.
    if (!opts.scope) {
      // A probe at the top of the body pins the Tab walk to the start of the document.
      await page.evaluate(() => { scrollTo(0, 0); const probe = document.createElement('button'); probe.id = '__audit_probe'; probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none'; document.body.prepend(probe); probe.focus() })
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab')
        const f = await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body || el.id === '__audit_probe') return null
          const pick = s => [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor, s.textDecorationLine].join('|')
          const focused = pick(getComputedStyle(el))
          el.blur(); const blurred = pick(getComputedStyle(el)); el.focus()
          const r = el.getBoundingClientRect()
          const sel = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.getAttribute('data-slot') ? `[data-slot=${el.getAttribute('data-slot')}]` : '')
          return { same: focused === blurred, sel, text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40), offscreen: r.bottom < 0 || r.top > innerHeight }
        })
        if (!f) break
        if (flag('--verbose')) console.error(`  focus ${i + 1}: ${f.sel} "${f.text}" ${f.same ? 'NO CHANGE' : 'ok'}`)
        if (f.same) findings.push({ level: 'fail', id: 'focus-invisible', message: `Focused ${f.sel} "${f.text}" looks identical to unfocused; keyboard users cannot see where they are`, selector: f.sel, text: f.text, viewport: name })
      }
      await page.evaluate(() => { document.getElementById('__audit_probe')?.remove(); document.activeElement && document.activeElement.blur() })
    }

    // 3. Screenshots of the loaded page, annotated when there is something to show.
    const marks = [...new Set(findings.filter(f => f.mark).map(f => f.mark))]
    await page.evaluate(annotate, marks)
    await page.screenshot({ path: join(outDir, `${name}.png`) })
    await page.screenshot({ path: join(outDir, `${name}-full.png`), fullPage: true })
    await page.evaluate(clearAnnotations)

    // 4. Opened states: menus, selects, dialogs, drawers. Each trigger gets a fresh page.
    const states = []
    if (!flag('--no-states') && !opts.scope) {
      const triggerCount = await page.locator(TRIGGERS).count()
      for (let i = 0; i < Math.min(triggerCount, 12); i++) {
        await load()
        const trigger = page.locator(TRIGGERS).nth(i)
        if (!(await trigger.isVisible().catch(() => false))) continue
        const label = ((await trigger.innerText().catch(() => '')) || (await trigger.getAttribute('aria-label')) || `trigger ${i + 1}`).trim().slice(0, 40)
        await trigger.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {})
        let clicked = true
        try { await trigger.click({ timeout: 2000 }) } catch { try { await trigger.click({ timeout: 1500, force: true }) } catch { clicked = false } }
        if (!clicked) { states.push({ trigger: label, opened: false, note: 'could not click' }); continue }
        await page.waitForTimeout(350)
        const opened = await page.locator(OPENED).filter({ visible: true }).count()
        if (!opened) { states.push({ trigger: label, opened: false }); continue }
        const scoped = await page.evaluate(runChecks, { ...opts, scope: null, within: OPENED, tells: false })
        const inside = scoped.findings.filter(f => /control-|touch-|contrast|text-tiny|overlap|clipped/.test(f.id))
        for (const f of inside) findings.push({ ...f, state: label, id: f.id, message: `[open: ${label}] ${f.message}` })
        const m = [...new Set(inside.map(f => f.mark).filter(Boolean))]
        await page.evaluate(annotate, m)
        const shot = `${name}-open-${i + 1}.png`
        await page.screenshot({ path: join(outDir, shot) })
        await page.evaluate(clearAnnotations)
        states.push({ trigger: label, opened: true, findings: inside.length, screenshot: shot })
        await page.keyboard.press('Escape').catch(() => {})
      }
    }

    // 5. Optional baseline comparison, done in the browser with canvas (no image dependency).
    let diff = null
    const baselinePath = join(outDir, 'baseline', `${name}-full.png`)
    if (flag('--baseline')) { await mkdir(join(outDir, 'baseline'), { recursive: true }); await writeFile(baselinePath, await readFile(join(outDir, `${name}-full.png`))) }
    else if (await access(baselinePath).then(() => true, () => false)) {
      const [a, b] = await Promise.all([readFile(baselinePath), readFile(join(outDir, `${name}-full.png`))])
      diff = await page.evaluate(async ([A, B]) => {
        const load = src => new Promise(res => { const im = new Image(); im.onload = () => res(im); im.src = src })
        const [ia, ib] = await Promise.all([load(A), load(B)])
        const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height), block = 32
        const draw = im => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(im, 0, 0); return x.getImageData(0, 0, w, h).data }
        const da = draw(ia), db = draw(ib)
        const changed = []
        for (let y = 0; y < h; y += block) for (let x = 0; x < w; x += block) {
          let d = 0, n = 0
          for (let yy = y; yy < Math.min(y + block, h); yy += 2) for (let xx = x; xx < Math.min(x + block, w); xx += 2) { const i = (yy * w + xx) * 4; d += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]); n++ }
          if (d / n > 30) changed.push([x, y])
        }
        const total = Math.ceil(w / block) * Math.ceil(h / block)
        return { changedBlocks: changed.length, totalBlocks: total, percent: +(100 * changed.length / total).toFixed(1), heightDelta: ib.height - ia.height, regions: changed.slice(0, 20) }
      }, [`data:image/png;base64,${a.toString('base64')}`, `data:image/png;base64,${b.toString('base64')}`])
      if (diff.percent > 0) findings.push({ level: 'warn', id: 'baseline-drift', message: `${diff.percent}% of the page changed against the saved baseline (${diff.changedBlocks} blocks, height ${diff.heightDelta >= 0 ? '+' : ''}${diff.heightDelta}px); confirm approved sections were not touched`, viewport: name, measured: diff })
    }

    findings = dedupe(findings).slice(0, limit)
    for (const f of findings) report.summary[f.level] = (report.summary[f.level] || 0) + 1
    report.viewports[name] = { width, height, findings, states, stats: base.stats, screenshots: { viewport: `${name}.png`, full: `${name}-full.png` }, diff }
    await context.close()
  }

  report.finishedAt = new Date().toISOString()
  report.ms = Date.now() - t0
  await writeFile(join(outDir, 'report.json'), JSON.stringify(report, null, 2))
  await writeFile(join(outDir, 'report.md'), markdown(report))
  process.stdout.write(flag('--json') ? JSON.stringify(report, null, 2) : console_(report))
  if (report.summary.fail) process.exitCode = 1
} catch (error) {
  console.error(error.stack || error.message); process.exitCode = 1
} finally { await browser?.close(); await server?.close() }

function dedupe(findings) {
  const seen = new Set()
  return findings.filter(f => { const k = `${f.level}|${f.id}|${f.selector || ''}|${f.state || ''}|${f.message.slice(0, 60)}`; if (seen.has(k)) return false; seen.add(k); return true })
    .sort((a, b) => ({ fail: 0, warn: 1, note: 2 }[a.level] - { fail: 0, warn: 1, note: 2 }[b.level]) || a.id.localeCompare(b.id))
}
function line(f) { return `${f.mark ? `#${f.mark} ` : ''}${f.id}  ${f.message}${f.selector ? `\n      at ${f.selector}` : ''}${f.text && !f.message.includes(f.text) ? `  "${f.text}"` : ''}` }
function console_(r) {
  let out = `\nAudit of ${r.target}  (${(r.ms / 1000).toFixed(1)}s)\n`
  for (const [name, v] of Object.entries(r.viewports)) {
    const fails = v.findings.filter(f => f.level === 'fail'), warns = v.findings.filter(f => f.level === 'warn')
    out += `\n${name} ${v.width}x${v.height}: ${fails.length} fail, ${warns.length} warn, ${v.findings.filter(f => f.level === 'note').length} note; ${v.stats.contrastUnverified} text blocks over imagery not contrast-checked\n`
    for (const f of fails) out += `  FAIL ${line(f)}\n`
    for (const f of warns) out += `  warn ${line(f)}\n`
    if (v.states.length) out += `  opened ${v.states.filter(s => s.opened).length}/${v.states.length} triggers: ${v.states.map(s => `${s.trigger}${s.opened ? ` (${s.findings} findings, ${s.screenshot})` : ' (nothing opened)'}`).join('; ')}\n`
    if (v.diff) out += `  baseline: ${v.diff.percent}% changed, height ${v.diff.heightDelta >= 0 ? '+' : ''}${v.diff.heightDelta}px\n`
  }
  out += `\nTotal: ${r.summary.fail} fail, ${r.summary.warn} warn. Screenshots and report.md in ${outDir}\n`
  out += r.summary.fail ? 'Fix every FAIL, then run again. A FAIL that is wrong is a bug in scripts/audit/checks.js; fix the check, do not ignore it.\n' : 'No failures. Now look at the full-page screenshots against docs/review-rubric.md before calling it done.\n'
  return out
}
function markdown(r) {
  let md = `# Audit: ${r.target}\n\n${r.startedAt} · ${r.summary.fail} fail · ${r.summary.warn} warn · ${r.summary.note} note\n`
  for (const [name, v] of Object.entries(r.viewports)) {
    md += `\n## ${name} (${v.width}x${v.height})\n\nScreenshots: ${v.screenshots.viewport}, ${v.screenshots.full}${v.states.filter(s => s.screenshot).map(s => `, ${s.screenshot}`).join('')}\n\n`
    if (!v.findings.length) { md += 'No findings.\n'; continue }
    md += '| # | Level | Check | Finding | Where |\n|---|---|---|---|---|\n'
    for (const f of v.findings) md += `| ${f.mark || ''} | ${f.level} | ${f.id} | ${f.message.replace(/\|/g, '\\|')} | ${(f.selector || '').replace(/\|/g, '\\|')} |\n`
  }
  return md
}
