# BrightClause v3 Batch 2 — Document Detail + Knowledge Graph Reskin

Open this in a **fresh Claude Code session** in this worktree root. Do not carry context from any prior session.

## First action: rebase before doing anything else

This worktree was branched from `origin/master` at scaffold time. Other PRs may have merged since. Before reading anything else or writing any code:

```bash
git fetch origin master --quiet
git rebase origin/master
```

Fast-forward expected. If conflicts, resolve them now against current master.

## The problem

The BrightClause v3 fast-reskin is mid-flight. Foundation (tokens, V3Shell, ⌘K palette, 6 primitives, `/analytics-v2`) and Batch 1 (`/dashboard`, `/obligations`) are merged and live on brightclause.com. Batch 2 reskins the two remaining complex surfaces to the v3 design system: the **Document Detail** workspace (`/documents/[id]` plus its chat-panel, pdf-viewer, timeline subcomponents) and the **Knowledge Graph** (`/documents/[id]/graph`). These still render the dated v1 design language. This is a PURE RESKIN: only the rendering JSX changes. No data, API, feature, or behaviour change. No route demotion.

## Source of truth (read these BEFORE coding, in order)

1. [docs/redesign/BRIEF.md](docs/redesign/BRIEF.md) - locked visual/structural decisions. Do not re-litigate.
2. [docs/redesign/PROJECT-PLAN.md](docs/redesign/PROJECT-PLAN.md) - the contract. Read section 4 (per-surface reskin contract) and section 6 (deploy discipline) in full.
3. [docs/v1-audit/AUDIT.md](docs/v1-audit/AUDIT.md) - read section "2. Document detail" and section "8. Knowledge Graph" for v1 behaviour to preserve and the presentation-only rebuild targets.
4. [frontend/src/app/analytics-v2/page.tsx](frontend/src/app/analytics-v2/page.tsx) - PROVEN reskin exemplar #1 (shipped, Macdara-approved).
5. [frontend/src/app/dashboard/page.tsx](frontend/src/app/dashboard/page.tsx) and [frontend/src/app/obligations/page.tsx](frontend/src/app/obligations/page.tsx) - PROVEN reskin exemplars #2 and #3 (Batch 1, shipped).
6. [frontend/src/components/v3/shell.tsx](frontend/src/components/v3/shell.tsx) and [frontend/src/components/v3/primitives.tsx](frontend/src/components/v3/primitives.tsx) - the V3Shell and primitives you must use.
7. [frontend/src/styles/v3-tokens.css](frontend/src/styles/v3-tokens.css) - v3 CSS classes and custom properties.

If anything in this brief contradicts those source files, the source files win.

## The reskin contract (non-negotiable)

Mirror the structure of the three proven exemplars: `'use client'`, keep the original data-loading / hooks / handlers verbatim, wrap the return in `<V3Shell>`, render with the v3 primitives (`KpiCard`, `RiskPill`, `PageHeader`, `Section`, `HeatmapCell`, `EntityChip`) from `@/components/v3/primitives` and `V3Shell` from `@/components/v3/shell`, and use the v3 CSS classes/vars from `frontend/src/styles/v3-tokens.css`.

Every `useState` / `useEffect` / `useCallback` / `useMemo` / `useRef`, every `api.*` call (same arguments, same control flow, same try/catch, same polling/timeouts), and every event handler (`onClick` / `onChange` / `onDrop` / `onKeyDown` / `onBlur` / `onMouseDown` / `onSubmit` and any others) from each original file MUST exist identically in the reskinned version. Re-check exhaustively. The number-one failure mode on this project is a silently dropped handler. In Batch 1 the writer's own self-checklist missed real handler loss twice; only the opus reviewer caught it.

## What's in scope

- `frontend/src/app/documents/[id]/page.tsx`
- `frontend/src/app/documents/[id]/chat-panel.tsx`
- `frontend/src/app/documents/[id]/pdf-viewer.tsx`
- `frontend/src/app/documents/[id]/timeline.tsx`
- `frontend/src/app/documents/[id]/graph/page.tsx`
- Additively only if a genuinely new shared primitive or prop is needed: `frontend/src/components/v3/primitives.tsx` or `frontend/src/components/v3/shell.tsx`. Additive and backward-compatible only. It must not break existing `V3Shell` / analytics-v2 / dashboard / obligations callers (analytics-v2 uses `<V3Shell>` with no extra props; dashboard passes optional drag props).

## Out of scope (do NOT modify)

- Any other route or page
- Any data fetching, API call, hook logic, or feature behaviour
- The backend
- `/analytics`, `/analytics-v2`, `/dashboard`, `/obligations` and their files
- `docs/redesign/*` except the single PROJECT-PLAN section 4 Batch 2 status row at the very end
- Never stage `frontend/nul`, `frontend/public/sw.js`, `frontend/public/workbox-*.js`, or `design/` (pre-existing untracked noise)

