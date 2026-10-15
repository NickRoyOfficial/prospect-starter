# Optional component library

27 independent variants. They are layout scaffolds with placeholder content, not finished website designs. The live starter in public/ remains empty. This library is outside the deployment directory.

- `npm run catalog`: open the visual browser at http://127.0.0.1:8001. Filter variants, change light/dark preview, select desktop/tablet/mobile widths, inspect and copy source.
- `npm run section -- --list`: list IDs without reading all the source.
- `npm run section -- hero-split`: print only the selected HTML.
- `npm run section -- hero-split benefits-bento footer-columns --css`: print the common and selected CSS.

## Use a variant
1. Use the concise variant list or visual catalog to choose a compatible composition. Read only the selected HTML/CSS files plus base.css.
2. Copy HTML into the business page. Put base.css and the selected variant CSS in the site's component stylesheet and link it from the page. Copy icons.svg into public/assets/ if referenced. Existing public/js/main.js handles the data hooks.
3. Replace every `{{token}}` with verified business content and real URLs. Replace media slot divs with accessible responsive images or video using supplied/authorized assets. Do not publish slot labels.
4. Restyle tokens, typography, spacing, proportions, surfaces, image crops, and interactions for the business. Variant selection alone is not a distinct finished design.
5. If repeating a component, give its IDs and aria/data references unique values. Check section order, heading hierarchy, link targets, responsive behavior, and focus states after assembly.

## Composition choices
| Family | Variants |
| --- | --- |
| Hero | Split text/image; centered text/wide media; editorial with offset media |
| Benefits | Equal icon cards; uneven bento; photo beside stacked benefits |
| Services | Photo cards; numbered editorial rows; large feature with smaller cards |
| Testimonials | Equal cards; oversized quote with supporting quotes; scrollable rail |
| FAQ | Split heading/accordion; centered heading/two columns; wide stacked rows |
| CTA | Centered panel; split statement/actions |
| Footer | Brand with columns; compact horizontal; large closing statement |
| Navigation | Inline wrapping links; compact disclosure menu |
| Buttons | Solid; outline; pill |
| Social | Icon circles; labeled icons |

Use testimonials only when real attributable quotes exist. Do not invent stars, ratings, customer names, logos, or metrics. Include social links only for verified profiles. UI and logo icons are simple inline/external SVG symbols; no icon font or third-party script is required.

A composition can mix, for example, hero-split + benefits-bento + services-list + faq-wide + footer-compact. Another can use hero-editorial + benefits-split + services-photo + faq-columns + footer-statement. Preserve coherence within a page instead of choosing every possible style at once.

The preview themes and sample text are demonstration-only. Previews run locally and are generated in a temporary directory; no component catalog or placeholder content is deployed with a prospect site.
