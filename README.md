# Prospect starter

React + TypeScript + Vite + Tailwind CSS, with shadcn/ui and Lucide configured. Clone this foundation for each new prospect. The production shell starts empty; the look comes from a direction preset and a palette generated from the logo; the quality comes from an audit that measures the rendered page before anyone reviews a screenshot.

AGENTS.md is the workflow. This file is the map.

## Start a prospect

1. As soon as a build is authorised and its repository is known, populate that remote from this starter and verify the commit before design work. If it already contains the starter, reuse it.
2. For an empty approved target: `node scripts/start-prospect.mjs --repo owner/prospect --name "Business name" --dir /absolute/new-checkout`. It copies tracked source, configures the prospect name, remote and brief, and prepares one upload bundle (docs/github-bootstrap.md). It does not push by itself.
3. Node.js 22.12 or newer. `npm ci` only when dependencies are missing or changed; its `prepare` hook builds `dist/`.
4. Research: `npm run capture -- https://their-site.com` when they have one (docs/research.md). Fill BRIEF.md with sourced facts.
5. Look: pick a direction (docs/directions.md), set `data-direction` on `<html>`, run `npm run brand -- public/assets/logo.svg`.
6. Compose `src/App.tsx` from the React sections. Assets in `public/assets/`.
7. Verify: `npm run audit` until zero failures, then the rubric pass on the screenshots (docs/review-rubric.md). `npm run build`. Publish. Cloudflare defaults work: empty build command, `npx wrangler deploy`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server. Open its printed local URL. |
| `npm run dev -- --open /?ui=1` | Development-only shadcn control preview. |
| `npm run dev -- --open /?layouts=1` | Development-only React section preview; add `&variant=photo` or `&variant=editorial`. |
| `npm run audit` | Rendered-page audit at desktop, mobile and short viewports: cramped controls, touch targets, contrast, overflow, clipping, overlap, obscured controls, broken or distorted images, dead links, placeholders, focus rings, opened menus/selects/dialogs, design tells, copy. Annotated screenshots and a report in `test-results/audit/`. Exit 1 on any FAIL. `--path`, `--url`, `--no-states`, `--no-tells`, `--no-copy`, `--baseline`, `--scope`, `--json`. `npm run review` is an alias. |
| `npm run brand -- <logo>` | Palette from the logo (or `--primary "#hex"`), every pair solved for WCAG AA, written to `src/brand.css` with swatches in `test-results/brand/`. |
| `npm run capture -- <url> [urls]` | Rip an existing site into `research/`: facts with sources, text per page, images, logo candidates, their design system as rendered, screenshots, and our audit of their current site for the pitch. |
| `npm run promote -- --from <dir> --section <path>` | Bring a section from a finished prospect into `src/components/sections/promoted/`, refusing hardcoded colours, px, fonts and fixed radius/shadow classes. |
| `npm run corrections` | Group the corrections the hook has logged, by theme, to turn into checks and tokens (docs/corrections.md). |
| `npm run check` | TypeScript, script syntax, local resources, and placeholder checks. |
| `npm test` | Form-helper security, preview-server boundaries, the copy linter, and the audit against fixture pages with planted defects (needs an installed Chromium; skips otherwise). |
| `npm run build` | Type-check and build the production site into `dist/`. |
| `npm run preview` | Preview a production build locally. |
| `npm run test:foundation` | Full control tests after shared behaviour changes. An installed browser is required. |
| `npm run start:prospect -- --help` | Dependency-free prospect initializer and upload-bundle help. |
| `npm run catalog` | Separate visual browser for the 27 HTML/CSS layout references, port 8001. |
| `npm run section -- --list` | Concise reference inventory. A selected ID prints only its HTML; `--css` prints common and selected CSS. |
| `npm run ui:add -- component-name` | Add a missing shadcn control using the pinned CLI. Do not reinitialize. |
| `npm run deploy` | Block an unchanged starter name, build, then deploy `dist/` with Wrangler 4 and your Cloudflare authentication. |

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to a Chrome or Chromium binary when Playwright's own download is not installed. Nothing here downloads a browser.

