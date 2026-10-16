# Direction presets

A direction is the look: typography, shape, density, surface and motion. Colour is separate (`npm run brand`). Pick one direction per prospect, set it on the root element, and compose from there. Do not invent a type system, a radius or a shadow recipe per site; tune the preset's tokens if the brief needs it, in `src/directions.css`, with a reason in BRIEF.md.

```html
<html lang="en" data-direction="warm">
```

| Direction | Feels like | Fits | Display face | Shape | Density |
| --- | --- | --- | --- | --- | --- |
| `editorial` | A good magazine. Serif headings, air, hairlines | Law, accounting, consulting, architecture, clinics, high-ticket services | Newsreader + Source Sans 3 | 4px radius, hairlines, no shadow | Generous |
| `bold` | A hardware store that knows its trade. Heavy grotesk, square, solid borders | Trades, gyms, auto, contractors, movers, roofing | Archivo | 0 radius, 2px borders | Dense |
| `warm` | A place you would take your kids. Rounded sans, soft corners, paper lift | Bakeries, childcare, pets, family services, wellness, cafes | Nunito | 16px radius, 24px cards, soft shadow | Medium |
| `technical` | A spec sheet done well. Neutral sans, mono labels, hairline grid | IT, engineering, HVAC, electrical, labs, logistics | IBM Plex Sans + Plex Mono labels | 6px radius, hairlines | Compact |
| `refined` | A boutique hotel lobby. Light geometric sans, wide-tracked small labels, lots of air | Salons, spas, boutiques, real estate, interiors, photographers | Jost + Manrope | 2px radius, thin lines | Very generous |

## Fonts

Each preset names its faces with system fallbacks, so the page works without a font load. To use the named faces, add the matching link in `index.html` (one per site, not per section):

```html
<!-- editorial -->  <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,600&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
<!-- bold -->       <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap" rel="stylesheet">
<!-- warm -->       <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet">
<!-- technical -->  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<!-- refined -->    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Manrope:wght@400;600&display=swap" rel="stylesheet">
```

Two faces maximum per site. A serif accent sprinkled onto a sans system is the single most recognisable template tell; if the brand wants a serif, use `editorial`, where the serif is the system.

## What a direction sets

Everything a component reads: `--font-display`, `--font-sans`, `--weight-display`, `--tracking-display`, `--leading-display`, `--text-display`, `--radius` and `--radius-card`, `--section-space`, `--card-gap`, `--card-pad`, `--control-pad-x`, `--border-card`, `--shadow-lift`, `--motion-*`, `--reveal-distance`. The full list and defaults are at the top of `src/index.css`. Sections in `src/components/sections/` and the shadcn controls consume these, so switching the attribute restyles the whole page.

## Choosing

1. Read the brief: what the business sells, who buys it, and the photography available.
2. Pick the direction whose "fits" column matches, or whose feel matches when the industry is not listed. Record the choice and one sentence of reasoning in BRIEF.md under Approved direction.
3. Run `npm run brand -- public/assets/logo.svg` for colour.
4. Compose. Vary the layout families, not the type system.

Across a batch of prospects, do not give consecutive sites the same direction and accent hue; the point of five presets is that the portfolio does not look like one template. If the last three builds were `bold`, the fourth is not.

## Tuning

Allowed, per site, in `src/directions.css` under a prospect-specific override: `--section-space`, `--radius` (within the preset's family: do not give `bold` a 24px radius), `--text-display`. Not allowed: a second display face, a third radius, a new shadow recipe, a gradient text fill, uppercase headings. The audit flags those as tells.

## Motion

Each direction sets durations and a reveal distance. Add `className="reveal"` to a section and call `useReveal()` once in `App.tsx`; elements fade and rise as they enter the viewport, once, with transform and opacity only, and reduced-motion users see them immediately. That is the whole motion system. A marquee, a parallax or a scroll-driven animation is a per-prospect decision with a reason, not a default.
