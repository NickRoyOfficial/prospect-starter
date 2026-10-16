// Promote a section from a finished prospect build into the starter, with a gate.
//
//   node scripts/promote.mjs --from /path/to/prospect --section src/components/sections/gallery-rail.tsx
//   node scripts/promote.mjs --from ../acme --section src/components/sections/gallery-rail.tsx --css src/components/sections/gallery-rail.css --name gallery-rail
//
// Copies the section (and its CSS) into src/components/sections/promoted/<name>.*, then refuses
// anything that carries its own design: hex/rgb/hsl colours, raw px sizes, arbitrary Tailwind
// values, font-family literals, font imports. A promoted section reads tokens from
// src/index.css and brand.css so it restyles under every direction preset without edits.
// Pass --allow to copy anyway and fix in place.
//
// After promoting: add it to src/dev/section-showcase.tsx, then run
//   npm run audit -- --path "/?layouts=1"   once per data-direction (see docs/directions.md)
// and only then mention it in src/components/sections/README.md.

import { readFile, writeFile, mkdir, appendFile, access } from 'node:fs/promises'
import { resolve, basename, extname, join } from 'node:path'

const args = process.argv.slice(2)
const option = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1] }
const from = option('--from'), section = option('--section'), css = option('--css')
if (!from || !section) { console.error('Usage: node scripts/promote.mjs --from <prospect dir> --section <path in prospect> [--css <path>] [--name <name>] [--allow]'); process.exit(1) }
const name = (option('--name') || basename(section, extname(section))).replace(/[^a-z0-9-]/gi, '-').toLowerCase()
const dest = resolve('src/components/sections/promoted')

// Each rule: what it catches and why it is not allowed in a shared section.
const RULES = [
  [/#[0-9a-f]{3,8}\b/gi, 'hex colour; use var(--primary), var(--brand) or a semantic token'],
  [/\b(?:rgba?|hsla?|oklch|oklab)\(/gi, 'colour function; use a token'],
  [/\b\d{2,4}px\b/g, 'raw px size; use var(--space-*), var(--text-*), var(--radius-*) or a Tailwind scale class'],
  [/\[(?:\d+(?:px|rem|em|vh|vw|%)|#[0-9a-f]+|rgb[^\]]*)\]/gi, 'arbitrary Tailwind value; use the scale or a token'],
  [/font-family\s*:/gi, 'font-family literal; the direction preset sets --font-display and --font-sans'],
  [/fonts\.googleapis\.com|@font-face/gi, 'font import; fonts are loaded once in index.html per direction'],
  [/\b(?:rounded-(?:none|sm|md|lg|xl|2xl|3xl|full))\b/g, 'fixed radius class; use rounded-[var(--radius-card)] via the p-* classes or the token'],
  [/\b(?:shadow-(?:sm|md|lg|xl|2xl))\b/g, 'fixed shadow class; use var(--shadow-lift)'],
  [/\b(?:animate-(?:bounce|ping|pulse|spin))\b/g, 'decorative animation class; motion comes from the direction (reveal, transform/opacity only)'],
]
const ALLOW = [/^\s*\/\//, /border(?:-[a-z]+)?:\s*1px/, /\b1px\b/, /\b0px\b/, /100vh|100svh|100%/, /#main|#root|#[a-z][\w-]*\b(?!\s*[;,}])/i]

function gate(source, file) {
  const problems = []
  source.split('\n').forEach((line, i) => {
    for (const [rx, why] of RULES) {
      rx.lastIndex = 0
      const m = line.match(rx)
      if (!m) continue
      if (ALLOW.some(a => a.test(line)) && !/#[0-9a-f]{6}\b|rgba?\(/i.test(line)) continue
      problems.push({ file, line: i + 1, match: m[0], why })
    }
  })
  return problems
}

try {
  const srcTsx = await readFile(resolve(from, section), 'utf8')
  const srcCss = css ? await readFile(resolve(from, css), 'utf8') : null
  const problems = [...gate(srcTsx, section), ...(srcCss ? gate(srcCss, css) : [])]
  if (problems.length && !args.includes('--allow')) {
    console.error(`${name}: ${problems.length} hard-coded design value(s). A shared section carries structure, not a look.\n`)
    for (const p of problems) console.error(`  ${p.file}:${p.line}  ${p.match}  ->  ${p.why}`)
    console.error('\nReplace them with tokens, or pass --allow to copy and fix in place.')
    process.exit(1)
  }
  await mkdir(dest, { recursive: true })
  const tsxOut = join(dest, `${name}.tsx`)
  await access(tsxOut).then(() => { throw new Error(`${tsxOut} already exists; pick another --name or remove it first.`) }, () => {})
  await writeFile(tsxOut, srcTsx.replace(/from\s+["']\.\/([\w-]+)\.css["']/g, `from "./${name}.css"`))
  if (srcCss) await writeFile(join(dest, `${name}.css`), srcCss)
  const index = join(dest, 'README.md')
  await access(index).catch(() => writeFile(index, '# Promoted sections\n\nSections harvested from finished prospect builds. Each passed the token gate (scripts/promote.mjs) and the audit under every direction before being listed here.\n\n| Section | From | Promoted | Audited under |\n| --- | --- | --- | --- |\n'))
  await appendFile(index, `| ${name} | ${basename(resolve(from))} | ${new Date().toISOString().slice(0, 10)} | pending: run the audit per direction and fill this in |\n`)
  console.log(`Promoted ${name} -> ${tsxOut}${srcCss ? ` (+ ${name}.css)` : ''}${problems.length ? ` with ${problems.length} allowed violations to fix` : ', token gate clean'}.`)
  console.log('Next: import it in src/dev/section-showcase.tsx, run `npm run audit -- --path "/?layouts=1"` with each data-direction, then record the result in src/components/sections/promoted/README.md.')
} catch (error) { console.error(error.message); process.exit(1) }
