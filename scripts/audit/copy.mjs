// Copy linter for display text. Runs in Node over the text blocks the browser audit extracts
// (heading / body / cta / label, with an FAQ flag so real questions are not punished).
//
// Ported from the stop-slop catalog (Hardik Pandya, MIT) and its Vale rules, plus the
// display-copy tells from docs/design-tells.md. Levels: fail = ship-blocking, warn = decide,
// note = recorded in report.json only.
//
// To add a pattern: add a regex to the right list and a line to test/copy.test.mjs.

const I = 'i'
const rx = (s, f = I) => new RegExp(s, f)

export const BANNED_PHRASES = [
  "here'?s the thing", "here'?s what (?:i|you|we) (?:mean|find|think)", "here'?s why(?: that)? matters", "the uncomfortable truth is", "it turns out",
  "let me be clear", "the truth is", "i'?m going to be honest", "can we talk about", "full stop\\.", "let that sink in", "read that again", "make no mistake",
  "this matters because", "at its core", "in today'?s [\\w-]+", "it'?s worth noting", "at the end of the day", "when it comes to", "in a world where", "the reality is",
  "plot twist", "you already know this,? but", "is a feature,? not a bug", "let me walk you through", "we understand (?:that|how|your)", "look no further", "we'?ve got you covered",
  "your one[- ]stop shop", "we take pride in", "we pride ourselves", "second to none", "the difference is clear", "you deserve the best",
]
export const CLOSING_RITUALS = ["in conclusion", "in summary", "to sum up", "all in all", "the possibilities are endless", "only time will tell", "the future is bright", "the future of [\\w\\s]{3,30} is here", "one thing is (?:clear|certain)", "the bottom line is", "so there you have it", "the journey (?:is|has) just (?:begun|beginning)", "watch this space", "stay tuned"]
export const META_COMMENTARY = ["\\bin (?:this|the next) section", "\\b(?:this|the) (?:page|section|site) (?:explains|covers|walks through)", "\\bwe(?:'ll| will) (?:cover|explore|walk through|unpack)\\b", "\\bbelow,? you(?:'ll| will) find\\b", "\\bscroll down to\\b"]
export const VAGUE_DECLARATIVES = ["\\bthe (?:implications|consequences|reasons|stakes|risks|results) (?:are|were) \\w+", "\\bthis (?:\\w+ly )?changes everything", "\\bthat changes everything", "\\bthe difference is (?:real|clear|night and day)"]
export const NEGATION_PIVOTS = [
  "\\b(?:it|that|this|they|we)(?:'s|s| is| are| was| were) not(?: just| only)?\\b[^.?!]{1,80}?[,.]\\s*(?:it|that|this|they|we)(?:'s| is|'re| are)\\b",
  "\\b(?:is|was|are|were|do|does|did|can|could|would|will)n't\\b[^.?!]{1,80}?[,.]\\s*(?:it|that|this|they|we|you)(?:'s| is|'re| are)\\b",
  "\\bnot (?:just|only)\\b[^.?!]{0,60}?\\bbut(?: also)?\\b", "\\bnot because\\b[^.?!]{1,80}?[,.]\\s*(?:but )?because\\b", "\\bstops? being\\b[^.?!]{1,60}?\\bstarts? being\\b",
  "\\b(?:more than|not) (?:just )?(?:a|an) [\\w\\s]{2,25}[,.]\\s*(?:it'?s|we'?re|this is)\\b",
]
export const FILLER_VERBS = ["elevate", "elevating", "unleash", "unleashing", "unlock", "unlocking", "revolutioni[sz]e", "revolutioni[sz]ing", "empower", "empowering", "transform", "transforming", "supercharge", "reimagine", "reimagining", "redefine", "redefining", "discover the", "experience the", "welcome to", "introducing"]
export const SCARCITY = ["\\bonly \\d+ (?:spots?|seats?|slots?|left|remaining)\\b", "\\blimited[- ]time\\b", "\\bhurry\\b", "\\bdon'?t miss out\\b", "\\bact (?:now|fast)\\b", "\\bbefore (?:it'?s|they'?re) gone\\b", "\\bwhile (?:supplies|stocks?) last\\b", "\\boffer ends\\b", "\\b\\d{1,2}:\\d{2}:\\d{2}\\b"]
export const FAKE_PROOF = ["\\b(?:99|100)(?:\\.\\d)?% (?:satisfaction|satisfied|success|guaranteed|happy)\\b", "\\b\\d{1,3}(?:,\\d{3})*\\+ (?:happy |satisfied )?(?:customers|clients|projects|jobs|reviews|users)\\b", "\\b(?:trusted|loved|used) by (?:thousands|hundreds|millions|businesses|homeowners|families)\\b", "\\b(?:quietly )?in use at\\b", "\\b(?:5|five)[- ]star (?:rated|service|reviews?)\\b", "\\bbest (?:in|of) (?:the )?(?:town|city|area|state|business|class)\\b", "\\b#\\s?1 (?:rated|choice|in)\\b", "\\baward[- ]winning\\b", "\\bindustry[- ]leading\\b", "\\bfast(?:est)? response times?\\b", "\\bfree (?:estimates?|quotes?|consultations?)\\b"]
export const AI_VOCABULARY = ["delve[sd]?(?: into)?", "intricate(?:ly)?", "realm of", "tapestry", "a testament to", "boasts?", "underscore[sd]?", "pivotal", "showcas(?:e|es|ing|ed)", "seamless(?:ly)?", "meticulous(?:ly)?", "commendable", "noteworthy", "multifaceted", "myriad", "plethora", "ever-(?:evolving|changing|growing)", "navigat(?:e|ing) the (?:complex|complexities|landscape|world)", "unlock(?:ing)? the (?:power|potential|value|secrets)", "harness(?:ing)? the (?:power|potential)", "leverag(?:e|ing) the", "elevate your", "transformative", "game[- ]chang(?:er|ing)", "cutting[- ]edge", "state[- ]of[- ]the[- ]art", "robust (?:solution|framework|approach)", "holistic (?:approach|view)", "synerg(?:y|ies|istic)", "paradigm shift", "best[- ]in[- ]class", "world[- ]class", "bespoke", "curated", "crafted", "storied", "vibrant", "bustling", "stands? as a", "serves? as a reminder", "plays? a (?:crucial|vital|key|significant) role", "it'?s important to (?:note|remember|understand)", "one of the most (?:important|significant|critical)", "top[- ]notch", "hassle[- ]free", "peace of mind", "exceed(?:s|ing)? (?:your )?expectations", "passionate about", "dedicated to (?:providing|delivering)", "committed to (?:providing|delivering|excellence)", "tailored to your (?:needs|unique)", "unparalleled", "unmatched", "premier", "premium quality", "high[- ]quality (?:service|work|results)", "customer satisfaction", "state of the art", "go (?:the extra mile|above and beyond)", "stress[- ]free", "turn(?:ing)? your (?:vision|dream) into", "nestled in (?:the heart of)?", "vibrant community", "hidden gem", "a cut above", "proudly serving", "family[- ]owned and operated", "your (?:trusted|local) (?:partner|experts?)", "we (?:specialize|specialise) in", "whether you(?:'re| are) looking"]
export const ADVERBS = ["really", "just", "literally", "genuinely", "honestly", "simply", "actually", "deeply", "truly", "fundamentally", "inherently", "inevitably", "interestingly", "importantly", "crucially", "basically", "essentially", "clearly", "obviously", "certainly", "undoubtedly", "significantly", "incredibly", "absolutely", "extremely", "very", "effortlessly"]
export const WEASEL = ["several", "various", "a (?:number|variety) of", "many", "a few", "some of the", "relatively", "substantially", "remarkably", "fairly", "quite", "largely", "mostly", "generally", "typically", "often", "sometimes", "arguably", "surprisingly", "notably", "considerably", "a wide range of", "countless", "numerous"]
export const GENERIC_CTA = ["learn more", "get started", "click here", "read more", "submit", "discover more", "explore", "find out more", "see more", "go"]
export const LAZY_EXTREMES =["everyone", "everybody", "nobody", "no one", "always", "never", "everything", "all your"]
const PARTICIPLE = ",\\s+(?:highlighting|emphasi[sz]ing|underscoring|showcasing|reflecting|demonstrating|ensuring|allowing|enabling|providing|offering|creating|making it|marking|solidifying|cementing|reinforcing)\\s+[^.?!]{5,70}[.?!]"
const FALSE_AGENCY = "\\b(?:the\\s+)?(?:complaint|decision|conversation|culture|market|data|process|system|framework|approach|narrative|momentum|results?|quality)\\s+(?:becomes|emerges|shifts|moves|tells|rewards|decides|wants|knows|demands|reveals|speaks? for (?:itself|themselves))\\b"
const RULE_OF_THREE = "\\b\\w+,\\s+\\w+,?\\s+and\\s+\\w+\\b"
const EM_DASH = "—|\\s--\\s"

