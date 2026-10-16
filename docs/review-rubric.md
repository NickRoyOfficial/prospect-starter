# Review rubric

For the critic pass after `npm run audit` comes back with zero failures. The audit measures what a script can measure; this covers what only a look can catch. Open `test-results/audit/desktop-full.png`, `mobile-full.png`, `short.png` and every `*-open-*.png`, and answer each line with pass or a located defect ("mobile, services section, cards 2 and 3"). Fix, re-run the audit, look again. Stop when a pass finds nothing, or after three rounds; then report what is left, not that it is done.

Each item has a "how to tell" so two reviewers reach the same answer.

## First viewport (desktop and short)

1. The business is identifiable in three seconds: what they do, where, and the one action to take. How to tell: cover everything below the fold; the headline plus the button should answer all three.
2. One primary action, visually heavier than everything else. How to tell: count buttons in the hero; one is filled, the rest are not.
3. The headline, lede, primary action and the hero form (if any) are all inside the short viewport without scrolling. How to tell: `short.png`, nothing of those four is cut by the bottom edge.
4. The hero photo is the business, not a stock mood. How to tell: it shows their place, their work, their people, or the real logo; a generic smiling group is a fail.
5. Navigation reads as navigation and the mobile menu opens to a usable list. How to tell: `mobile-open-*.png` for the menu shows items with room around them.

## Hierarchy and rhythm

6. Every section has one heading that says what the section is, in a noun phrase. How to tell: read only the h2s top to bottom; they should outline the page. Gerunds, taglines and questions are fails.
7. Headings step down in size from h1 to h2 to h3 and nothing else competes with them. How to tell: no paragraph, label or card title is larger than the nearest heading above it.
8. No two adjacent sections use the same layout family. How to tell: list the sections as hero / cards / split / rail / FAQ / CTA / footer; no repeat touches another repeat.
9. Spacing encodes grouping: things that belong together sit closer than things that do not. How to tell: the gap inside a card is smaller than the gap between cards, which is smaller than the gap between sections.
10. No letterboxing: no empty band taller than roughly a tenth of the viewport that is not deliberate white space around a focal element. How to tell: scan the full-page screenshot for blank stripes.
11. Cards sit at their natural height; sparse content is not stretched to fill. How to tell: a card with two lines is not as tall as a card with six.

## Imagery

12. Every photo matches its caption and its section. How to tell: a "kitchen remodel" card shows a kitchen.
13. No photo is reused. How to tell: the same image does not appear twice.
14. Crops keep faces and subjects whole; nothing important is cut by a card edge. How to tell: look at each image's edges.
15. Logos are real files at a readable size with their proportions intact. How to tell: the logo is not text styled to look like a logo, and it is not squashed.

## Copy on the surface

16. Headlines say something the business can be held to. How to tell: "Weekly lawn care in Fishkill" passes; "Elevate your outdoor living" does not.
17. Button labels say what happens next. How to tell: "Book a visit" passes; "Learn more" does not.
18. Numbers and claims have a visible source or they are not there. How to tell: every figure, rating, "since 19xx" and "trusted by" either cites something on the page or is cut.
19. Nothing in the copy sounds like a template: no "we understand", no "look no further", no staccato fragments, no manufactured urgency. How to tell: read every display string aloud.

## Mobile

20. Nothing is cut off, overlapped, or reachable only by horizontal scroll. How to tell: `mobile-full.png` edges and every opened state.
21. Tap targets have room: buttons, menu items and form fields are at least 44px tall and not touching. How to tell: the audit covers size; check spacing by eye.
22. The hero form, if present, is usable with a thumb: labels visible, fields in one column, the submit button last and full width.

## Consistency

23. One corner radius system, one shadow recipe, one accent colour per surface, one theme per page. How to tell: pick any two cards or buttons; they match.
24. Icons mean something. How to tell: no sparkles, rockets or lightning bolts; no arrows welded to every button.
25. Motion is motivated or absent. How to tell: things reveal once on entry, or they do not move; nothing bounces, pulses or fades in on every element.

## Verdict

Write the pass as a list of located defects, most visible first, or "No defects found on desktop, mobile, short, and N opened states" with the exact set of screenshots you looked at. A pass that did not open the screenshots is not a pass.
