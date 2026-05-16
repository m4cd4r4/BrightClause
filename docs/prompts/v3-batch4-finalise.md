# BrightClause v3 Batch 4 — Finalise (analytics promote, light theme, font drop, cleanup)

Open this in a **fresh Claude Code session** in this worktree root. Do not carry context from any prior session.

## First action: rebase before doing anything else

This worktree was branched from `origin/master` at scaffold time. Batch 3 (search + compare + deals) merged just before this was scaffolded. Before reading anything else or writing any code:

```bash
git fetch origin master --quiet
git rebase origin/master
```

Fast-forward expected. If conflicts, resolve them now against current master.

## The problem

The BrightClause v3 fast-reskin is one batch from done. Foundation, Batch 1 (`/dashboard`, `/obligations`), Batch 2 (`/documents/[id]`, `/documents/[id]/graph`) and Batch 3 (`/search`, `/compare`, `/deals`, `/deals/[id]`) are all merged and live in the v3 design system on brightclause.com. Two things remain that every prior batch was forbidden from touching because they remove the v1 fallbacks: the Analytics pilot still lives at the temporary `/analytics-v2` route while the real `/analytics` still renders the dated v1 page, and the v1 fonts (Cormorant Garamond, DM Sans) are still imported app-wide. **This batch is LAST by design** - it deletes the v1 escape hatches, so it cannot run before Batches 1-3 are confirmed live (they are).

## Source of truth (read these BEFORE coding, in order)

1. [docs/redesign/BRIEF.md](docs/redesign/BRIEF.md) - locked visual/structural decisions. Typography section (Geist only, no serif in app), the light-theme line ("supported but not the default"), and the "Hero surface for marketing: Analytics" note.
2. [docs/redesign/PROJECT-PLAN.md](docs/redesign/PROJECT-PLAN.md) - the contract. Read section 1 (no demotions, no route removed except the duplicate), section 4 (this is the Batch 4 row), section 5 (Batch 4 reserved paths), section 6 (deploy discipline) in full.
3. [docs/v1-audit/AUDIT.md](docs/v1-audit/AUDIT.md) - section 3 Analytics for the behaviour the promoted page must keep.
4. [frontend/src/app/analytics-v2/page.tsx](frontend/src/app/analytics-v2/page.tsx) - the SHIPPED v3 Analytics page. This content becomes the new `/analytics`.
5. [frontend/src/app/analytics/page.tsx](frontend/src/app/analytics/page.tsx) - the v1 page being replaced. Read it only to confirm no behaviour/feature is lost in the swap.
6. [frontend/src/app/layout.tsx](frontend/src/app/layout.tsx) - font imports. Lines 2-3 import Cormorant_Garamond + DM_Sans (drop) alongside Geist (keep). Line ~121 wires the className variables.
7. [frontend/src/components/v3/shell.tsx](frontend/src/components/v3/shell.tsx) - **line 16 hardcodes the Insights nav href to `/analytics-v2`**. The ⌘K palette iterates the same list, so this one line drives both. Promoting the route without repointing this link 404s the primary Analytics nav.
8. [frontend/src/styles/v3-tokens.css](frontend/src/styles/v3-tokens.css) - the `.v3 { ... }` token block. Light theme is a single additive variant here.

If anything in this brief contradicts those source files, the source files win.

## What's in scope