## Where work belongs

- `src/App.tsx`: the actual business page. `src/main.tsx` mounts React.
- `src/index.css`: the token layer (spacing, control sizing, type scale, motion, shape) and base rules. Components read tokens; prospect builds do not add raw values.
- `src/brand.css`: colours, generated from the logo. Neutral until `npm run brand` runs.
- `src/directions.css`: five direction presets (`editorial`, `bold`, `warm`, `technical`, `refined`) selected with `data-direction` on `<html>`; also the `.reveal` motion utility (`src/hooks/use-reveal.ts`).
- `src/components/ui/`: 12 installed shadcn controls: button, input, label, textarea, card, accordion, dialog, sheet, navigation-menu, carousel, separator, select.
- `src/components/sections/layouts.tsx`: ready React section variants and interactions; see its README. `promoted/` holds sections harvested from finished builds.
- `src/components/inquiry-form.tsx`, `src/hooks/use-inquiry-form.ts`, `src/lib/form-utils.js`: configurable inquiry handling.
- `scripts/audit.mjs`, `scripts/audit/checks.js` (browser-side measurements), `scripts/audit/copy.mjs` (copy linter): the audit. Rules live here, with fixture cases in `test/fixtures/`.
- `scripts/brand.mjs`, `scripts/capture.mjs`, `scripts/promote.mjs`, `scripts/correction.mjs`: palette, research, promotion, correction capture.
- `docs/`: directions, review rubric, design tells, copy rules, research, corrections, workspace instructions for the Codex project, GitHub bootstrap.
- `tools/vale/`: the copy rules as a Vale package for linting markdown drafts, if Vale is installed.
- `components/`: 27 industry-neutral HTML/CSS layout references with a visual catalog. Convert selected ideas into React; do not paste HTML attributes or old DOM scripts into JSX unchanged.
- `references/vanilla/`: archived foundation used by the legacy layout catalog. Not copied into the production build.
- `src/dev/`: development-only previews, removed from production by Vite.
- `.codex/hooks.json`: registers the correction hook for Codex.
- AGENTS.md and BRIEF.md: the workflow and the prospect's source of truth.

## Forms

Compose labeled fields inside InquiryForm and pass an explicit config: `{mode:"endpoint", action:"https://…"}`, `{mode:"mailto", recipient:"…"}`, `{mode:"sms", recipient:"…"}`, or `{mode:"copy"}`. The hook can also be used without the shell for a custom layout. Native required/type validation applies; field names become message labels.

Endpoint mode posts FormData, checks HTTP acceptance, times out after 20 seconds, and shows errors without claiming delivery. The backend must provide validation, spam protection, actual delivery, and CORS when relevant. Mailto/SMS modes show a reviewable draft and a link; the visitor sends it. Copy mode offers selectable text when clipboard access is unavailable. Files require endpoint mode. No mode stores visitor information in local storage.

## Cloudflare

Use the approved prospect branch and repository root `/`. For Git builds leave the build command empty and keep the default deploy command `npx wrangler deploy`. The npm prepare hook builds `dist/` during dependency installation. `npm run deploy` is also available for local use. `wrangler.jsonc` serves `./dist`, not the source/public directory. Keep authentication outside Git. Confirm the live deployment after a successful commit/build.

The shared starter is intentionally undeployed and noindex. It includes no business claims, testimonials, company imagery, or page design. Review production content, metadata, concept disclosure, SEO/rendering needs, and the real form destination for an authorized official launch.

## Component provenance

The shadcn CLI registry was unreachable in the setup environment. Installed controls were therefore copied from the official shadcn/ui repository at a recorded commit, with import paths adapted. See THIRD_PARTY_NOTICES.md for provenance and the MIT license. They are actual shadcn source, not hand-built substitutes. `components.json` supports future normal CLI additions.

The copy rules and the Vale package derive from Hardik Pandya's stop-slop (MIT). The design-tell catalogue is adapted from a working catalogue by Sam Town. The cramped-control measurement follows impeccable's approach; the clipping, obscured-control and containing-block checks follow agnt's layout diagnostics.
