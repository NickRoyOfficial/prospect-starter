# Prospect starter

A React + Vite + Tailwind v4 + shadcn/ui foundation for one-page concept sites for local businesses. Each prospect gets a copy. The shell in `src/App.tsx` starts empty. The look comes from a direction preset plus a palette generated from the logo; the quality comes from an audit that runs before anyone looks at a screenshot.

Read this whole file. BRIEF.md is the prospect's source of truth. Current user messages override both.

## Rules that never change

- Facts. Never invent reviews, quotes, ratings, credentials, guarantees, prices, services, service areas, statistics, response times, awards, "free estimates" or "trusted by" claims. A claim with no source on the page is cut, not softened. Social links only for verified profiles. Write "unknown" in BRIEF.md rather than guess.
- Assets. Prefer the business's own photography and the real logo file. Never present stock or generated imagery as the business, its people or its work. Never render a logo as styled text. Replace every placeholder and media slot before publishing.
- Isolation. GitHub holds source, Cloudflare hosts concepts. One repository and one Worker per prospect, named for the business. Never push prospect content to the starter. Concepts stay noindex and labelled as concepts until an official launch is authorised.
- Contact. Never contact a prospect, never send a test inquiry, never ask for passwords or secrets in chat. Forms get a real authorised destination, or copy mode.
- Scope. No new frameworks, generators, catalogues or abstractions during a prospect build. Targeted edits. Preserve approved sections.

## Workflow

### 1. Start

Once a build is authorised and the destination repository is known, populate it from this starter and verify the first commit exists remotely before any research or design (`node scripts/start-prospect.mjs --help`, docs/github-bootstrap.md). If the repository already holds this starter, reuse it. Where terminal push is unavailable, use the connected GitHub API: one tree with inline text files and blobs for binaries, one commit, branch updated against its expected head. Run `npm ci` only when node_modules is missing or the lockfile changed.

Finish when: the remote has the starter commit, and BRIEF.md names the repository, branch, Worker and conversion goal.

### 2. Research

With an existing site: `npm run capture -- <url> [more public urls]`, then read `research/facts.json`, `research/design.json` and `research/current-site-audit.json` (docs/research.md). Without one: their listings, socials and whatever the owner sent. Every fact in BRIEF.md carries its source. Inspect supplied photos once and write the asset map. Ask for missing photos and the logo now, naming the subjects you need. One focused research pass; expand only to close a specific gap.

Finish when: BRIEF.md identity, verified facts, assets and pending items are filled in, and the open questions are listed rather than guessed.

### 3. Plan (checkpoint)

Pick a direction from docs/directions.md and give one sentence of reasoning. Run `npm run brand -- public/assets/logo.svg` (or `--primary "#hex"` when there is no usable logo) and look at `test-results/brand/swatches.html`. Write one compact plan: direction, palette, hero (variant, photo, headline, primary action, form), section list by layout family, photo map, open questions. Present it and wait. "Build" authorises everything that follows; do not ask again. Targeted revisions later do not restart the plan.

Finish when: the user says build, or the direction was already approved.

### 4. Build

Set `data-direction` on `<html>` in index.html and load that direction's fonts (docs/directions.md). Compose `src/App.tsx` from `src/components/sections/layouts.tsx` (Hero, CardGrid, PhotoCard, SplitSection, TestimonialCards, FAQ, CallToAction, FooterLayout, InquiryDialogForm) and the shadcn controls in `src/components/ui/`. The 27 HTML references in `components/` are composition ideas, not code to paste. Assets go in `public/assets/`, sized for the web. Copy follows docs/copy-rules.md; the look follows docs/design-tells.md. No hex, px or font literal inside a section: tokens from `src/index.css`, `src/brand.css` and `src/directions.css` only. Heroes fit one viewport (100svh with a 100vh fallback) and grow when content needs it; nothing is hidden with overflow clipping. Service businesses usually get a compact inquiry or booking form in the hero, matched to how they actually sell.

Finish when: every section renders with real content and `npm run check` passes.

### 5. Verify (the loop)

1. `npm run audit`. Fix every FAIL. Run again. Up to four rounds. If a round adds failures, revert it and take the other route. A FAIL you believe is wrong is a bug in `scripts/audit/checks.js` or `scripts/audit/copy.mjs`: fix the check and add a fixture case, never work around it. Warnings are decisions: resolve them or write the reason in BRIEF.md.
2. Open the screenshots in `test-results/audit/` (desktop-full, mobile-full, short, and every `*-open-*`) and review against docs/review-rubric.md. Write the located defects, fix them, re-run the audit, look again. Stop when a pass finds nothing, or after three passes; then report what is left.
3. Cycle every reversible control open and closed once by hand: menu, select, dialog, drawer, accordion, carousel, and the form with an empty required field.
4. `npm run build`. Run `npm test` only when shared controls, hooks, scripts or dependencies changed.

Finish when: zero FAIL across desktop, mobile and short; a rubric pass with no defects that names the screenshots it looked at; build green.

### 6. Deliver (checkpoint)

Commit authorised changes in one commit. Keep Cloudflare's Git build settings as they are: empty build command, `npx wrangler deploy`; the `prepare` hook builds `dist/`. Set the prospect's Worker name. Confirm the live URL shows this build; a push is not a deployment. Report the link, the direction, the audit totals, and anything unverified, in a few sentences. Not code, not plans, not logs.

Finish when: the review URL opens the intended build.

## How rules change here

Corrections are logged automatically (`.codex/hooks.json` runs `scripts/correction.mjs`; see docs/corrections.md). `npm run corrections` groups them by theme. A theme seen three times becomes, in this order of preference: a check in `scripts/audit/checks.js` or `scripts/audit/copy.mjs` with a case in `test/fixtures/defects.html`; a token or base rule in `src/index.css` or a preset value in `src/directions.css`; a sentence in this file. This file holds only what code cannot check. Do not add component names, pixel values or one site's incident here. Keep it under 32 KiB; Codex truncates past that.

## Promoting a section

A section from a finished prospect joins the starter through `npm run promote -- --from <prospect dir> --section <path>`. It refuses hardcoded colours, px sizes, font literals and fixed radius or shadow classes. Preview the section in `src/dev/section-showcase.tsx`, run the audit under each direction, then list it in `src/components/sections/promoted/README.md`.

## Efficiency

Read only the files the step needs. Batch independent reads; keep dependent edits sequential. One research pass, one plan, one build, the verify loop, one delivery. No subagents unless asked. Progress updates only for findings, blockers and decisions.
