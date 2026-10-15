# Prospect starter

Reusable infrastructure and an optional component library for static prospect websites in any industry. The deployed starter page is intentionally empty. Choose from 27 layout variants as needed; no business copy, branding, or photos are assumed. No external runtime dependencies. See components/README.md.

## Start a prospect
1. Copy this repository into a separate prospect repository. If you enable GitHub's **Template repository** setting, use **Use this template** for each new business. Copying the files into an existing repository also works. If using git clone, set origin to the new prospect repository before pushing.
2. Fill in BRIEF.md with verified facts, approved design decisions, assets, source links, and the target deployment.
3. Change `name` in wrangler.jsonc to the approved Cloudflare Worker name. Keep assets in public/.
4. Design the page in public/index.html. Set project-specific CSS variables in public/css/tokens.css and put custom styles in public/css/site.css. Add its stylesheet link when you create it.
5. Run the commands below. Check desktop, mobile, keyboard interaction, and any feature used before deploying.

Requires Node.js 20 or newer. No npm install is needed for preview, checks, or tests.

| Command | Purpose |
| --- | --- |
| `npm run catalog` | Visual component library with variant, theme, and viewport controls at http://127.0.0.1:8001. |
| `npm run section -- --list` | List reusable layout IDs; select just the relevant source for each project. |
| `npm run dev` | Local preview at http://127.0.0.1:8000. Set PORT to change it. |
| `npm run check` | Syntax, local resource, markup, and configuration checks. |
| `npm test` | Draft URL, endpoint validation, and preview-server boundary tests. |
| `npm run deploy` | Deploy with Wrangler 4 using your Cloudflare authentication. Blocks the unchanged starter Worker name. |

Cloudflare Git builds: production branch is the prospect's approved branch, build command is empty, deploy command is `npm run deploy`, and repository root is `/`. Files under public/ are the static assets. Authentication belongs in Cloudflare or your environment, never in the repository.

## Shared files
- AGENTS.md: project standards and efficient agent workflow.
- BRIEF.md: the compact source of truth for each business.
- public/css/: reset, customizable tokens, and optional layout/behavior utilities.
- public/js/: optional UI behaviors and configurable form handling.
- scripts/: dependency-free preview and checks, plus the deployment launcher.
- test/: reusable foundation checks. These do not replace rendered browser QA.

## Optional UI hooks
Shared scripts do nothing when matching elements are absent. Use real buttons, labels, and descriptive accessible names in the page design.

| Feature | Markup contract |
| --- | --- |
| Toggle | Button `data-toggle="panel-id"` with `aria-expanded`; target has that ID and starts `hidden` when collapsed. Escape closes expanded panels. Page-specific CSS controls its presentation. |
| Dialog | Native `dialog id="dialog-id" data-dialog`; opener has `data-dialog-open="dialog-id"`; close button inside has `data-dialog-close`. Label the dialog with `aria-labelledby` or `aria-label`. Native Escape and focus management apply. |
| Gallery | An element with `id` and `data-gallery`. Design its child layout in site CSS. External buttons use `data-gallery-prev="id"` and `data-gallery-next="id"`. Supply accessible button labels and a gallery label. Supports keyboard arrows and native touch scrolling. |
| Reveal | Add `data-reveal` to a section or element. Content stays visible without JS and with reduced motion. |
| Accordion | Use native `details` and `summary`; no script required. |

## Forms
Use `form[data-form]` with labeled fields and a submit button. A `[data-form-status]` region is created if absent. Fields use their `name` values as message labels. No mode stores visitor details in the browser.

| Mode | Configuration and behavior |
| --- | --- |
| `data-form="endpoint"` | Explicit HTTPS `action` for an authorized backend. Posts FormData, checks HTTP acceptance, restores controls after errors, and times out after 20 seconds. The endpoint must handle spam protection, validation, delivery, and CORS where relevant. |
| `data-form="mailto"` | Set `data-recipient` to the business email; optional `data-subject`. Displays a reviewable draft and an email-app link. Sends nothing automatically. |
| `data-form="sms"` | Set `data-recipient` to the business phone. Displays a reviewable draft and messaging-app link. Device support varies. Sends nothing automatically. |
| `data-form="copy"` | Copies the inquiry or offers selectable text when clipboard access is unavailable. Sends nothing. |

Unknown or missing modes show a configuration error. Draft modes reject file inputs; use a real endpoint for uploads. No mode treats a demo interaction as a delivered inquiry. `prospect:form-success` fires only for an accepted endpoint response; `prospect:form-error` fires on an error.

Keep concept sites noindex and clearly identify independent concepts. Replace metadata and add the proper status disclosure as part of each business-specific design. The root-level scripts and documentation are outside the deployed public directory.
