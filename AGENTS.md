# Prospect starter instructions

## Start here
- Foundation source: https://github.com/NickRoyOfficial/prospect-starter
- This is an industry-agnostic static website foundation, not a page template.
- Read BRIEF.md and the relevant source before editing. Treat the current user request as authoritative.
- Keep page composition, hero, imagery, fonts, colors, and copy specific to the business. Do not add a preset hero or industry sections to the shared starter.
- Populate BRIEF.md as facts, source links, assets, and decisions become available. Keep it brief and current.
- Use GitHub for source and the approved Cloudflare project for hosting. Do not substitute another platform without instruction.

## Work efficiently
- Reuse public/css and public/js. Load only relevant files and ranges. Avoid repository dumps, repetitive searches, dependency installation, or repeated checks without a reason.
- Use native HTML, CSS, browser APIs, and the existing Node scripts first. Do not add frameworks or libraries for routine UI.
- Make targeted changes and preserve approved work. Do not redesign unrelated sections.
- Batch independent reads. Keep dependent changes and GitHub writes sequential. Do not delegate unless explicitly requested.
- Where terminal push is unavailable, commit multiple text files together using GitHub create_tree entries with inline content. Use blobs only for binary assets. Create one commit, then update the branch with its expected head SHA. Do not upload every text file in a separate commit.
- Reuse available browser/runtime tools. Do not repeatedly install a missing browser. Report an actual verification limitation accurately.
- Keep progress and final responses short. Stop when the authorized scope is complete and checks pass.

## Business accuracy and assets
- Use verified business facts and supplied assets. Never invent services, service areas, reviews, ratings, credentials, guarantees, prices, or response times.
- Inspect supplied photos together and establish an asset map once. Optimize them before committing and use descriptive filenames.
- Ask for genuinely missing business photography before implementing photo-led sections. Source stock only when authorized; never present it as company work.
- Obtain missing repository and deployment details before publishing. Existing authorization persists; do not ask repeatedly.
- Do not contact a prospect or send a test inquiry to a live destination.

## Design and accessibility
- Produce professional, business-specific layouts. Use the shared infrastructure without imposing one visual design across industries.
- Implement semantic HTML, readable text, adequate contrast, visible focus, labeled fields, accessible controls, responsive media, and comfortable touch targets.
- Build page-specific hero layouts independently. If a one-screen hero is requested, use 100svh with a 100vh fallback, account for navigation and safe areas, and prevent ordinary viewport clipping. Allow growth when content or enlarged text requires it.
- Use lightweight motion and respect reduced motion. Essential content must remain available without animation or hover.
- Use native details for simple accordions and dialog for modals. Optional shared scripts activate only on matching data attributes.
- Forms need a real, explicitly configured destination. Never simulate delivery or display success before acceptance. Draft modes prepare messages; the visitor sends them.

## Verify and deliver
- Run npm run check and npm test after relevant code changes. Run focused follow-up checks only after a failure or additional change.
- Inspect representative desktop, mobile, and short viewports when browser controls are available. Verify affected menus, forms, galleries, dialogs, keyboard operation, and reduced motion. Report checks that could not be completed.
- Before deployment, confirm the target repository/branch and replace the starter Worker name with the approved project's name.
- Keep each prospect in its own repository. After cloning the starter, set origin to the approved prospect repository before pushing.
- Commit authorized work. A successful commit does not establish a successful deployment; verify the intended build and live URL.
- Keep the starter itself undeployed unless requested. Keep concepts noindex and clearly identified until an official launch is authorized.
