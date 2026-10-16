# Research

Two situations. The business has a site, and the pitch is "yours is losing you customers, here is ours." Or the business has no site, and the brief is built from their socials, listings and the owner.

## They have a site: `npm run capture`

```
npm run capture -- https://their-site.com
npm run capture -- https://their-site.com https://www.yelp.com/biz/... https://www.facebook.com/...
```

Crawls their site (same origin, 12 pages by default), plus any single public pages you add, into `research/`:

| File | What it is | Use it for |
| --- | --- | --- |
| `facts.json` | Name, phones, emails, addresses, hours, socials, service lines, each with the URL it came from | BRIEF.md identity and verified facts |
| `pages/*.txt`, `pages/*.json` | Visible text and metadata per page (title, description, headings, JSON-LD, Open Graph) | Copy that is theirs to reuse, services they actually list |
| `images/`, `images.json` | Their larger images with alt text, dimensions and the page they sat on | Photo map; these are theirs, so they can be reused on the concept |
| `logo/` | Logo candidates from headers and anything named "logo" | Source for `npm run brand` |
| `design.json` | Their current design system as rendered: fonts, sizes, colours by role, radii, shadows, section map | Keep what is deliberate (a brand font, a brand colour), replace what is not |
| `screens/` | Desktop and mobile full-page screenshots of every page | Before and after |
| `current-site-audit.json`, `current-site-*.png` | Our audit run on their site, defects outlined and numbered | The pitch: "14 contrast failures, no tap targets, overflow on mobile" with pictures |
| `sources.json` | Every URL fetched, when, and whether it returned content | Know what was actually read |

Instagram and Facebook usually show a login wall to a headless browser; `sources.json` says so when it happens. Nothing here logs in or uses a third-party service.

## They have no site

Research is the agent's browsing plus what the owner sends. Record what you find in BRIEF.md with its source, and write "unknown" rather than guessing. The useful order:

1. Google Business Profile listing (name, category, hours, phone, address, photos, review count). Read it; do not scrape it into the site.
2. Social profiles: what they post, how they describe themselves, which photos are theirs.
3. Directory listings (Yelp, Nextdoor, Thumbtack, Angi) for services and the phrases customers use.
4. The owner: logo file, photos, the one thing they want the site to do.

Then `npm run brand -- public/assets/logo.svg` for colour, pick a direction from `docs/directions.md`, and build.

## Pitching an improvement

The capture gives you the before. Build the concept, run `npm run audit`, and you have the after in the same format: their audit next to ours, their screenshots next to ours. The numbers in `current-site-audit.json` (failures by check, per viewport) are the headline; the outlined screenshots are the proof.
