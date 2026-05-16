# BrightClause v3 Batch 3 — Search + Compare + Deals Reskin

Open this in a **fresh Claude Code session** in this worktree root. Do not carry context from any prior session.

## First action: rebase before doing anything else

This worktree was branched from `origin/master` at scaffold time. Batch 2 (doc-detail + graph) merged just before this was scaffolded; other PRs may merge before your first edit. Before reading anything else or writing any code:

```bash
git fetch origin master --quiet
git rebase origin/master
```

Fast-forward expected. If conflicts, resolve them now against current master.

## The problem

The BrightClause v3 fast-reskin is near complete. Foundation, Batch 1 (`/dashboard`, `/obligations`) and Batch 2 (`/documents/[id]`, `/documents/[id]/graph`) are merged and live on brightclause.com in the v3 design system. Batch 3 reskins the three remaining lighter, empty-state-heavy surfaces to v3: **Search** (`/search`), **Compare** (`/compare`), and **Deals** (`/deals` and `/deals/[id]`). These still render the dated v1 design language. This is a PURE RESKIN: only the rendering JSX changes. No data, API, feature, or behaviour change. No route demotion.

## Source of truth (read these BEFORE coding, in order)

1. [docs/redesign/BRIEF.md](docs/redesign/BRIEF.md) - locked visual/structural decisions. Do not re-litigate.
2. [docs/redesign/PROJECT-PLAN.md](docs/redesign/PROJECT-PLAN.md) - the contract. Read section 1 (no demotions), section 4 (per-surface reskin contract) and section 6 (deploy discipline) in full.
3. [docs/v1-audit/AUDIT.md](docs/v1-audit/AUDIT.md) - read section "4. Search", section "5. Compare", section "7. Deals" for v1 behaviour to preserve. CRITICAL: the AUDIT rebuild-target lines say to demote Compare and Deals. That is SUPERSEDED by PROJECT-PLAN section 1: keep every route, pure reskin, no demotion. Reskin the existing surfaces in place. Do not turn Compare into a bulk action or fold Deals into Workspaces.
4. [frontend/src/app/analytics-v2/page.tsx](frontend/src/app/analytics-v2/page.tsx) - PROVEN reskin exemplar (shipped).
5. [frontend/src/app/dashboard/page.tsx](frontend/src/app/dashboard/page.tsx), [frontend/src/app/obligations/page.tsx](frontend/src/app/obligations/page.tsx) - Batch 1 exemplars (shipped).
6. [frontend/src/app/documents/[id]/page.tsx](frontend/src/app/documents/[id]/page.tsx) and [frontend/src/app/documents/[id]/graph/page.tsx](frontend/src/app/documents/[id]/graph/page.tsx) - Batch 2 exemplars (shipped). These show the V3Shell-wrap, drop-the-legacy-Navigation, keep-every-handler pattern on complex API-backed routes most similar to Compare/Deals.
7. [frontend/src/components/v3/shell.tsx](frontend/src/components/v3/shell.tsx), [frontend/src/components/v3/primitives.tsx](frontend/src/components/v3/primitives.tsx), [frontend/src/styles/v3-tokens.css](frontend/src/styles/v3-tokens.css) - the V3Shell, primitives, and CSS classes/vars you must use.

If anything in this brief contradicts those source files, the source files win.

## The reskin contract (non-negotiable)

Mirror the structure of the proven exemplars: `'use client'`, keep the original data-loading / hooks / handlers verbatim, wrap the return in `<V3Shell>`, render with the v3 primitives (`KpiCard`, `RiskPill`, `PageHeader`, `Section`, `HeatmapCell`, `EntityChip`) from `@/components/v3/primitives` and `V3Shell` from `@/components/v3/shell`, and use the v3 CSS classes/vars from `frontend/src/styles/v3-tokens.css`. Drop the v1 `<Navigation>` import and usage (global nav now lives in V3Shell); keep any page-specific controls.

Every `useState` / `useEffect` / `useCallback` / `useMemo` / `useRef`, every `api.*` call (same arguments, same control flow, same try/catch, same polling/timeouts/debounce), and every event handler (`onClick` / `onChange` / `onDrop` / `onKeyDown` / `onBlur` / `onMouseDown` / `onSubmit` and any others) from each original file MUST exist identically in the reskinned version. Re-check exhaustively. The number-one failure mode on this project is a silently dropped handler. In Batch 1 the writer's self-checklist missed real handler loss twice; only the opus reviewer caught it. In Batch 2 the same loop caught nothing because the writer inventoried first - do that.

## What's in scope

- `frontend/src/app/search/page.tsx` (and `search/layout.tsx` only if it carries v1 styling)
- `frontend/src/app/compare/page.tsx` (and `compare/layout.tsx` same caveat)
- `frontend/src/app/deals/page.tsx`, `frontend/src/app/deals/[id]/page.tsx` (and `deals/layout.tsx` same caveat)
- Additively only if a genuinely new shared primitive or prop is needed: `frontend/src/components/v3/primitives.tsx` or `frontend/src/components/v3/shell.tsx`. Additive and backward-compatible only. Must not break existing `V3Shell` / analytics-v2 / dashboard / obligations / documents callers.

## Out of scope (do NOT modify)

- Any other route or page (`/`, `/analytics`, `/analytics-v2`, `/dashboard`, `/obligations`, `/documents/**` and their files)
- Any data fetching, API call, hook logic, or feature behaviour
- The backend
- `docs/redesign/*` except the single PROJECT-PLAN section 4 Batch 3 status row at the very end
- Never stage `frontend/nul`, `frontend/public/sw.js`, `frontend/public/workbox-*.js`, or `design/` (pre-existing untracked build noise)

