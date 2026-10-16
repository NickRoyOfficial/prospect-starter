# Prospect starter instructions

## Foundation
- Source: https://github.com/NickRoyOfficial/prospect-starter . This repository now uses React + TypeScript + Vite + Tailwind CSS with shadcn/ui and Lucide. Read BRIEF.md for the business and the current user request for scope.
- Keep the production shell in src/App.tsx empty until a business-specific design is authorized. Put assets in public/assets/. Keep copy, fonts, colors, hero, and composition specific to each prospect.
- Common controls are already in src/components/ui/. Reuse them instead of writing equivalent controls or rerunning initialization. components.json configures future shadcn additions; dependencies and tooling versions are locked in package-lock.json.
- Reuse src/components/sections/layouts.tsx first: Hero (split/photo/editorial), CardGrid (cards/bento/rows), PhotoCard, SplitSection, SectionHeading, CallToAction, FooterLayout (columns/compact), FAQ, FeedbackCarousel, and InquiryDialogForm. Import only needed exports. Development previews: /?layouts=1&variant=split (also photo/editorial). The 27 components/ HTML references are optional composition ideas; do not reconvert existing React sections.
- references/vanilla/ supports the separate legacy layout catalog. The catalog and src/dev/ UI preview are not production pages. The UI preview is available only during development at /?ui=1.
- Fill BRIEF.md with verified facts, source links, approved decisions, asset mapping, and deployment details. Avoid duplicate documentation.

## Start immediately
- Once a build is authorized and its destination repository is known, populate that remote from this starter BEFORE research, dependency installation, asset processing, or page design. Verify the initial commit exists remotely. Do not wait until the completed website to push.
- If the repository already contains this starter, inspect it and reuse it. Preserve existing prospect work. Never overwrite another website or push prospect content to the starter.
- Check the available GitHub write path first. Prefer an existing template copy or working Git push. When CLI authentication is unavailable, use the connected GitHub API immediately rather than troubleshooting credentials. scripts/start-prospect.mjs prepares a separate checkout and one upload bundle without dependencies; see docs/github-bootstrap.md.

## Work efficiently
- Reuse the pinned dependencies and lockfile. Run npm ci when dependencies are missing or the lockfile changed; do not reinstall otherwise. Do not add a framework or package for routine behavior already supported.
- Read only relevant files and ranges. Avoid repository dumps, repeated searches, and repeated documentation reads. Batch independent reads; keep dependent edits and writes sequential.
- Make targeted changes, preserve approved sections, and do not redesign unrelated work. Do not delegate unless explicitly requested.
- Where terminal push is unavailable, send multiple text files in one GitHub create_tree using inline content, create one commit, then update the branch against its expected head. Use blobs for binary assets. Do not commit each file separately.
- Use an installed browser/runtime. Do not download a browser or add browser tooling for a prospect build. Use npm run review for one desktop/mobile/short screenshot pass and test affected interactions. If unavailable, use the hosted preview and state the limit.
- Keep scope to the requested page. Do not build new generators, audit systems, component catalogs, or abstractions during a prospect build. Avoid full-file rewrites and serial per-file uploads. Keep updates and delivery concise.

## Design, content, and accessibility
- Produce professional, business-specific art direction. Shared controls and reference layouts do not define the final appearance. Vary typography, spacing, image treatment, proportions, colors, compositions, and purposeful motion.
- Verify facts and prefer supplied company photography. Inspect photos together, choose the asset map once, and optimize images before committing. Ask for genuinely missing imagery; use stock only when authorized and never present it as company work.
- Never invent reviews, quotes, ratings, credentials, guarantees, prices, services, service areas, statistics, or response times. Omit proof sections when verified material is unavailable. Use social links only for verified profiles.
- Replace every reference token and media slot before publishing. Placeholders belong only in the reference catalog.
- Use semantic HTML, labels, sufficient contrast, visible focus, readable text, comfortable touch targets, and responsive media. Account for navigation and safe areas in one-screen heroes using 100svh with a 100vh fallback; allow growth when content requires it.
- Prefer the existing shadcn controls for interaction and CSS for routine motion. Respect reduced motion; essential content must work without animation or hover. Import only needed icons and components.
- src/components/inquiry-form.tsx and src/hooks/use-inquiry-form.ts provide configurable inquiry handling. Pass a real authorized endpoint, explicit message recipient, or copy-only mode. Drafts are not sent automatically; endpoint acceptance is not proof of delivery. Never contact a prospect with a test inquiry.

## Verify and deploy
- Run npm run check and npm run build once after page implementation, plus targeted interaction checks and npm run review. Run npm test and npm run test:foundation when shared controls, hooks, scripts, or dependencies change, not for every page composition or styling change. Repeat only checks affected by a fix. npm run verify is the full foundation check.
- The reusable browser checks cover the development controls across desktop, mobile, and short/reduced-motion viewports. Also inspect each actual business page at representative sizes; framework tests do not establish its design quality.
- GitHub holds source; Cloudflare hosts approved concepts. Keep prospects isolated and verify the intended repository, branch, remote, Worker name, and review URL. Preserve existing prospect stacks unless conversion is authorized.
- Keep Cloudflare Git build settings compatible with the existing default: empty build command, npx wrangler deploy. package.json prepare runs npm run build during dependency installation, so dist/ exists before deployment. Do not instruct the user to change working dashboard settings. npm run deploy remains an optional local build-and-deploy command. Set the prospect Worker name; never deploy the shared starter unless requested.
- Commit authorized changes and verify the intended build on the live URL. Report unavailable checks, missing access, or deployment failures accurately. A commit alone does not prove deployment.
- Keep concepts noindex and clearly identify independent concepts until an official launch is authorized. Do not ask for permission already granted.

## Testimonial UI standard
- Use TestimonialCards from src/components/sections/layouts.tsx for a small set of verified reviews. It composes the installed shadcn Card and CardContent. Default to three compact equal-height cards on desktop, two on tablets, and a readable single-column mobile stack.
- Include a restrained quote mark, 16–18px review text with comfortable line height, and bottom-aligned author attribution. Use only real portraits or neutral initials. Dates or roles must come from the source. Never invent ratings, stars, identities, review counts, or endorsements.
- Keep section headings proportionate to the cards. Avoid giant full-width slides for a few short reviews, excessive empty space, floating/overlapping controls, and developer-facing source notes in the main visual hierarchy.
- Use carousels only when the number of reviews or the approved composition warrants them. Controls must be in a separate normal-flow row, at least 44px, with visible focus/hover states, meaningful accessible names, and no inherited translate offset. Preserve touch/keyboard interaction and reduced-motion behavior.
- Adapt colors, borders, corner radius, and spacing to each business without weakening this hierarchy. The standard is a quality baseline, not one identical section copied everywhere.
