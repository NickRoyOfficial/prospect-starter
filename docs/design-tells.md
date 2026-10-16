# Design tells

Patterns that make a page read as generated. The audit's `tell-*` checks catch the machine-checkable half as warnings; this is the whole catalogue, for the build and for the critic pass. Adapted from a working catalogue by Sam Town, which draws on Anthropic's artifact-design guidance, Leonxlnx's taste-skill, funboy322's avoid-ai-design and Nutlope's hallmark.

The rule behind every entry: a choice is fine, a default is a tell. Each tell below is what a model reaches for when nobody decided.

## Structure and chrome

- Eyebrows. Any small line sitting above a heading is one, whatever its case or content: "Our services", "01 — Process", "FEATURES". Nothing sits above a heading; labels and captions sit below or beside the content they describe, sentence case, small and muted. Audit: `tell-eyebrow`.
- Section numbering ("01", "Step 03") when there is no real sequence.
- Middle-dot strips as garnish: "Fast · Local · Trusted", "Est. 2009 · Fishkill, NY · Licensed". Audit: `tell-dot-strip`.
- Decorative status dots, "scroll" cues, version labels, locale and time strips, meta sentences under headings.
- Left-border accent bars on cards and callouts. Full border or plain surface. Audit: `tell-accent-bar`.
- Hero stacks over four text elements (label, title, lede, note is the ceiling). Audit: `tell-hero-stack`.
- Split-header heroes (headline left, floating paragraph right) and everything-centred layouts as the default. Audit: `tell-all-centered`.

## Typography

- A decorative serif or script accent face on a sans system (Fraunces, Playfair, Instrument Serif, Cormorant as garnish). A serif system is fine; the sprinkle is the tell. Use the `editorial` direction if the brand wants a serif.
- Uppercase headings. Uppercase survives only in buttons and small chrome. Audit: `tell-uppercase-heading`.
- Inter, Roboto and Space Grotesk as the unconsidered "safe" face. The direction presets pick faces for a reason; use them.
- Gradient text fills. Audit: `tell-gradient-text`.
- Letter-spaced body text. Tracking is for small labels. Audit: `tell-tracked-body`.
- Display weights under 500. Audit: `tell-thin-display`.
- Rotated or vertical text. Audit: `tell-rotated-text`.
- Line-broken italic headlines, `<br>` for rhythm.
- Headings as gerund phrases, taglines, questions or dash clauses. A heading is a noun phrase that names the section. Audit: `tell-question-headline`, copy linter `copy-filler-verb`.

## Colour and surface

- The named generated palettes: purple-to-blue gradient hero on white; cream plus serif plus terracotta; near-black with one acid green or vermilion pop; untouched shadcn zinc or slate.
- Pure `#fff` or `#000` grounds. Neutrals carry a hue bias toward the brand; `npm run brand` does this. Audit: `tell-pure-ground`.
- More than one accent per surface, more than one radius system, more than one theme per page. Audit: `tell-radius-systems`.
- Glassmorphism, gradient mesh, neon glow, metallic "premium" gradients, rounded-2xl plus shadow-lg on everything. Premium reads through photography and restraint. Audit: `tell-glass`, `tell-glow`.
- Shadow as decoration. Shadow is paper lift, one recipe per page (`--shadow-lift`).

## Layout

- Hero, three equal cards, CTA. Three-tier pricing. Four-column footer by default. Vary counts and widths with the content; asymmetry is allowed. Audit: `tell-four-column-footer`.
- More than two image-and-text zigzags in a row. Pages with eight or more sections need four or more layout families. Audit: `tell-zigzag`.
- Faked fill: `justify-content: space-between`, `flex: 1`, `grid-auto-rows: 1fr` stretching sparse content. A redistributed void reads worse than a void. Cards sit at natural height.
- Uniform `gap-4` / `p-6` everywhere with no hierarchy. Spacing encodes grouping.

## Display copy

- Staccato fragment stacks ("Fast. Local. Trusted.") and manufactured scarcity or countdowns. Copy linter: `copy-staccato`, `copy-scarcity`.
- Negation pivots and rhetorical questions as headlines. Copy linter: `copy-negation-pivot`, `copy-question-headline`.
- Filler verbs opening anything: Elevate, Unleash, Unlock, Transform, Empower, Discover, Experience. Copy linter: `copy-filler-verb`.
- Generic button labels: Learn more, Get started, Submit. Copy linter: `copy-generic-cta`.
- A big claim without its proof on the same surface. "Trusted by hundreds" with no names is a tell and, on a prospect site, a fabrication. Copy linter: `copy-unsourced-proof`.

## Content authenticity

- A logo rendered as styled text or a div. Real asset, real file, proportions intact.
- Div-faked product UI, fake screenshots, placeholder people ("John Doe"), egg avatars, fake-precise numbers (99.9%), invented reviews or star ratings.
- Group-smile stock presented as the business. One photo reused across the page.
- Emoji as icons or bullets. Sparkles, Zap and Rocket icons. Arrow glyphs welded to buttons. Audit: `tell-emoji`, `tell-icon-cliche`.

## Motion

- Fade-in-up on everything, more than one marquee, parallax by reflex, scroll hijacking. Motion is motivated (hierarchy, feedback, state) or absent; transform and opacity only; reduced motion honoured. Audit: `tell-animate-everything`.

## Before shipping

1. Any line of any kind above a heading? Delete it; move what it said below or beside the content.
2. Read every display string aloud: fragment stacks, urgency theatre, filler verbs, template phrases?
3. Count faces (more than two: justify), accents per surface (more than one: cut), radius systems (more than one: unify).
4. Any caps outside buttons? Recase.
5. Any accent bar, glass card, gradient mesh or glow? Restyle.
6. Any stretched or redistributed void? Reflow to natural height.
7. Any number without a source, claim without proof, logo that is not a real file, photo that lies about its caption? Fix or cut.
8. Look at the full-page screenshots as the owner of the business would, before calling it done.
