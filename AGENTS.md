# Prospect starter instructions

## Foundation
- Source: https://github.com/NickRoyOfficial/prospect-starter . This repository now uses React + TypeScript + Vite + Tailwind CSS with shadcn/ui and Lucide. Read BRIEF.md for the business and the current user request for scope.
- Keep the production shell in src/App.tsx empty until a business-specific design is authorized. Put assets in public/assets/. Keep copy, fonts, colors, hero, and composition specific to each prospect.
- Common controls are already in src/components/ui/. Reuse them instead of writing equivalent controls or rerunning initialization. components.json configures future shadcn additions; dependencies and tooling versions are locked in package-lock.json.
- The 27 components/ layouts are HTML/CSS references. Use npm run section -- --list for a concise inventory. Read and convert only selected variants into src/components/sections/. Do not mass-convert the catalog or load old DOM scripts into the React app.
- references/vanilla/ supports the separate legacy layout catalog. The catalog and src/dev/ UI preview are not production pages. The UI preview is available only during development at /?ui=1.
- Fill BRIEF.md with verified facts, source links, approved decisions, asset mapping, and deployment details. Avoid duplicate documentation.

## Work efficiently
- Reuse the pinned dependencies and lockfile. Run npm ci when dependencies are missing or the lockfile changed; do not reinstall otherwise. Do not add a framework or package for routine behavior already supported.
- Read only relevant files and ranges. Avoid repository dumps, repeated searches, and repeated documentation reads. Batch independent reads; keep dependent edits and writes sequential.
- Make targeted changes, preserve approved sections, and do not redesign unrelated work. Do not delegate unless explicitly requested.
- Where terminal push is unavailable, send multiple text files in one GitHub create_tree using inline content, create one commit, then update the branch against its expected head. Use blobs for binary assets. Do not commit each file separately.
- Use the existing browser/runtime. Report concrete limitations rather than repeatedly attempting the same unavailable installation. Keep updates and delivery concise.

## Design, content, and accessibility
- Produce professional, business-specific art direction. Shared controls and reference layouts do not define the final appearance. Vary typography, spacing, image treatment, proportions, colors, compositions, and purposeful motion.
- Verify facts and prefer supplied company photography. Inspect photos together, choose the asset map once, and optimize images before committing. Ask for genuinely missing imagery; use stock only when authorized and never present it as company work.
- Never invent reviews, quotes, ratings, credentials, guarantees, prices, services, service areas, statistics, or response times. Omit proof sections when verified material is unavailable. Use social links only for verified profiles.
- Replace every reference token and media slot before publishing. Placeholders belong only in the reference catalog.
- Use semantic HTML, labels, sufficient contrast, visible focus, readable text, comfortable touch targets, and responsive media. Account for navigation and safe areas in one-screen heroes using 100svh with a 100vh fallback; allow growth when content requires it.
- Prefer the existing shadcn controls for interaction and CSS for routine motion. Respect reduced motion; essential content must work without animation or hover. Import only needed icons and components.
- src/components/inquiry-form.tsx and src/hooks/use-inquiry-form.ts provide configurable inquiry handling. Pass a real authorized endpoint, explicit message recipient, or copy-only mode. Drafts are not sent automatically; endpoint acceptance is not proof of delivery. Never contact a prospect with a test inquiry.

## Verify and deploy
- Run npm run check, npm test, and npm run build after relevant source changes. Use npm run test:browser when interaction/responsiveness changes. Repeat only for new changes, failures, or unresolved concerns.
- The reusable browser checks cover the development controls across desktop, mobile, and short/reduced-motion viewports. Also inspect each actual business page at representative sizes; framework tests do not establish its design quality.
- GitHub holds source; Cloudflare hosts approved concepts. Keep prospects isolated and verify the intended repository, branch, remote, Worker name, and review URL. Preserve existing prospect stacks unless conversion is authorized.
- npm run deploy blocks the unchanged starter Worker name, builds the site, and deploys dist/ using Wrangler. In Cloudflare Git builds use an empty build command and npm run deploy as the deploy command. Do not deploy this shared starter unless requested.
- Commit authorized changes and verify the intended build on the live URL. Report unavailable checks, missing access, or deployment failures accurately. A commit alone does not prove deployment.
- Keep concepts noindex and clearly identify independent concepts until an official launch is authorized. Do not ask for permission already granted.
