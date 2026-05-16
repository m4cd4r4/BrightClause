# BrightClause v3 Landing Reskin Brief

Open this in a **fresh Claude Code session** in the worktree root. Do not carry context from any prior session.

## First action: rebase before doing anything else

This worktree was created from `origin/master` at scaffold time. Other PRs may have merged since. Before reading anything else or writing any code:

```bash
git fetch origin master --quiet
git rebase origin/master
```

Fast-forward expected. If conflicts, resolve them now against current master.

## The problem

The BrightClause v3 fast-reskin took every product surface onto the v3 design system (Batches 1-4, all merged and live: dashboard, documents, analytics, obligations, graph, search, compare, deals). The marketing landing at `/` (`frontend/src/app/page.tsx`) was deliberately excluded from that reskin and is still the original v1 marketing page. Batch 4 dropped the v1 fonts, so it now renders in Geist instead of the old Cormorant serif, but its layout, chrome, colour and motion are still v1. The v3 app shell also still shows a hardcoded `§` glyph placeholder in the sidebar instead of the real BrightClause logo. This is the post-reskin follow-on: bring the landing into the v3 visual language and wire the real logo into the design.

## Source of truth (read these BEFORE designing or coding, in order)

1. [docs/redesign/BRIEF.md](docs/redesign/BRIEF.md) - the locked v3 design system. Typography (Geist only, no serif anywhere in the app), colour tokens (dark default), light theme (now shipped, reachable via the `html.light` toggle), elevation (two shadow tiers, no glassmorphism, no card gradients), radius, spacing scale, and the motion budget: **one delightful moment per surface, every motion has a reason**.
2. [frontend/src/styles/v3-tokens.css](frontend/src/styles/v3-tokens.css) - the real `--v3-*` tokens, the `html.light .v3` light variant, and the v3 component classes (`.v3-btn`, `.v3-card`, `.v3-table`, `.v3-pill`, sidebar/topbar). Reuse these, do not invent parallel tokens.
3. [frontend/src/components/v3/primitives.tsx](frontend/src/components/v3/primitives.tsx) - reusable v3 components (`PageHeader`, `Section`, `KpiCard`, `RiskPill`, `HeatmapCell`, `EntityChip`). Reuse where they fit; the landing may need new landing-only presentational components, which is fine, but they must consume `--v3-*` tokens.
4. [frontend/src/components/v3/shell.tsx](frontend/src/components/v3/shell.tsx) - the `V3Shell`. Lines ~46-53 hardcode a `§` glyph box as the brand mark. That placeholder is what gets replaced with the real logo.
5. [docs/v1-audit/AUDIT.md](docs/v1-audit/AUDIT.md) - the "Cross-cutting issues" and "Direction for the v2026 redesign" sections frame the marketing-vs-product positioning and the typography/colour direction. The landing is the marketing surface; honour that framing.
6. [frontend/src/app/page.tsx](frontend/src/app/page.tsx) - the current v1 landing. Inventory every section, CTA, link, feature and motion before touching anything. This is a **rendering reskin, not a content rewrite**: every section, every CTA, every feature claim, the hero video, the screenshot showcase, the GitHub link, the clause-type list and the trust section must survive identically in v3 form.
7. [docs/redesign/PROJECT-PLAN.md](docs/redesign/PROJECT-PLAN.md) - context only: the core v3 app reskin is complete. This landing reskin is a separate follow-on project and does not re-open Batches 1-4.

If anything in this brief contradicts those source files, the source files win.

## What's in scope

- `frontend/src/app/page.tsx` reskinned to the v3 design system: v3 tokens, Geist type scale, two-tier elevation, v3 radius/spacing, dark default with the now-shipped light theme working, exactly one motion moment for the surface (the existing framer-motion stays a dependency; use it with restraint, not 10 competing animations).
- The landing-only child components it composes, reskinned to v3 tokens: `frontend/src/app/hero-visual.tsx`, `frontend/src/components/HeroVideoPlayer.tsx`, `frontend/src/components/ScreenshotShowcase.tsx`, and the `frontend/src/components/demo-video/` set including its `styles.ts` (resolve the hardcoded `'Cormorant Garamond'` font string there to the v3/Geist stack - it is captured in `docs/CLAUDE-TODO.md` and is in scope now because it is landing-only).
- The real logo wired in: replace the `§` placeholder in `frontend/src/components/v3/shell.tsx` with `frontend/public/logo-minimal.png` (the clean gold section-mark) next to the BrightClause wordmark, and use the logo properly in the new v3 landing nav and hero. The shell edit is the **single sanctioned shared-component change** in this work; keep it minimal and additive (logo swap only, no structural shell change).
- Additive-only token or utility additions in `frontend/src/app/globals.css` or `frontend/tailwind.config.ts` if a landing-specific need arises; never modify an existing `--v3-*` token value or a v3 primitive's public signature.

## Out of scope (do NOT modify)

- The backend, any API call, data fetching or feature behaviour.
- Any app route or its files (`/dashboard`, `/documents/**`, `/analytics`, `/obligations`, `/search`, `/compare`, `/deals`, `/documents/[id]/graph`) - Batches 1-4 are final.
- The public signatures of `frontend/src/components/v3/primitives.tsx` and the structure of `V3Shell` beyond the logo swap.
- `docs/redesign/BRIEF.md` and `AUDIT.md` content (read-only). One status note may be added to `PROJECT-PLAN.md` saying the landing reskin is a post-reskin follow-on and the core v3 reskin remains complete.
- The pre-existing mobile-393 shell sidebar overflow logged in `docs/CLAUDE-TODO.md`. It is a separate future responsive pass. Do not attempt a responsive sidebar here.
- Never stage `frontend/nul`, `frontend/public/sw.js`, `frontend/public/workbox-*.js`, or `design/`.

