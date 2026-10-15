# Prospect starter

React + TypeScript + Vite + Tailwind CSS, with shadcn/ui and Lucide already configured. Clone this foundation for each new prospect, then create the business-specific design. The production shell starts empty.

## Start a prospect
1. Copy this repository into the approved prospect repository. GitHub's optional Template repository setting enables Use this template. When cloning with Git, change origin before pushing prospect work.
2. Use Node.js 22.12 or newer and run `npm ci` once. The dependency versions are pinned and package-lock.json is committed.
3. Fill BRIEF.md and set the approved Worker name in wrangler.jsonc.
4. Design src/App.tsx and project-specific sections. Customize src/index.css and use assets under public/assets/.
5. Check the actual page, run the relevant commands below, and deploy to the approved target.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite development server. Open its printed local URL. |
| `npm run dev -- --open /?ui=1` | Development-only shadcn control preview. |
| `npm run check` | TypeScript, script syntax, local resources, and placeholder checks. |
| `npm test` | Form-helper security, preview-server boundaries, and reference-catalog tests. |
| `npm run build` | Type-check and build the production site into dist/. |
| `npm run preview` | Preview a production build locally. |
| `npm run test:browser` | Desktop/mobile/short viewport control tests. Install Chromium once with `npx playwright install chromium` if needed. An existing binary can be supplied via PLAYWRIGHT_CHROMIUM_EXECUTABLE. |
| `npm run catalog` | Separate visual browser for 27 HTML/CSS layout references, port 8001. |
| `npm run section -- --list` | Concise reference inventory. A selected ID prints only its HTML; `--css` prints common and selected CSS. |
| `npm run ui:add -- component-name` | Add a missing shadcn control using the pinned CLI. Do not reinitialize. Requires access to the shadcn registry. |
| `npm run deploy` | Block an unchanged starter name, build, then deploy dist/ with Wrangler 4 and your Cloudflare authentication. |

## Where work belongs
- src/App.tsx: the actual business page. src/main.tsx mounts React.
- src/components/ui/: 12 installed shadcn controls: button, input, label, textarea, card, accordion, dialog, sheet, navigation-menu, carousel, separator, select.
- src/components/sections/: add selected, business-specific React sections as needed.
- src/index.css: Tailwind imports, editable semantic theme variables, focus, reduced-motion, and touch defaults. Put the dark class on the document root for dark sites so overlays share the theme.
- src/components/inquiry-form.tsx: optional form shell with configurable behavior. src/hooks/use-inquiry-form.ts and src/lib/form-utils.js handle drafts and endpoint acceptance.
- components/: 27 industry-neutral HTML/CSS layout references with a visual catalog. Convert selected ideas into React; do not paste HTML attributes or old DOM initialization scripts into JSX unchanged.
- references/vanilla/: archived foundation used by the legacy layout catalog. It is not copied into the production build.
- src/dev/ui-showcase.tsx: development-only controls preview, removed from production by Vite.
- AGENTS.md and BRIEF.md: efficient workflow instructions and the prospect's source of truth.

## Forms
Compose labeled fields inside InquiryForm and pass an explicit config: `{mode:"endpoint", action:"https://…"}`, `{mode:"mailto", recipient:"…"}`, `{mode:"sms", recipient:"…"}`, or `{mode:"copy"}`. The hook can also be used without the shell for a custom layout. Native required/type validation applies; field names become message labels.

Endpoint mode posts FormData, checks HTTP acceptance, times out after 20 seconds, and shows errors without claiming delivery. The backend must provide validation, spam protection, actual delivery, and CORS when relevant. Mailto/SMS modes show a reviewable draft and a link; the visitor sends it. Copy mode offers selectable text when clipboard access is unavailable. Files require endpoint mode. No mode stores visitor information in local storage.

## Cloudflare
Use the approved prospect branch and repository root `/`. For Git builds leave the build command empty and set deploy command to `npm run deploy`; the deploy script performs the build. wrangler.jsonc serves `./dist`, not the source/public directory. Keep authentication outside Git. Confirm the live deployment after a successful commit/build.

The shared starter is intentionally undeployed and noindex. It includes no business claims, testimonials, company imagery, or page design. Review production content, metadata, concept disclosure, SEO/rendering needs, and the real form destination for an authorized official launch.

## Component provenance
The shadcn CLI registry was unreachable in the setup environment. Installed controls were therefore copied from the official shadcn/ui repository at a recorded commit, with import paths adapted. See THIRD_PARTY_NOTICES.md for provenance and the MIT license. They are actual shadcn source, not hand-built substitutes. components.json supports future normal CLI additions.