const compile = (list, flags = 'i') => list.map(p => ({ rx: rx(p, flags), src: p }))
const R = {
  banned: compile(BANNED_PHRASES), closing: compile(CLOSING_RITUALS), meta: compile(META_COMMENTARY), vague: compile(VAGUE_DECLARATIVES), pivot: compile(NEGATION_PIVOTS),
  filler: FILLER_VERBS.map(p => ({ rx: rx(`^(?:${p})\\b`), src: p })), scarcity: compile(SCARCITY), proof: compile(FAKE_PROOF), ai: AI_VOCABULARY.map(p => ({ rx: rx(`\\b(?:${p})\\b`), src: p })),
  adverbs: ADVERBS.map(p => ({ rx: rx(`\\b${p}\\b`), src: p })), weasel: WEASEL.map(p => ({ rx: rx(`\\b(?:${p})\\b`), src: p })), lazy: LAZY_EXTREMES.map(p => ({ rx: rx(`\\b(?:${p})\\b`), src: p })),
  cta: GENERIC_CTA.map(p => ({ rx: rx(`^(?:${p})[.!]?$`), src: p })),
  participle: [{ rx: rx(PARTICIPLE), src: 'participle' }], agency: [{ rx: rx(FALSE_AGENCY), src: 'agency' }], three: [{ rx: rx(RULE_OF_THREE), src: 'three' }], dash: [{ rx: rx(EM_DASH, ''), src: 'dash' }],
}
const first = (text, rules) => { for (const r of rules) { const m = text.match(r.rx); if (m) return m[0] } return null }
const sentences = t => t.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.split(/\s+/).length > 2)
const words = t => t.trim().split(/\s+/).filter(Boolean)

