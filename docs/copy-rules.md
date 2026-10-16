# Copy rules

Website copy for a real business, written so it could have come from the owner. The audit's copy linter (`scripts/audit/copy.mjs`) enforces the mechanical half on every visible string; this is the whole set, for writing and for the critic pass. Adapted from Hardik Pandya's stop-slop (MIT) and its Vale rules, with additions for local-business marketing.

## The linter

`npm run audit` runs it over headings, body, buttons and labels. Failures block delivery; warnings need a decision; notes are recorded in `test-results/audit/report.json` only.

Failures: banned phrases ("here's the thing", "we understand that", "look no further", "your one-stop shop"), closing rituals ("in conclusion", "stay tuned"), meta-commentary ("in this section"), vague declaratives ("the difference is clear"), negation pivots ("it's not just X, it's Y"), em dashes, manufactured urgency ("only 3 spots left", countdowns), proof claims with no source ("100% satisfaction", "trusted by thousands", "award-winning", "#1 rated", "free estimates" when nothing on the page backs it), filler verbs opening a headline (Elevate, Unleash, Unlock, Transform, Empower, Discover the, Experience the, Welcome to), rhetorical questions as headlines (FAQ questions are exempt), staccato fragment stacks ("Fast. Local. Trusted.").

Warnings: AI vocabulary (seamless, elevate, bespoke, curated, crafted, vibrant, nestled in the heart of, passionate about, exceed your expectations, peace of mind, hassle-free), trailing participles (", ensuring a stress-free experience"), false agency ("the results speak for themselves"), adverbs in display copy, adverb density in body, repeated sentence openers, metronomic rhythm, generic button labels (Learn more, Get started, Submit).

Notes: weasel words, lazy extremes, rule-of-three lists.

To lint a draft before it is on the page: `node -e "import('./scripts/audit/copy.mjs').then(m => console.log(m.lintText(require('fs').readFileSync('draft.md','utf8'))))"`. The Vale package in `tools/vale/` does the same for markdown files if Vale is installed.

## Writing it

1. Lead with what the business does, where, for whom. "Weekly lawn care for homes in Fishkill and Wappinger" beats any tagline.
2. Every sentence has a human subject doing something. The owner, the crew, you. Not "quality is delivered", not "the process ensures".
3. Name the specific thing. A number, a street, a service, a year, a name. If you do not have it, say what you do have, or leave it out. Never invent it.
4. Headings are noun phrases that name the section: "Services", "Service area", "How booking works", "Reviews from Yelp". Not gerunds, not taglines, not questions.
5. Buttons say what happens next: "Call now", "Text for a quote", "Book a visit", "See the menu".
6. Two items beat three. Vary sentence length. End paragraphs differently. No em dashes; commas, colons, full stops.
7. Proof sits next to the claim or the claim goes. A review has a name and a source. A number has a source. A credential has an issuer.
8. Match the register to the direction and the business: `bold` is short and plain, `editorial` is measured, `warm` is friendly without being cute. None of them is breathless.
9. Read every display string aloud. If it sounds like a billboard written by a committee, rewrite it.

## Phrases to cut

Throat-clearing: here's the thing, the truth is, let me be clear, at the end of the day, when it comes to, in today's world, it's worth noting.
Marketing filler: we understand that, we take pride in, look no further, you deserve the best, second to none, your trusted partner, whether you're looking for, we specialize in (say what you do instead), proudly serving, family-owned and operated (fine as a fact in the footer, not as a headline).
AI vocabulary: delve, intricate, tapestry, testament, boasts, showcase, pivotal, seamless, meticulous, bespoke, curated, crafted, elevate, leverage, harness, transformative, cutting-edge, state-of-the-art, holistic, synergy, best-in-class, world-class, top-notch, unparalleled, premier.
Closing rituals: in conclusion, the possibilities are endless, the future is bright, stay tuned, watch this space.

## Structures to avoid

| Pattern | Instead |
| --- | --- |
| "It's not just about X, it's about Y." | "Y." |
| "Not a X. Not a Y. A Z." | "Z." |
| "Fast. Local. Trusted." | One sentence that carries the claim, with the fact behind it. |
| "Ready to get started?" | "Book a visit" (the button), or a heading that names the section. |
| "..., ensuring a seamless experience." | Stop at the full stop. |
| "The results speak for themselves." | Show a result with a source. |
| "What sets us apart is..." | State the thing. |
| "Only 3 spots left this month!" | A real constraint with its mechanism, in a sentence, or nothing. |

## Scoring a draft

Rate each 1 to 10. Below 56 of 80, revise.

| Dimension | Question |
| --- | --- |
| Directness | Statements or announcements? |
| Rhythm | Varied or metronomic? |
| Trust | Respects the reader? |
| Authenticity | Sounds like the owner? |
| Density | Anything cuttable? |
| Specificity | Names the actual thing, or gestures at a category? |
| Restraint | States things at their real size? |
| Voice | Has a point of view, or reads as wire copy? |

Clean mechanics with nothing specific is the common failure: text with no banned phrases that says nothing. The second half of the table catches it.
