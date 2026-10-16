// Records corrections you give the agent, so rules come from evidence instead of memory.
//
// As a hook (.codex/hooks.json, UserPromptSubmit): reads the prompt JSON on stdin, keeps it if
// it reads like a correction, appends one line to .agents/corrections.jsonl, always exits 0.
// Never blocks a prompt, never prints to the agent.
//
//   node scripts/correction.mjs --review        group what has been logged, by theme
//   node scripts/correction.mjs --add "text"    log one by hand
//
// Distil, do not accumulate: when --review shows the same theme three times, it becomes a
// check in scripts/audit/checks.js, a token in src/index.css, or a sentence in AGENTS.md,
// in that order of preference. See docs/corrections.md.

import { appendFile, mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const LOG = resolve('.agents/corrections.jsonl')
// Patterns after claude-reflect's capture script (MIT): what a correction sounds like, and what only looks like one.
const CORRECTION = [
  /^\s*(no|nope|wrong|not that|stop)\b/i, /^\s*don'?t\b/i, /\b(i|we) (told|asked) you\b/i, /\buse \S+ (not|instead of) \S+/i,
  /\bshould (be|have|use|not)\b/i, /\b(always|never) (use|add|put|do|make)\b/i, /\bthat'?s (wrong|not right|not what)\b/i,
  /\b(fix|undo|revert|remove) (the|that|this)\b/i, /\btoo (big|small|much|little|tight|loose|dark|light)\b/i, /\b(missing|no) (padding|margin|spacing|contrast|gap)\b/i,
  /\bagain\b.*\b(same|still)\b/i, /\bwhy (did|is|does) (it|this|that)\b/i,
]
const NOT_CORRECTION = [/\?\s*$/, /^\s*(can|could|would|will|what|how|is|are|do|does)\b.*\?/i, /^\s*(build|create|make|add|start|deploy|push|run|open)\b/i, /^\s*(yes|ok|okay|sure|go ahead|thanks)\b/i]
const THEMES = {
  padding: /\b(padding|cramped|tight|touching|edge)\b/i, spacing: /\b(spacing|gap|margin|whitespace|crowded|air)\b/i, contrast: /\b(contrast|unreadable|can'?t read|too light|washed)\b/i,
  size: /\b(too (big|small|large)|font[- ]size|huge|tiny)\b/i, mobile: /\b(mobile|phone|touch|tap|responsive|overflow)\b/i, menu: /\b(menu|dropdown|select|nav|drawer|dialog|modal)\b/i,
  overlap: /\b(overlap|overlapping|covers|on top of|behind|cut off|clipped|hidden under)\b/i,
  copy: /\b(copy|wording|headline|tagline|says|tone|slop|generic|cheesy)\b/i, color: /\b(colou?r|palette|hue|brand|purple|gradient)\b/i, images: /\b(image|photo|logo|stretched|blurry|crop)\b/i,
  motion: /\b(animation|animate|motion|fade|slide|parallax)\b/i, facts: /\b(fake|invented|made up|not true|verify|source|reviews?)\b/i, process: /\b(ask|permission|plan|commit|push|deploy|scope)\b/i,
}
const classify = t => Object.entries(THEMES).filter(([, rx]) => rx.test(t)).map(([k]) => k)
const looksLikeCorrection = t => CORRECTION.some(rx => rx.test(t)) && !NOT_CORRECTION.some(rx => rx.test(t))

async function log(text, source) {
  await mkdir(resolve('.agents'), { recursive: true })
  await appendFile(LOG, JSON.stringify({ at: new Date().toISOString(), source, themes: classify(text), text: text.trim().slice(0, 500) }) + '\n')
}

const args = process.argv.slice(2)
try {
  if (args[0] === '--review') {
    const lines = (await readFile(LOG, 'utf8').catch(() => '')).split('\n').filter(Boolean).map(l => JSON.parse(l))
    if (!lines.length) { console.log('No corrections logged yet.'); process.exit(0) }
    const byTheme = {}
    for (const l of lines) for (const t of (l.themes.length ? l.themes : ['other'])) (byTheme[t] ||= []).push(l)
    for (const [theme, items] of Object.entries(byTheme).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`\n${theme} (${items.length})${items.length >= 3 ? '  <- recurring: turn this into a check or a token' : ''}`)
      for (const i of items) console.log(`  ${i.at.slice(0, 10)}  ${i.text.replace(/\s+/g, ' ').slice(0, 110)}`)
    }
    console.log(`\n${lines.length} corrections in ${LOG}`)
  } else if (args[0] === '--add') {
    await log(args.slice(1).join(' '), 'manual'); console.log('Logged.')
  } else {
    let input = ''
    for await (const chunk of process.stdin) input += chunk
    let prompt = input
    try { const j = JSON.parse(input); prompt = j.prompt || j.user_prompt || j.message || j.text || '' } catch {}
    if (prompt && looksLikeCorrection(prompt)) await log(prompt, 'hook')
  }
} catch {}
process.exit(0)