## What "good" looks like

- `/documents/[id]` renders inside `<V3Shell>` with the v3 dark surface, Geist type, sidebar and ⌘K topbar, exactly like dashboard/analytics-v2
- The clause reader is the strong central column. Risk shown via a single coloured `RiskPill` or dot, not a full red header tint. Risk tiers ordered Critical, High, Medium, Low consistently everywhere
- Timeline presented as a horizontal strip under the action bar (presentation-only change; same timeline data and handlers)
- Chat panel, PDF viewer, timeline subcomponents restyled to v3 but every send/scroll/navigate/cite handler identical
- `/documents/[id]/graph` is a fullscreen v3 canvas with a click-node entity side panel; the redundant top action bar that duplicates global nav is dropped (the global nav now lives in V3Shell)
- Every v1 feature still works identically: clause navigation, plain-English explain, report generation, obligation extraction, Q and A chat with citations, PDF clause nav, timeline, graph zoom/pan/filter/click
- `npm run build` passes clean
- An opus code review returns OVERALL PASS

## Required deliverables

1. A short plain-text reskin rationale before code (which primitives map to which v1 sections, what the rebuild-target presentation changes are, what stays verbatim)
2. The reskin, scoped to the in-scope files only
3. Mandatory writer/reviewer loop: after implementing, dispatch an opus Code Reviewer subagent with fresh context, given only the diff and this contract, to verify every hook/handler/api-call preserved (listed with file:line), no fabricated-data-as-real, scope correct, build clean, v3 usage correct. Fix every defect. Re-review until OVERALL PASS. Do NOT open the PR until an opus review returns PASS.
4. `cd frontend && npm run build` clean before commit
5. `/design-review` after the reskin to visually check the rendered surfaces against the v1 audit and screenshots in `docs/v1-audit/screenshots/`

## Suggested workflow

1. Rebase (first action above)
2. Read all seven source-of-truth files
3. Read the three exemplar pages and the two target pages fully; inventory every hook/handler/api-call in the targets
4. Write the reskin rationale
5. Implement the reskin (consider a writer subagent per the project's writer/reviewer pattern)
6. `npm run build` clean
7. Opus reviewer subagent, fresh context, diff + contract only. Fix, re-review to PASS
8. `/design-review` against v1 audit + screenshots
9. Commit (explicit paths only, never `git add -A`), push, open one PR
10. Merge via the git-integration path (see Constraints), verify on production
11. Update PROJECT-PLAN section 4 Batch 2 status row, print final status report

## Constraints

- One PR. Branch: `feat/v3-batch2-docdetail-graph`.
- Explicit `git add <path>` only. Never `git add -A` or `git add .`.
- DEPLOY DISCIPLINE (incident-derived, non-negotiable): NEVER run `vercel --prod` or `vercel deploy --prod`. Ship ONLY via PR to master then Vercel git-integration auto-deploy. Before merging, note the current good production deployment id for instant rollback. After merge, if brightclause.com does not auto-repoint to the new git production deployment (manual-alias stickiness is a known footgun), run `vercel alias set <git-production-deployment> brightclause.com` ONCE, pointing only at the CI-built deployment, never a CLI build.
- PROD VERIFICATION GOTCHA: verify on brightclause.com directly (preview is Vercel-auth-walled, accepted). If `/documents/*` or any API-backed view returns 502, do NOT assume a frontend bug. Check in this order: (a) `https://api.brightclause.com/health` TLS cert CN must be api.brightclause.com not donnacha.app, (b) on root@45.77.233.102 `grep -c api.brightclause.com /opt/donnacha/nginx.conf` must be greater than 0 (it is the nginx source of truth; if 0 the templater dropped it, re-add the two server blocks to BOTH `/opt/donnacha/nginx.conf` and `/etc/nginx/nginx.conf` then `nginx -t && systemctl reload nginx`), (c) the brightclause.com Vercel alias target, (d) brightclause-backend container health. This is documented in the project memory file `project_nginx_conf_regeneration_drops_vhost.md`.
- British English. No em-dashes, no en-dashes, no ellipsis character. Short direct sentences.

## Out-of-scope follow-ups (capture, don't build)

If you spot problems beyond scope, append them to `docs/CLAUDE-TODO.md` (create if absent). Do not fix inline. Batches 3 and 4 are separate.

## Why this brief is structured this way

Batch 1's retro proved the writer/reviewer loop is mandatory: a self-checklist missed real handler loss twice and the reskin would have shipped broken without an independent opus review. The deploy and nginx rules exist because production drifted to a rejected design twice and the API broke twice from infra recurrences during Batch 1. Following the three proven exemplars exactly is what makes a reskin faithful; inventing structure is what drops handlers.