## What "good" looks like

- `brightclause.com/` reads as a top-quartile 2026 SaaS marketing landing in the v3 visual language: Geist throughout, no serif, four-tier dark surface with real elevation, the v3 gold accent for primary actions only, v3 radius and spacing, the real logo in the nav and hero.
- Every v1 section, CTA, feature, the hero video, the screenshot showcase, the clause-type list, the trust section and the GitHub link are present and functional, just rendered in v3.
- Exactly one deliberate motion moment for the landing. No decorative animation pile-up.
- The light theme works on the landing through the existing `html.light` toggle, surfaces stay legible (no white-on-white, no dark token leak).
- The v3 app shell sidebar shows the real `logo-minimal.png`, not the `§` placeholder, on every app route.
- No Cormorant Garamond anywhere in the built bundle, including the demo-video component.
- `cd frontend && npm run build` passes clean. A fresh-context opus code review returns OVERALL PASS. `/design-review` is SHIP READY.

## Required deliverables

1. A short plain-text design rationale before any code: the section-by-section inventory of the v1 landing proving nothing is lost, the v3 mapping approach (which v3 tokens/primitives each section uses), the single chosen motion moment, and the logo wiring (which asset, where in the shell and the landing).
2. The reskin, scoped to the in-scope files only.
3. Mandatory writer plus fresh-context opus Code Reviewer loop: after implementing, dispatch a fresh-context opus reviewer given only the diff and this brief. It must verify every v1 section/CTA/feature/link/video is preserved, the reskin uses real `--v3-*` tokens (no parallel token system, no glassmorphism, no card gradients), the logo is correctly wired with no broken asset path, the light theme is coherent, no Cormorant in the bundle, build clean, scope correct, no app route or primitive signature touched. Fix every defect. Re-review to OVERALL PASS. Do NOT open the PR until an opus review returns PASS.
4. `cd frontend && npm run build` clean before commit.
5. `/design-review` after the change: verify the landing at wide-desktop, laptop and tablet against the v3 design system and the preserved v1 content, and spot-check the v3 logo in the app shell. chrome-devtools MCP may be unavailable; the Playwright fallback is acceptable. Local backend port 8002 is firewalled from the dev box so any data-backed embed renders empty - that is expected and accepted; real-data verification is the post-merge production check.

## Suggested workflow

1. Rebase (first action above).
2. Read all seven source-of-truth items. Inventory the v1 landing section by section.
3. Run `/design-brief` to lock the landing direction inside the v3 system before building.
4. Write the rationale.
5. Implement: landing reskin + landing child components + demo-video Cormorant fix + the single shell logo swap.
6. `npm run build` clean.
7. Fresh-context opus reviewer, diff plus brief only. Fix, re-review to PASS.
8. `/design-review` at wide/laptop/tablet plus the shell logo spot-check.
9. Commit (explicit `git add <path>` only, never `git add -A` or `git add .`), push, open one PR.
10. Merge via the git-integration path (see Constraints), verify on production across the landing and a spot-check of the app routes.
11. Resolve the demo-video Cormorant item in `docs/CLAUDE-TODO.md`; add the PROJECT-PLAN follow-on status note; print the final status report.

## Constraints

- One PR. Branch: `feat/v3-landing-reskin`.
- Explicit `git add <path>` only. Never `git add -A` or `git add .`. Never stage `frontend/nul` or the PWA artefacts.
- DEPLOY DISCIPLINE (incident-derived, non-negotiable): NEVER run `vercel --prod` or `vercel deploy --prod`. Ship ONLY via PR to master then Vercel git-integration auto-deploy. Before merging, note the current good production deployment id for instant rollback. After merge, the manual-alias stickiness footgun WILL recur: it has recurred on ALL FOUR prior batches. Expect it. Confirm the new git-integration deployment via the GitHub deployments API (its `ref`/`sha` must equal the merge commit), then run `vercel alias set <git-production-deployment> brightclause.com` ONCE, pointing only at the CI-built deployment, never a CLI build. Re-verify on brightclause.com directly.
- PROD VERIFICATION GOTCHA: verify on brightclause.com directly (preview is Vercel-auth-walled, accepted). If any API-backed view returns 502, do NOT assume a frontend bug. Check `https://api.brightclause.com/health` TLS cert CN must be api.brightclause.com not donnacha.app, and on root@45.77.233.102 the nginx vhost per project memory `project_nginx_conf_regeneration_drops_vhost.md`, before assuming a frontend bug.
- British English. No em-dashes, no en-dashes, no ellipsis character. Short direct sentences.

## Out-of-scope follow-ups (capture, don't build)

If you spot problems beyond scope, append them to [docs/CLAUDE-TODO.md](docs/CLAUDE-TODO.md). Do not fix inline. The mobile-393 responsive sidebar pass already captured there remains the largest known follow-up and is explicitly not this work.

## Why this brief is structured this way

The v3 app reskin succeeded because every batch inventoried the existing behaviour before writing and ran a fresh-context opus reviewer on the diff. The landing is content-dense marketing: the single biggest risk is silently dropping a section, CTA or the hero video while restyling, so the inventory-first plus reviewer loop is mandatory here too. The deploy and nginx rules exist because production drifted to a rejected design and the API broke from infra recurrences during the app reskin; the alias-stickiness footgun has now recurred every single batch, so it is a step to plan for, not a risk to watch.