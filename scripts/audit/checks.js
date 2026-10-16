// Browser-side audit. Playwright serializes this function and runs it inside the page,
// so it must stay self-contained: no imports, no references to module scope.
// It returns findings plus the visible text blocks the Node-side copy linter reads.
//
// Levels: "fail" blocks delivery, "warn" needs a human decision. Every finding carries a
// selector, the measured values and the threshold, so a fix is a lookup, not a hunt.
//
// To add a rule: write it here as a measurement with a threshold, give it an id, and add a
// case to test/fixtures/defects.html so the test proves it fires. Do not add it to AGENTS.md.

export function runChecks(opts) {
  const o = Object.assign({ viewport: 'desktop', mobile: false, tells: true, scope: null, within: null, maxPerRule: 12 }, opts || {})
  const findings = []
  const counts = {}
  const root = o.scope ? document.querySelector(o.scope) : document.body
  if (!root) return { findings: [{ level: 'fail', id: 'scope-missing', message: `Scope ${o.scope} not found` }], text: [], stats: {} }
  // `within` restricts every check to the listed containers (used for opened menus and dialogs).
  const containers = o.within ? [...document.querySelectorAll(o.within)] : null
  const vw = innerWidth, vh = innerHeight
  const px = v => parseFloat(v) || 0
  const cs = el => getComputedStyle(el)
  let auditSeq = (window.__auditSeq || 0)

  // ---------- helpers ----------
  function visible(el) {
    if (!(el instanceof Element)) return false
    // checkVisibility also covers closed <details> and content-visibility:hidden subtrees, which still report rects.
    if (el.checkVisibility && !el.checkVisibility({ visibilityProperty: true, opacityProperty: true, contentVisibilityAuto: true })) return false
    const s = cs(el)
    if (s.display === 'none' || s.visibility === 'hidden' || px(s.opacity) === 0) return false
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return false
    // Screen-reader-only text: clipped to a pixel. Not a layout element.
    if (r.width <= 1 && r.height <= 1) return false
    if (s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(50%)') return false
    return true
  }
  function selector(el) {
    const parts = []
    let node = el, depth = 0
    while (node && node !== document.body && depth < 4) {
      let part = node.tagName.toLowerCase()
      if (node.id) { parts.unshift(`#${node.id}`); break }
      const slot = node.getAttribute('data-slot')
      if (slot) part += `[data-slot=${slot}]`
      else if (node.classList.length) part += '.' + [...node.classList].filter(c => !c.includes(':') && !c.includes('/') && !c.includes('[')).slice(0, 2).join('.')
      const parent = node.parentElement
      if (parent && !slot && !node.classList.length) {
        const same = [...parent.children].filter(c => c.tagName === node.tagName)
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`
      }
      parts.unshift(part)
      node = parent; depth++
    }
    return parts.join(' > ')
  }
  function snippet(el) {
    const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ')
    return t.length > 40 ? t.slice(0, 37) + '...' : t
  }
  function mark(el) {
    if (!el.hasAttribute('data-audit')) el.setAttribute('data-audit', String(++auditSeq))
    return Number(el.getAttribute('data-audit'))
  }
  function add(level, id, el, message, measured) {
    counts[id] = (counts[id] || 0) + 1
    if (counts[id] > o.maxPerRule) return
    const f = { level, id, message, viewport: o.viewport }
    if (el) { f.selector = selector(el); f.text = snippet(el); f.mark = mark(el) }
    if (measured) f.measured = measured
    findings.push(f)
  }
  const inScope = el => containers ? containers.some(c => c !== el && c.contains(el)) : root.contains(el)
  const all = [...root.querySelectorAll('*')].filter(el => visible(el) && inScope(el))
  function parseColor(str) {
    const m = str.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const [r, g, b, a = '1'] = m[1].split(/[\s,\/]+/).filter(Boolean)
    return { r: +r, g: +g, b: +b, a: +a }
  }
  function luminance({ r, g, b }) {
    const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  function contrast(a, b) {
    const l1 = luminance(a), l2 = luminance(b)
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
  }
  function blend(fg, bg) {
    const a = fg.a
    return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 }
  }
  // Effective background: walk up until an opaque layer; null if imagery or transparency makes it unknowable.
  function background(el) {
    let node = el, layers = []
    while (node && node !== document.documentElement.parentNode) {
      const s = cs(node)
      if (s.backgroundImage && s.backgroundImage !== 'none') return null
      if (px(s.opacity) < 1 && node !== el) return null
      const c = parseColor(s.backgroundColor)
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break }
      node = node.parentElement
    }
    if (!layers.length || layers[layers.length - 1].a < 1) layers.push({ r: 255, g: 255, b: 255, a: 1 })
    let out = layers.pop()
    while (layers.length) out = blend(layers.pop(), out)
    return out
  }
  function hasOwnText(el) {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim().length > 1) return true
    return false
  }
  // elementFromPoint only sees the viewport, so off-screen elements are scrolled into view for hit tests.
  // window.scrollTo, not scrollIntoView: the latter moves Chrome's sequential-focus starting point.
  const scrollY0 = scrollY
  function inView(el) {
    const r = el.getBoundingClientRect()
    if (r.top >= 0 && r.bottom <= vh) return
    scrollTo({ top: Math.max(0, scrollY + r.top - vh / 2 + r.height / 2), behavior: 'instant' })
  }
  function overImagery(el) {
    inView(el)
    const r = el.getBoundingClientRect()
    const cx = Math.min(vw - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(vh - 1, Math.max(0, r.top + Math.min(r.height / 2, 20)))
    const stack = document.elementsFromPoint(cx, cy)
    const i = stack.indexOf(el)
    return stack.slice(i + 1).some(n => /^(IMG|VIDEO|CANVAS|PICTURE|SVG)$/i.test(n.tagName) || (cs(n).backgroundImage !== 'none'))
  }
  function isHeading(el) { return /^H[1-6]$/.test(el.tagName) }
  const isInteractive = el => el.matches('button, [role="button"], [role="menuitem"], [role="option"], [role="tab"], [role="combobox"], summary, select, textarea, input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), a[href]')
  const isMenuItem = el => el.matches('[role="menuitem"], [role="option"], [data-slot="select-item"], [data-slot="dropdown-menu-item"], [role="menu"] a, [role="listbox"] > *, nav [data-state="open"] a')
  const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length

  // ---------- structure ----------
  const h1s = [...document.querySelectorAll('h1')].filter(visible)
  if (!o.scope) {
    if (h1s.length !== 1) add('fail', 'h1-count', h1s[1] || h1s[0] || null, `${h1s.length} visible h1 elements; a page has one`, { count: h1s.length })
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(visible).map(h => +h.tagName[1])
    for (let i = 1; i < levels.length; i++) if (levels[i] > levels[i - 1] + 1) { add('warn', 'heading-skip', null, `Heading level jumps from h${levels[i - 1]} to h${levels[i]}`, { from: levels[i - 1], to: levels[i] }); break }
    if (document.documentElement.scrollWidth > vw + 1) {
      const offenders = all.filter(el => { const r = el.getBoundingClientRect(); return r.right > vw + 1 && r.width < document.documentElement.scrollWidth }).sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right).slice(0, 3)
      add('fail', 'overflow-page', offenders[0] || null, `Page scrolls horizontally: ${document.documentElement.scrollWidth}px wide in a ${vw}px viewport`, { scrollWidth: document.documentElement.scrollWidth, viewport: vw, offenders: offenders.map(selector) })
    }
  }

  // ---------- images ----------
  for (const img of all.filter(el => el.tagName === 'IMG')) {
    if (img.complete && img.naturalWidth === 0) add('fail', 'img-broken', img, `Image failed to load: ${img.getAttribute('src')}`)
    if (!img.hasAttribute('alt')) add('fail', 'img-alt-missing', img, 'Image has no alt attribute (use alt="" when decorative)')
    const fit = cs(img).objectFit
    if (img.naturalWidth && img.naturalHeight && (fit === 'fill' || fit === 'normal')) {
      const r = img.getBoundingClientRect()
      // Lighthouse's rule: compare the expected size of the smaller side, 2px tolerance.
      const scale = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight)
      const expectW = img.naturalWidth * scale, expectH = img.naturalHeight * scale
      const off = Math.max(Math.abs(r.width - expectW), Math.abs(r.height - expectH))
      const drift = Math.abs((r.width / r.height) / (img.naturalWidth / img.naturalHeight) - 1)
      if (off > 2 && drift > 0.03) add('fail', 'img-distorted', img, `Image is stretched ${(drift * 100).toFixed(0)}% off its natural aspect ratio; set object-fit or fix the box`, { rendered: `${Math.round(r.width)}x${Math.round(r.height)}`, natural: `${img.naturalWidth}x${img.naturalHeight}` })
    }
  }

  // ---------- links ----------
  for (const a of all.filter(el => el.tagName === 'A')) {
    const href = a.getAttribute('href')
    if (href === null || href.trim() === '' || href.trim() === '#' || /^javascript:/i.test(href)) add('fail', 'link-dead', a, `Link goes nowhere (href=${JSON.stringify(href)})`)
    else if (href.startsWith('#') && href.length > 1 && !document.getElementById(decodeURIComponent(href.slice(1)))) add('fail', 'link-anchor-missing', a, `Anchor target ${href} does not exist`)
  }

  // ---------- text blocks (shared by several checks and the copy linter) ----------
  const textEls = all.filter(el => hasOwnText(el) && !el.closest('script,style,noscript,template'))
  const text = []
  for (const el of textEls) {
    const content = (el.innerText || '').trim().replace(/\s+/g, ' ')
    if (!content) continue
    const tag = el.tagName.toLowerCase()
    const role = isHeading(el) ? 'heading' : isInteractive(el) || el.closest('button,[role="button"]') ? 'cta' : el.matches('label, small, figcaption, legend') ? 'label' : 'body'
    const faq = !!el.closest('[data-slot="accordion-item"], [data-slot="accordion-trigger"], [data-slot="accordion-content"], details, [role="region"][aria-labelledby], .faq, [data-faq]')
    text.push({ tag, role, faq, text: content, selector: selector(el), mark: null, el })
  }

  // ---------- placeholders ----------
  const placeholder = /lorem ipsum|\{\{\s*\w+\s*\}\}|\[placeholder|\bTODO\b|\bTBD\b|\byour (company|business) (name|here)\b|\bacme\b|\bjohn doe\b|\bjane doe\b|\bexample\.com\b|\b555-01\d{2}\b|\blorem\b/i
  for (const t of text) if (placeholder.test(t.text)) add('fail', 'placeholder-text', t.el, `Placeholder text left in the page: "${t.text.match(placeholder)[0]}"`)

  // ---------- controls: cramped text, target size, obscured targets ----------
  // Cramped padding measures the real gap between the glyph boxes and the border box (after
  // impeccable's cramped-padding), so a button sized by flex centring passes and a button whose
  // text touches its edge fails whatever its declared padding says. Only sides that are visible
  // (a fill or a border) count: text sitting on the page background has no edge to be cramped by.
  // Touch: 44px (WCAG 2.5.5). Pointer: 24px is the WCAG 2.5.8 floor, 32px is where it stops feeling fiddly.
  const minTarget = o.mobile ? 44 : 24, comfortable = 32
  function textRect(el) {
    const range = document.createRange(); let box = null
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue
      if (n.parentElement !== el && !visible(n.parentElement)) continue // screen-reader-only labels have no box to be cramped
      range.selectNodeContents(n)
      for (const r of range.getClientRects()) { if (r.width <= 0 || r.height <= 0) continue; box = box ? { left: Math.min(box.left, r.left), top: Math.min(box.top, r.top), right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom) } : { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }
    }
    return box
  }
  function visibleEdges(el, s) {
    const fill = parseColor(s.backgroundColor), hasFill = (fill && fill.a > 0.05) || s.backgroundImage !== 'none'
    const parentFill = el.parentElement && parseColor(cs(el.parentElement).backgroundColor)
    const distinct = hasFill && (!parentFill || !fill || parentFill.a === 0 || Math.abs(parentFill.r - fill.r) + Math.abs(parentFill.g - fill.g) + Math.abs(parentFill.b - fill.b) > 12 || s.backgroundImage !== 'none')
    const b = side => px(s[`border${side}Width`]) > 0 && cs(el)[`border${side}Style`] !== 'none'
    return { top: distinct || b('Top'), bottom: distinct || b('Bottom'), left: distinct || b('Left'), right: distinct || b('Right') }
  }
  for (const el of all.filter(isInteractive)) {
    if (!inScope(el)) continue
    const s = cs(el), r = el.getBoundingClientRect()
    const inlineLink = el.tagName === 'A' && s.display === 'inline' && !el.closest('nav, header, footer, [role="navigation"]')
    const isField = el.matches('input, textarea, select')
    const menuItem = isMenuItem(el)
    if (inlineLink) continue // prose links are sized by the line, not by padding
    const t = isField ? null : textRect(el)
    const iconOnly = !t && !isField && !!el.querySelector('svg, img')
    if (iconOnly) {
      const side = Math.min(r.width, r.height)
      if (side < minTarget) add('fail', 'touch-target', el, `Icon control is ${Math.round(r.width)}x${Math.round(r.height)}px; minimum ${minTarget}px on ${o.viewport}`, { width: Math.round(r.width), height: Math.round(r.height), min: minTarget })
      else if (!o.mobile && side < comfortable) add('warn', 'touch-target', el, `Icon control is ${Math.round(r.width)}x${Math.round(r.height)}px; ${comfortable}px is comfortable with a pointer`, { width: Math.round(r.width), height: Math.round(r.height), min: comfortable })
    } else if (!isField) {
      if (t) {
        const edges = visibleEdges(el, s), em = px(s.fontSize)
        const needY = Math.max(4, 0.3 * em), needX = Math.max(8, 0.5 * em)
        const inset = { top: t.top - (r.top + px(s.borderTopWidth)), bottom: (r.bottom - px(s.borderBottomWidth)) - t.bottom, left: t.left - (r.left + px(s.borderLeftWidth)), right: (r.right - px(s.borderRightWidth)) - t.right }
        const cramped = ['top', 'bottom', 'left', 'right'].filter(side => edges[side] && inset[side] + 0.5 < (side === 'top' || side === 'bottom' ? needY : needX))
        if (cramped.length) add('fail', 'control-cramped', el, `${menuItem ? 'Menu item' : 'Control'} text is ${cramped.map(c => `${Math.max(0, Math.round(inset[c]))}px from the ${c}`).join(', ')}; needs ${Math.round(needX)}px sides and ${Math.round(needY)}px top/bottom`, { inset: Object.fromEntries(Object.entries(inset).map(([k, v]) => [k, Math.round(v)])), needX: Math.round(needX), needY: Math.round(needY), declaredPadding: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}` })
      }
      if (menuItem && r.height < 32) add('fail', 'control-height', el, `Menu item is ${Math.round(r.height)}px tall; minimum 32px`, { height: Math.round(r.height), min: 32 })
    } else if (Math.min(px(s.paddingLeft), px(s.paddingRight)) < 8) add('fail', 'control-cramped', el, `Field has ${Math.min(px(s.paddingLeft), px(s.paddingRight))}px horizontal padding; minimum 8px`, { paddingX: Math.min(px(s.paddingLeft), px(s.paddingRight)), min: 8 })
    const navLink = el.tagName === 'A' && !!el.closest('nav, header, footer, [role="navigation"]')
    if (!iconOnly && !menuItem && !navLink) {
      if (r.height < minTarget) add('fail', 'touch-target', el, `Control is ${Math.round(r.height)}px tall; minimum ${minTarget}px on ${o.viewport}`, { height: Math.round(r.height), min: minTarget })
      else if (!o.mobile && r.height < comfortable) add('warn', 'touch-target', el, `Control is ${Math.round(r.height)}px tall; ${comfortable}px is comfortable with a pointer`, { height: Math.round(r.height), min: comfortable })
    }
    if (navLink && o.mobile && r.height < 24) add('warn', 'touch-target', el, `Navigation link is ${Math.round(r.height)}px tall; WCAG 2.5.8 wants 24px, primary navigation wants 44px`, { height: Math.round(r.height), min: 24 })
    if (o.mobile && isField && px(s.fontSize) < 16) add('warn', 'input-zoom', el, `Field font-size ${px(s.fontSize)}px; iOS zooms in below 16px`, { fontSize: px(s.fontSize) })
    // Click interception: whatever is painted at the control's centre must be the control (after agnt's layout diagnose).
    if (s.position !== 'fixed' && s.position !== 'sticky') {
      inView(el)
      const rr = el.getBoundingClientRect()
      const cx = Math.min(vw - 1, Math.max(0, rr.left + rr.width / 2)), cy = Math.min(vh - 1, Math.max(0, rr.top + rr.height / 2))
      const top = document.elementFromPoint(cx, cy)
      if (top && top !== el && !el.contains(top) && !top.contains(el) && !top.closest('[data-slot="dialog-overlay"], [data-slot="sheet-overlay"], .audit-badge') && !(cs(top).position === 'sticky' || cs(top).position === 'fixed')) add('fail', 'control-obscured', el, `Control is covered at its centre by ${selector(top)}; clicks land on the wrong element`, { coveredBy: selector(top) })
    }
    // A fixed or sticky control inside a transformed/filtered ancestor is trapped in that ancestor's box.
    if ((s.position === 'fixed') && el.parentElement) {
      let a = el.parentElement
      while (a && a !== document.body) { const as = cs(a); if (as.transform !== 'none' || as.filter !== 'none' || as.perspective !== 'none' || /transform|filter|perspective/.test(as.willChange)) { add('warn', 'containing-block-trap', el, `position:fixed control is trapped by ${selector(a)} (transform/filter creates a new containing block)`, { ancestor: selector(a) }); break } a = a.parentElement }
    }
  }
  // Clipped descendants: text or controls cut off by the nearest overflow-hidden ancestor (1px slack).
  const clipSeen = new Set()
  for (const el of all.filter(el => inScope(el) && (isInteractive(el) || (hasOwnText(el) && /^(H[1-6]|P|LI|SPAN|A|BUTTON|LABEL|STRONG)$/.test(el.tagName))))) {
    let a = el.parentElement
    while (a && a !== document.body) {
      const as = cs(a)
      if (/hidden|clip/.test(as.overflowX) || /hidden|clip/.test(as.overflowY)) {
        const ar = a.getBoundingClientRect(), r = el.getBoundingClientRect()
        const cutX = /hidden|clip/.test(as.overflowX) && (r.left < ar.left - 1 || r.right > ar.right + 1), cutY = /hidden|clip/.test(as.overflowY) && (r.top < ar.top - 1 || r.bottom > ar.bottom + 1)
        const scrolls = as.overflowY === 'auto' || as.overflowY === 'scroll' || as.overflowX === 'auto' || as.overflowX === 'scroll'
        if ((cutX || cutY) && !scrolls && !a.matches('[data-slot="carousel-content"], .overflow-x-auto, [data-slot="sheet-content"]') && !clipSeen.has(a)) { clipSeen.add(a); add('fail', 'clipped-content', el, `"${snippet(el)}" is cut off by ${selector(a)} (overflow:${as.overflow}); let the box grow or move the content`, { boundary: selector(a), overflow: as.overflow }) }
        break
      }
      a = a.parentElement
    }
  }

  // ---------- text size and contrast ----------
  let unverified = 0
  for (const t of text) {
    const el = t.el, s = cs(el), size = px(s.fontSize)
    if (size < 12) add('fail', 'text-tiny', el, `Text is ${size}px; minimum 12px`, { fontSize: size })
    else if (size < 14 && /^(p|li|td|dd)$/.test(t.tag) && wordCount(t.text) > 8) add('warn', 'text-small-body', el, `Body text is ${size}px; 16px reads better, 14px is the floor`, { fontSize: size })
    const fg = parseColor(s.color); if (!fg) continue
    const bg = background(el)
    if (!bg || overImagery(el)) { unverified++; continue }
    const effFg = fg.a < 1 ? blend(fg, bg) : fg
    const ratio = contrast(effFg, bg)
    const large = size >= 24 || (size >= 18.66 && px(s.fontWeight) >= 700)
    const need = large ? 3 : 4.5
    if (ratio < need) add('fail', 'contrast', el, `Contrast ${ratio.toFixed(2)}:1 for ${size}px text; needs ${need}:1`, { ratio: +ratio.toFixed(2), needs: need, color: s.color, background: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})` })
  }

  // ---------- overlap: text on text, controls on text ----------
  const leaves = text.map(t => ({ el: t.el, r: t.el.getBoundingClientRect() })).filter(x => x.r.width > 4 && x.r.height > 4).slice(0, 400)
  const controls = all.filter(isInteractive).map(el => ({ el, r: el.getBoundingClientRect() }))
  function intersect(a, b) {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
    return w > 0 && h > 0 ? w * h : 0
  }
  const related = (a, b) => a === b || a.contains(b) || b.contains(a)
  const overlapSeen = new Set()
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const A = leaves[i], B = leaves[j]
    if (related(A.el, B.el)) continue
    const area = intersect(A.r, B.r)
    if (area > 0.2 * Math.min(A.r.width * A.r.height, B.r.width * B.r.height) && !overlapSeen.has(A.el)) { overlapSeen.add(A.el); add('fail', 'overlap-text', A.el, `Text overlaps other text ("${snippet(B.el)}")`, { with: selector(B.el) }) }
  }
  for (const c of controls) for (const L of leaves) {
    if (related(c.el, L.el) || c.el.closest('[role="dialog"], [data-slot="sheet-content"]')) continue
    const area = intersect(c.r, L.r)
    if (area > 0.3 * L.r.width * L.r.height && !overlapSeen.has(c.el)) { overlapSeen.add(c.el); add('fail', 'overlap-control', c.el, `Control covers text ("${snippet(L.el)}"); floating controls belong in their own row`, { over: selector(L.el) }) }
  }

  // ---------- hero ----------
  const hero = root.querySelector('.p-hero, [data-hero], .hero, header + section, main > section:first-of-type')
  if (hero && visible(hero) && !o.scope) {
    const hr = hero.getBoundingClientRect()
    if (hr.height > vh * 1.15) add('warn', 'hero-overflow', hero, `Hero is ${Math.round(hr.height)}px tall in a ${vh}px viewport; fine if the content needs it, a defect if it is empty space`, { height: Math.round(hr.height), viewport: vh })
    const stack = [...hero.querySelectorAll('h1, h2, p, small, span')].filter(el => visible(el) && hasOwnText(el) && !el.closest('nav, form, button, a, [role="status"]'))
    if (o.tells && stack.length > 4) add('warn', 'tell-hero-stack', stack[4], `Hero copy stack has ${stack.length} text elements; four is the ceiling (eyebrow, title, lede, note)`, { count: stack.length })
  }

  // ---------- sticky header vs anchor offset ----------
  if (!o.scope) {
    const sticky = all.find(el => { const s = cs(el); return (s.position === 'fixed' || s.position === 'sticky') && el.getBoundingClientRect().top <= 1 && el.getBoundingClientRect().height < 200 && el.getBoundingClientRect().width > vw * 0.6 })
    const h2 = root.querySelector('h2')
    if (sticky && h2) {
      const need = sticky.getBoundingClientRect().height, have = px(cs(h2).scrollMarginTop) || px(cs(h2).scrollMarginBlockStart)
      if (have < need) add('warn', 'anchor-offset', h2, `Sticky header is ${Math.round(need)}px but headings get ${Math.round(have)}px scroll margin; anchors will land under the bar`, { header: Math.round(need), scrollMargin: Math.round(have) })
    }
  }

  // ---------- design tells (warn): patterns that read as template output ----------
  if (o.tells) {
    const headings = all.filter(el => /^H[1-3]$/.test(el.tagName) && inScope(el))
    for (const h of headings) {
      const s = cs(h)
      if (s.webkitBackgroundClip === 'text' || s.backgroundClip === 'text') add('warn', 'tell-gradient-text', h, 'Gradient text fill; use weight, size or a solid accent instead')
      const txt = (h.innerText || '').trim()
      if ((s.textTransform === 'uppercase' || (txt.length > 8 && txt === txt.toUpperCase() && /[A-Z]/.test(txt))) && !h.closest('button, a')) add('warn', 'tell-uppercase-heading', h, 'Uppercase heading; uppercase belongs on buttons and small chrome only')
      if (px(s.fontWeight) < 500 && h.tagName !== 'H3') add('warn', 'tell-thin-display', h, `Display weight ${s.fontWeight}; headings below 500 read as decorative`, { fontWeight: s.fontWeight })
      if (s.transform !== 'none' && /rotate|matrix\((?!1, 0, 0, 1)/.test(s.transform) || /vertical/.test(s.writingMode)) add('warn', 'tell-rotated-text', h, 'Rotated or vertical text')
      // Eyebrow: a short, small text block sitting right above the heading.
      let prev = h.previousElementSibling
      if (!prev && h.parentElement && h.parentElement.children[0] === h) prev = h.parentElement.previousElementSibling
      if (prev && visible(prev) && hasOwnText(prev) && !isHeading(prev) && !prev.matches('nav, ul, ol, img, svg, figure, form')) {
        const pr = prev.getBoundingClientRect(), hr = h.getBoundingClientRect(), ps = cs(prev)
        const small = px(ps.fontSize) <= Math.max(14, px(s.fontSize) * 0.5)
        if (small && wordCount(prev.innerText) <= 6 && hr.top - pr.bottom < 48 && hr.top >= pr.bottom - 2) add('warn', 'tell-eyebrow', prev, `Eyebrow label above the heading ("${snippet(prev)}"); move it below or beside the content it describes`)
      }
      if (/\?\s*$/.test(txt) && !h.closest('[data-slot="accordion-item"], [data-slot="accordion-trigger"], details, .faq, [data-faq]')) add('warn', 'tell-question-headline', h, 'Rhetorical question as a headline; state the point')
    }
    for (const t of text) {
      const s = cs(t.el)
      if (/^(p|li|dd|td)$/.test(t.tag) && px(s.letterSpacing) > 0.3 && wordCount(t.text) > 6) add('warn', 'tell-tracked-body', t.el, `Body text has ${s.letterSpacing} letter-spacing; tracking is for small caps labels, not paragraphs`, { letterSpacing: s.letterSpacing })
      if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t.text)) add('warn', 'tell-emoji', t.el, 'Emoji in page copy; use an icon or nothing')
      if (/(?:\s*[•·|]\s+\S+){2,}/.test(t.text) && wordCount(t.text) <= 12 && t.role !== 'cta') add('warn', 'tell-dot-strip', t.el, 'Middle-dot separator strip; decorative meta lines read as template chrome')
    }
    const cards = all.filter(el => inScope(el) && !el.matches('html, body, main, header, footer, nav, button, a, input, textarea, select') && (el.matches('[data-slot="card"], article, .card, [class*="card"], aside, blockquote') || (px(cs(el).paddingLeft) >= 12 && el.getBoundingClientRect().height > 40 && (cs(el).backgroundColor !== 'rgba(0, 0, 0, 0)' || px(cs(el).borderLeftWidth) > 0 || cs(el).boxShadow !== 'none') && (el.children.length > 0 || hasOwnText(el)))))
    for (const c of cards) {
      const s = cs(c)
      if (px(s.borderLeftWidth) >= 3 && px(s.borderRightWidth) === 0 && px(s.borderTopWidth) === 0 && px(s.borderBottomWidth) === 0) add('warn', 'tell-accent-bar', c, 'Left-border accent bar; use a full border or a plain surface')
      if (s.backdropFilter && s.backdropFilter !== 'none' && /blur/.test(s.backdropFilter)) add('warn', 'tell-glass', c, 'Glassmorphism (backdrop blur); premium reads through photography and restraint')
      const shadow = s.boxShadow
      if (shadow && shadow !== 'none') { const blur = shadow.match(/\)\s*-?\d+px\s+-?\d+px\s+(\d+)px/); const col = parseColor(shadow); if (blur && +blur[1] >= 24 && col && Math.max(col.r, col.g, col.b) - Math.min(col.r, col.g, col.b) > 40) add('warn', 'tell-glow', c, 'Coloured glow shadow; shadow is paper lift, one quiet recipe per page') }
    }
    const radii = new Set(all.filter(el => inScope(el) && el.matches('button, [data-slot="card"], input, select, textarea, .card, [class*="card"], img, [data-slot="button"]')).map(el => Math.round(px(cs(el).borderTopLeftRadius))).filter(r => r > 0))
    if (radii.size > 3) add('warn', 'tell-radius-systems', null, `${radii.size} different corner radii in use (${[...radii].sort((a, b) => a - b).join(', ')}px); one radius system per page`, { radii: [...radii] })
    const body = cs(document.body), bg = parseColor(body.backgroundColor)
    if (!o.scope && bg && ((bg.r === 255 && bg.g === 255 && bg.b === 255) || (bg.r === 0 && bg.g === 0 && bg.b === 0)) && bg.a === 1) add('warn', 'tell-pure-ground', document.body, `Page ground is pure ${bg.r ? '#fff' : '#000'}; bias the neutral toward the brand hue (npm run brand does this)`)
    const h2s = all.filter(el => el.tagName === 'H2' && inScope(el)), ps = text.filter(t => t.tag === 'p')
    if (h2s.length >= 3 && ps.length >= 4 && h2s.filter(h => cs(h).textAlign === 'center').length / h2s.length >= 0.8 && ps.filter(t => cs(t.el).textAlign === 'center').length / ps.length >= 0.8) add('warn', 'tell-all-centered', h2s[0], 'Every section is centred; centring everything is a default, not a decision')
    const animated = all.filter(el => inScope(el) && cs(el).animationName !== 'none').length
    if (animated > 12) add('warn', 'tell-animate-everything', null, `${animated} elements carry animations; motion is for hierarchy, feedback and state`, { animated })
    for (const svg of root.querySelectorAll('svg.lucide-sparkles, svg.lucide-sparkle, svg.lucide-zap, svg.lucide-rocket')) if (visible(svg)) add('warn', 'tell-icon-cliche', svg, `${svg.getAttribute('class').match(/lucide-[\w-]+/)[0]}: the stock AI/speed icon; pick one that means something here`)
    const footer = root.querySelector('footer')
    if (footer && visible(footer)) { const grids = [footer, ...footer.querySelectorAll('div')].filter(el => cs(el).display === 'grid'); for (const g of grids) { const tracks = cs(g).gridTemplateColumns.split(' ').filter(Boolean); if (tracks.length === 4 && new Set(tracks).size === 1) { add('warn', 'tell-four-column-footer', g, 'Four equal footer columns; size the footer to what it holds'); break } } }
    const splits = [...root.querySelectorAll('.p-split, [data-split]')].filter(visible)
    let run = 0, prevSec = null
    for (const sp of splits) { const sec = sp.closest('section') || sp.parentElement; run = prevSec && prevSec.nextElementSibling === sec ? run + 1 : 1; prevSec = sec; if (run === 3) { add('warn', 'tell-zigzag', sp, 'Three image/text zigzag sections in a row; change the layout family'); break } }
  }

  // ---------- opened-state containers present at audit time ----------
  const open = [...root.querySelectorAll('[role="menu"], [role="listbox"], [role="dialog"], details[open], [data-state="open"][data-slot$="-content"]')].filter(visible)
  const stats = { elements: all.length, textBlocks: text.length, contrastUnverified: unverified, openContainers: open.length, ruleCounts: counts }
  window.__auditSeq = auditSeq
  scrollTo({ top: scrollY0, behavior: 'instant' })
  return { findings, text: text.map(({ el, ...rest }) => ({ ...rest, mark: el.getAttribute('data-audit') ? +el.getAttribute('data-audit') : null })), stats }
}

// Paints numbered outlines on marked elements so the screenshot explains itself.
export function annotate(marks) {
  document.querySelectorAll('.audit-badge, #audit-style').forEach(n => n.remove())
  if (!marks.length) return 0
  const style = document.createElement('style'); style.id = 'audit-style'
  style.textContent = `[data-audit-hit]{outline:3px solid #ff2d55 !important;outline-offset:-3px !important}.audit-badge{position:absolute;z-index:2147483647;background:#ff2d55;color:#fff;font:700 12px/1 system-ui,sans-serif;padding:3px 5px;border-radius:3px;pointer-events:none;box-shadow:0 1px 3px #0008}`
  document.head.appendChild(style)
  let n = 0
  for (const m of marks) {
    const el = document.querySelector(`[data-audit="${m}"]`); if (!el) continue
    el.setAttribute('data-audit-hit', '1')
    const r = el.getBoundingClientRect()
    const b = document.createElement('div'); b.className = 'audit-badge'; b.textContent = String(m)
    b.style.left = `${Math.max(0, r.left + scrollX)}px`; b.style.top = `${Math.max(0, r.top + scrollY - 18)}px`
    document.body.appendChild(b); n++
  }
  return n
}

export function clearAnnotations() {
  document.querySelectorAll('.audit-badge, #audit-style').forEach(n => n.remove())
  document.querySelectorAll('[data-audit-hit]').forEach(el => el.removeAttribute('data-audit-hit'))
}