- **Promote `/analytics-v2` → `/analytics`:** replace the contents of `frontend/src/app/analytics/page.tsx` with the shipped v3 page from `frontend/src/app/analytics-v2/page.tsx` (adjust only the route-identity bits: `PageHeader` crumb/title stay "Analytics", any internal `/analytics-v2` self-links become `/analytics`). Then remove the now-duplicate `frontend/src/app/analytics-v2/` route directory. Keep `analytics/layout.tsx` metadata correct for the canonical `/analytics` URL.
- **Repoint the one nav reference:** `frontend/src/components/v3/shell.tsx` line 16 `href: '/analytics-v2'` → `href: '/analytics'`. This is the single sanctioned edit to a shared v3 component in this batch; it is required, not optional. Grep the whole repo for any other `analytics-v2` string and fix every one (`grep -rn "analytics-v2" frontend/src`).
- **Light-theme token map:** add a single-pass light variant to `frontend/src/styles/v3-tokens.css` (e.g. a `.v3[data-theme="light"]` or `@media (prefers-color-scheme: light)` block, whichever matches the existing theme toggle mechanism - inspect how the app already toggles theme before choosing). Map all `--v3-*` surface/text/border tokens to a coherent light palette. Single pass, not a polish exercise (PROJECT-PLAN §2: light-theme polish beyond a single-pass mapping is out).
- **Drop v1 fonts:** remove the `Cormorant_Garamond` and `DM_Sans` imports + their config objects + their `.variable` entries on the `<html>` className in `frontend/src/app/layout.tsx`. Keep Geist Sans/Mono. Leave `JetBrains_Mono` alone unless you verify nothing (including the `v3-tokens.css` mono fallback) references it.
- **Cleanup:** ensure `frontend/.gitignore` covers the PWA build artefacts (`public/sw.js`, `public/workbox-*.js`) and `frontend/nul` so they can never be committed. `frontend/nul` is already absent and the PWA files are currently untracked build noise - this is a guardrail, not a deletion task. Do not commit any of them.
- **Final consistency pass:** because this batch removes the v1 fallbacks, after the changes verify EVERY v3 route still renders: `/`, `/dashboard`, `/obligations`, `/documents/[id]`, `/documents/[id]/graph`, `/search`, `/compare`, `/deals`, `/deals/[id]`, and the newly-promoted `/analytics`. No route may 404. No v1 serif may appear anywhere in the app shell.

## Out of scope (do NOT modify)

- Any data fetching, API call, hook logic, or feature behaviour on the Analytics page or anywhere else. The promote is a route-location move of already-shipped code, not a rewrite.
- Any other route's page logic (Batches 1-3 are merged and final).
- The backend.
- `docs/redesign/*` except the single PROJECT-PLAN §3/§4 Batch 4 status row at the very end (same pattern as prior batches).
- **The mobile-393 sidebar overflow** logged in [docs/CLAUDE-TODO.md](docs/CLAUDE-TODO.md). It is explicitly a future dedicated v3 responsive pass, NOT Batch 4. Do not attempt a responsive sidebar here; it is a cross-cutting shell change outside this batch's scope.
- Never stage `frontend/nul`, `frontend/public/sw.js`, `frontend/public/workbox-*.js`, or `design/`.

## What "good" looks like

- `brightclause.com/analytics` renders the v3 Analytics surface (the one previously at `/analytics-v2`), with the same charts, heatmap, KPIs, cross-doc entities and real data behaviour the audit section 3 describes.
- `/analytics-v2` no longer exists as a route (the directory is gone). The sidebar and ⌘K palette both navigate to `/analytics` and it loads 200.
- A light theme is reachable through the app's existing theme mechanism and every surface stays legible (no white-on-white, no v3 dark tokens leaking through).
- No Cormorant Garamond or DM Sans anywhere in the built bundle. No serif inside the app shell on any route.
- Every v3 route from Batches 1-3 plus the new `/analytics` still renders with the v3 shell, no console errors on the golden path, no 404.
- `cd frontend && npm run build` passes clean.
- An opus code review returns OVERALL PASS.

## Required deliverables

1. A short plain-text rationale before code: exactly what moves where for the analytics promote, the one shell-nav line that must change and why, the light-theme mapping approach (which existing toggle mechanism it hooks into), and the explicit confirmation that no Analytics behaviour/feature is lost in the move.
2. The change, scoped to the in-scope files only.
3. Mandatory writer/reviewer loop: after implementing, dispatch a fresh-context opus Code Reviewer given only the diff and this brief. It must verify: the promoted `/analytics` is byte-equivalent in behaviour to the shipped `/analytics-v2` (every hook/api-call/handler preserved), the shell nav + all `analytics-v2` references repointed with zero dangling links, no route 404s, light-theme tokens complete and coherent, v1 fonts fully removed with no broken `var(--font-*)` references, build clean, scope correct, no demotion, no out-of-scope responsive work. Fix every defect. Re-review until OVERALL PASS. Do NOT open the PR until an opus review returns PASS.
4. `cd frontend && npm run build` clean before commit.
5. `/design-review` after the change: verify the promoted `/analytics` visually matches the shipped v3 analytics surface and the v1 audit section 3, and spot-check the light theme. chrome-devtools MCP may be unavailable; the Playwright fallback is acceptable. Local backend port 8002 is firewalled from the dev box so data-backed views render empty/loading locally - that is expected and accepted; real-data verification is the post-merge production check.