// Staccato stack: three or more fragments of three words or fewer, each ending in a full stop.
function staccato(text) {
  const frags = text.split(/[.!]\s*/).map(s => s.trim()).filter(Boolean)
  return frags.length >= 3 && frags.filter(f => words(f).length <= 3).length >= 3
}

export function lintCopy(blocks, opts = {}) {
  const findings = []
  const add = (level, id, block, message, match) => findings.push({ level, id, message, selector: block.selector, text: block.text.length > 60 ? block.text.slice(0, 57) + '...' : block.text, match, mark: block.mark, viewport: opts.viewport })
  for (const b of blocks) {
    const t = b.text
    if (!t || words(t).length === 0) continue
    const display = b.role === 'heading' || b.role === 'cta'
    let m
    if ((m = first(t, R.banned))) add('fail', 'copy-banned-phrase', b, `Banned phrase "${m}"; cut it and state the point`, m)
    if ((m = first(t, R.closing))) add('fail', 'copy-closing-ritual', b, `Closing ritual "${m}"; end on the last real point`, m)
    if ((m = first(t, R.meta))) add('fail', 'copy-meta', b, `Meta-commentary "${m}"; the page should move, not announce itself`, m)
    if ((m = first(t, R.vague))) add('fail', 'copy-vague', b, `Vague declarative "${m}"; name the specific thing`, m)
    if ((m = first(t, R.pivot))) add('fail', 'copy-negation-pivot', b, `Negation pivot "${m}"; state the second half and delete the setup`, m)
    if ((m = first(t, R.dash))) add('fail', 'copy-em-dash', b, 'Em dash; use a comma, a colon or two sentences', m)
    if ((m = first(t, R.scarcity))) add('fail', 'copy-scarcity', b, `Manufactured urgency "${m}"; scarcity is a fact with a mechanism, in a full sentence, or it is cut`, m)
    if ((m = first(t, R.proof))) add('fail', 'copy-unsourced-proof', b, `Proof claim "${m}" with no source on the page; verified facts only, or cut`, m)
    if (display && (m = first(t, R.filler))) add('fail', 'copy-filler-verb', b, `Headline opens with filler verb "${m}"; say what the business does`, m)
    if (b.role === 'heading' && /\?\s*$/.test(t) && !b.faq) add('fail', 'copy-question-headline', b, 'Rhetorical question as a headline; state the point', '?')
    if (staccato(t)) add('fail', 'copy-staccato', b, 'Fragment stack ("Fast. Local. Trusted."); write one sentence that carries the claim', t)
    if (b.role === 'cta' && (m = first(t.trim(), R.cta))) add('warn', 'copy-generic-cta', b, `Generic button label "${m}"; say what happens ("Book a visit", "Get a quote by text")`, m)
    if ((m = first(t, R.ai))) add('warn', 'copy-ai-vocabulary', b, `AI vocabulary "${m}"; use the plain word you would say out loud`, m)
    if ((m = first(t, R.participle))) add('warn', 'copy-trailing-participle', b, `Trailing participle "${m.trim()}"; stop at the full stop`, m)
    if ((m = first(t, R.agency))) add('warn', 'copy-false-agency', b, `False agency "${m}"; name the person who acts`, m)
    if (display && (m = first(t, R.adverbs))) add('warn', 'copy-adverb', b, `Adverb "${m}" in display copy; the verb should carry the weight`, m)
    if (!display && (t.match(/\b\w{3,}ly\b/g) || []).length > 2 && words(t).length > 20) add('warn', 'copy-adverb-density', b, 'Three or more -ly adverbs in one block; cut them', null)
    const sents = sentences(t)
    if (sents.length >= 3) {
      const firsts = sents.map(s => words(s)[0].toLowerCase().replace(/[,;:]$/, ''))
      for (let i = 0; i + 2 < firsts.length; i++) if (firsts[i] === firsts[i + 1] && firsts[i + 1] === firsts[i + 2]) { add('warn', 'copy-repeated-opener', b, `Three sentences in a row open with "${firsts[i]}"`, firsts[i]); break }
    }
    if (sents.length >= 4) {
      const n = sents.map(s => words(s).length), mean = n.reduce((a, c) => a + c, 0) / n.length
      const cv = Math.sqrt(n.reduce((a, c) => a + (c - mean) ** 2, 0) / n.length) / mean
      if (cv < 0.35) add('warn', 'copy-monotony', b, `Metronomic rhythm: ${n.length} sentences, mean ${Math.round(mean)} words, variation ${cv.toFixed(2)} (want above 0.35)`, null)
    }
    if ((m = first(t, R.weasel))) add('note', 'copy-weasel', b, `Weasel word "${m}"; give the number or name the thing`, m)
    if ((m = first(t, R.lazy)) && !b.faq) add('note', 'copy-lazy-extreme', b, `Lazy extreme "${m}"; use a specific number or name`, m)
    if ((m = first(t, R.three)) && words(t).length < 30) add('note', 'copy-rule-of-three', b, `Rule-of-three list "${m}"; two items beat three`, m)
  }
  return findings
}

// Direct string entry point for drafts and briefs: splits on blank lines, treats the first line as a heading.
export function lintText(text) {
  const blocks = text.split(/\n\s*\n/).map((t, i) => ({ text: t.replace(/\s+/g, ' ').trim(), role: i === 0 && t.length < 90 ? 'heading' : 'body', faq: false, selector: `block ${i + 1}`, mark: null }))
  return lintCopy(blocks)
}