## What "good" looks like

- `/search`, `/compare`, `/deals`, `/deals/[id]` each render inside `<V3Shell>` with the v3 dark surface, Geist type, sidebar and ⌘K topbar, exactly like dashboard/analytics-v2/documents
- No legacy `<Navigation>` anywhere on these routes; the old top nav is gone
- Search: query input, mode toggle (hybrid/semantic/keyword), example searches, and results all reskinned to v3; every search/submit/keydown/mode-change handler identical; risk tiers ordered Critical, High, Medium, Low if shown
- Compare: document picker, the comparison matrix/diff view, and the empty state reskinned to v3; every select/add/remove/compare handler identical; no demotion to a bulk action
- Deals: deal list, create-deal flow, empty state reskinned; `/deals/[id]` deal detail reskinned; every create/open/delete/navigate handler identical; no fold into Workspaces
- Every v1 feature still works identically
- `cd frontend && npm run build` passes clean
- An opus code review returns OVERALL PASS

## Required deliverables

1. A short plain-text reskin rationale before code (which primitives map to which v1 sections, what stays verbatim, the explicit note that Compare/Deals are reskinned in place not demoted)
2. The reskin, scoped to the in-scope files only
3. Mandatory writer/reviewer loop: after implementing, dispatch an opus Code Reviewer subagent with fresh context, given only the diff and this contract, to verify every hook/handler/api-call preserved (listed with file:line), no fabricated-data-as-real, scope correct, build clean, v3 usage correct, no route demotion. Fix every defect. Re-review until OVERALL PASS. Do NOT open the PR until an opus review returns PASS.
4. `cd frontend && npm run build` clean before commit
5. `/design-review` after the reskin to visually check the rendered surfaces against the v1 audit and screenshots in `docs/v1-audit/screenshots/` (search.png, compare.png, deals.png). chrome-devtools MCP may be unavailable; the Playwright fallback is acceptable. Local backend port 8002 is firewalled from the dev box, so data-backed views render empty/loading locally - that is expected and accepted; real-data verification is the post-merge production check.

## Suggested workflow

1. Rebase (first action above)
2. Read all seven source-of-truth groups
3. Read the five exemplar pages and the four target pages fully; inventory every hook/handler/api-call in the targets BEFORE writing
4. Write the reskin rationale
5. Implement the reskin
6. `npm run build` clean
7. Opus reviewer subagent, fresh context, diff + contract only. Fix, re-review to PASS
8. `/design-review` against v1 audit + screenshots
9. Commit (explicit `git add <path>` only, never `git add -A`), push, open one PR
10. Merge via the git-integration path (see Constraints), verify on production
11. Update PROJECT-PLAN section 4 Batch 3 status row, print final status report

## Constraints

- One PR. Branch: `feat/v3-batch3-search-compare-deals`.
- Explicit `git add <path>` only. Never `git add -A` or `git add .`.
- DEPLOY DISCIPLINE (incident-derived, non-negotiable): NEVER run `vercel --prod` or `vercel deploy --prod`. Ship ONLY via PR to master then Vercel git-integration auto-deploy. Before merging, note the current good production deployment id for instant rollback. After merge, the manual-alias stickiness footgun WILL likely recur (it did in Batch 1 and Batch 2): brightclause.com stays pinned to the prior production deployment instead of repointing to the new git build. Confirm the new git-integration deployment via the GitHub deployments API (environment_url), then run `vercel alias set <git-production-deployment> brightclause.com` ONCE, pointing only at the CI-built deployment, never a CLI build. Re-verify.
- PROD VERIFICATION GOTCHA: verify on brightclause.com directly (preview is Vercel-auth-walled, accepted). If any API-backed view returns 502, do NOT assume a frontend bug. Check in this order: (a) `https://api.brightclause.com/health` TLS cert CN must be api.brightclause.com not donnacha.app, (b) on root@45.77.233.102 `grep -c api.brightclause.com /opt/donnacha/nginx.conf` must be greater than 0, re-add the two server blocks to BOTH `/opt/donnacha/nginx.conf` and `/etc/nginx/nginx.conf` then `nginx -t && systemctl reload nginx` if 0, (c) the brightclause.com Vercel alias target, (d) brightclause-backend container health. Documented in project memory `project_nginx_conf_regeneration_drops_vhost.md`.
- British English. No em-dashes, no en-dashes, no ellipsis character. Short direct sentences.

## Out-of-scope follow-ups (capture, don't build)

If you spot problems beyond scope, append them to `docs/CLAUDE-TODO.md` (already exists from Batch 2). Do not fix inline. Batch 4 (`chore/v3-finalise`: promote analytics-v2, light theme, drop old fonts, cleanup) is separate and must be last.

## Why this brief is structured this way

Batch 1's retro proved the writer/reviewer loop is mandatory: a self-checklist missed real handler loss twice and only an independent opus review caught it. Batch 2 passed first time because the writer inventoried every hook/handler/api-call before writing - do that. The deploy and nginx rules exist because production drifted to a rejected design twice and the API broke twice from infra recurrences; the alias-stickiness footgun recurred again in Batch 2 and was remediated with a single sanctioned git-deployment re-alias. Following the proven exemplars exactly is what makes a reskin faithful; inventing structure is what drops handlers. The Compare/Deals "no demotion" note exists because the v1 AUDIT explicitly recommends demoting them, but the revised PROJECT-PLAN overrides that - keep every route.