## Suggested workflow

1. Rebase (first action above).
2. Read all eight source-of-truth items.
3. Inspect the existing theme-toggle mechanism BEFORE writing the light-theme block (do not invent a new one).
4. Write the rationale.
5. Implement: analytics promote + shell nav repoint + grep-sweep `analytics-v2` + light tokens + font drop + gitignore guardrail.
6. `npm run build` clean.
7. Opus reviewer subagent, fresh context, diff + brief only. Fix, re-review to PASS.
8. `/design-review` against the v1 audit + the shipped v3 analytics surface.
9. Commit (explicit `git add <path>` only, never `git add -A`), push, open one PR.
10. Merge via the git-integration path (see Constraints), verify on production.
11. Update PROJECT-PLAN §3/§4 Batch 4 status row, print final status report. This completes the v3 reskin - note that explicitly.

## Constraints

- One PR. Branch: `chore/v3-finalise`.
- Explicit `git add <path>` only. Never `git add -A` or `git add .`. Never stage `frontend/nul` or the PWA artefacts.
- DEPLOY DISCIPLINE (incident-derived, non-negotiable): NEVER run `vercel --prod` or `vercel deploy --prod`. Ship ONLY via PR to master then Vercel git-integration auto-deploy. Before merging, note the current good production deployment id for instant rollback. After merge, the manual-alias stickiness footgun WILL recur: it has now recurred on ALL THREE prior batches (1, 2 and 3). Expect it. Confirm the new git-integration deployment via the GitHub deployments API (its `ref`/`sha` must equal the Batch 4 merge commit), then run `vercel alias set <git-production-deployment> brightclause.com` ONCE, pointing only at the CI-built deployment, never a CLI build. Re-verify on brightclause.com directly.
- PROD VERIFICATION GOTCHA: verify on brightclause.com directly (preview is Vercel-auth-walled, accepted). If any API-backed view returns 502, do NOT assume a frontend bug. Check: (a) `https://api.brightclause.com/health` TLS cert CN must be api.brightclause.com not donnacha.app, (b) on root@45.77.233.102 `grep -c api.brightclause.com /opt/donnacha/nginx.conf` must be >0, re-add the two server blocks to BOTH `/opt/donnacha/nginx.conf` and `/etc/nginx/nginx.conf` then `nginx -t && systemctl reload nginx` if 0, (c) the brightclause.com Vercel alias target, (d) brightclause-backend container health. Documented in project memory `project_nginx_conf_regeneration_drops_vhost.md`.
- Because this is the LAST batch and it removes the v1 fallbacks, the post-merge production check must spot every v3 route (list in "What's in scope"), not just the changed one. A 404 on any route is a release blocker - roll back via the noted deployment id.
- British English. No em-dashes, no en-dashes, no ellipsis character. Short direct sentences.

## Out-of-scope follow-ups (capture, don't build)

If you spot problems beyond scope, append them to [docs/CLAUDE-TODO.md](docs/CLAUDE-TODO.md). Do not fix inline. The mobile-393 responsive sidebar pass is already captured there and remains the largest known follow-up after v3 ships.

## Why this brief is structured this way

Batches 1-3 proved two things this brief depends on. First, the inventory-first writer plus fresh-context opus reviewer loop is mandatory and works: Batch 3 passed first time because every hook/handler was inventoried before writing - do the same for the analytics promote so no behaviour is lost in the move. Second, the single most likely break here is the dangling `/analytics-v2` nav link in `shell.tsx`: prior batches were burned by exactly this class of cross-cutting reference, which is why repointing it is called out as a required deliverable, not left to discovery. The deploy and nginx rules exist because production drifted to a rejected design twice and the API broke twice from infra recurrences; the alias-stickiness footgun has now recurred every single batch, so it is no longer a risk to watch for but a step to plan for.