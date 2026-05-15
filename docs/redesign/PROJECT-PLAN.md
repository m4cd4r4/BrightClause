# BrightClause v3 Redesign — Execution Plan

**Companion to:** [`docs/redesign/BRIEF.md`](./BRIEF.md) (visual + structural decisions, locked 2026-05-16)
**Input:** [`docs/v1-audit/AUDIT.md`](../v1-audit/AUDIT.md) (per-surface audit of live v1)
**Plan governs:** branch shape, wave gating, output paths reserved, definition-of-done. Per [c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md](file:///c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md), this file is the lock — other sessions check it before starting overlapping work.

---

## 1. What this plan does NOT decide

Direction questions are settled in BRIEF.md. This plan does not re-litigate:

- Typography (Geist Sans + Geist Mono, no serif inside app — BRIEF §Typography)
- Colour tokens (4-tier dark surface, accent `#d4a82d` — BRIEF §Color tokens)
- Elevation, radius, spacing, density (BRIEF §Elevation through §Density)
- Layout shell (240/56px sidebar + 48px topbar — BRIEF §Layout shell)
- Component contracts (BRIEF §Component contracts)
- Motion budget (BRIEF §Motion budget)
- Chart library (Recharts — BRIEF §Chart library decision)
- Build order (BRIEF §Surface priority — this plan maps that to waves)
- What routes get demoted (Compare → bulk action, Deals → Workspaces — BRIEF §Surface priority + §Out-of-scope)

If a decision in this plan contradicts BRIEF.md, the brief wins.

---

## 2. Scope

In: visual + structural redesign of marketing landing + 5 retained product surfaces (Analytics, Dashboard, Document detail, Obligations, Knowledge Graph) + ⌘K command palette + layout shell + token system + Vercel deployment-protection hardening.

Out: backend, API, features, auth, billing, mobile, light-theme polish beyond a single-pass mapping, Compare matrix redesign (demoted to bulk action), Deals route redesign (folded into Workspaces).

---

## 3. Wave structure

BRIEF.md §Surface priority lists 10 build steps. This plan groups them into 9 waves with explicit gates between. **Wave N+1 cannot be scoped until Wave N is in production and stable for ≥24h.**

| Wave | Slug | Maps to BRIEF step(s) | Output | Effort | Status |
|---|---|---|---|---|---|
| 0 | `feat/v3-redesign` | 1 (tokens + global CSS + fonts + theme provider) | `frontend/src/styles/v3-tokens.css`, `frontend/src/app/layout.tsx` font block, theme provider stub | S–M | **materialised** (in flight) |
| 1 | `feat/v3-shell-primitives` | 2 (shell) + 3 (primitives) | Sidebar 240/56, topbar 48px, page wrapper, 5 primitives (KpiCard, RiskPill, DocumentRow, HeatmapCell, EntityChip). Not yet wired to existing routes. | M | later |
| 2 | `feat/v3-analytics-pilot` | 4 (Analytics pilot at `/analytics-v2`) | New route `/analytics-v2` rendering the v3 Analytics surface. Existing `/analytics` untouched. | M | later |
| 3 | `feat/v3-dashboard-cmdk` | 5 (Dashboard) + 9 (⌘K command palette) | `/dashboard` ported to v3. ⌘K palette shipped globally. `/search` route stays for direct linking. | M–L | later |
| 4 | `feat/v3-document-detail` | 6 (Document detail) | `/documents/[id]` ported. Three-column shape per AUDIT §2 rebuild target. | L | later |
| 5 | `feat/v3-obligations` | 7 (Obligations) | `/obligations` ported with due-date column + mark-complete inline action per AUDIT §6 rebuild target. | M | later |
| 6 | `feat/v3-knowledge-graph` | 8 (Knowledge graph fullscreen) | `/documents/[id]/graph` fullscreen canvas + click-through entity side panel per AUDIT §8. | S–M | later |
| 7 | `feat/v3-promote-analytics-light` | 10 (light theme) + analytics promotion | Promote `/analytics-v2` → `/analytics` (drop old). Light theme token mapping. | M | later |
| 8 | `chore/v3-cleanup-hardening` | (post-build housekeeping) | Remove Compare + Deals routes. Drop Cormorant Garamond and DM Sans imports. Drop dead tokens from `tailwind.config.ts`. Lock Vercel production branch to `master` only. | S | later |

`feat/v2-landing` is **superseded**. Do not merge, do not delete (work product preserved).

---

## 4. Wave gates

Each gate is a hard stop. Wave N+1's brief cannot be drafted until Wave N's gate passes.

| Gate | Condition |
|---|---|
| Wave 0 → 1 | `v3-tokens.css` final, theme provider working, dark theme default verified on staging route |
| Wave 1 → 2 | Shell renders on every existing route without breaking them. Primitives renderable in isolation (Storybook-equivalent harness or `/_dev/primitives` route). |
| Wave 2 → 3 | `/analytics-v2` deployed to brightclause.com, 24h soak, no rollback. Heatmap interactivity working. |
| Wave 3 → 4 | `/dashboard` shipped in v3, ⌘K palette working from every page, 24h soak |
| Wave 4 → 5 | `/documents/[id]` shipped, 24h soak |
| Wave 5 → 6 | `/obligations` shipped, 24h soak |
| Wave 6 → 7 | `/documents/[id]/graph` shipped, 24h soak |
| Wave 7 → 8 | `/analytics-v2` promoted to `/analytics`, light theme working (theme toggle from topbar) |
| Wave 8 closes plan | Cleanup PR merged, Vercel production branch locked |

---

## 5. Output paths reserved

Per multi-worktree rule §5 ("Source-of-truth files are reserved by being named"). Pre-mint overlap check (`wt-mint.sh`) reads this table.

| Wave | Reserved paths |
|---|---|
| 0 | `frontend/src/styles/v3-tokens.css`, `frontend/src/app/layout.tsx` (font + token import block only), `frontend/next.config.js`, `frontend/package.json`, `frontend/package-lock.json` |
| 1 | `frontend/src/components/v3/**` (shell + primitives + future theme provider, all version-namespaced), `frontend/src/app/_dev/primitives/**` (new harness route) |
| 2 | `frontend/src/app/analytics-v2/**` (new) |
| 3 | `frontend/src/app/dashboard/**`, `frontend/src/components/v3/command-palette/**` (new), `frontend/src/app/search/page.tsx` (link-only, palette is primary) |
| 4 | `frontend/src/app/documents/[id]/**`, `frontend/src/components/v3/pdf-viewer/**` (if split-pane lands here vs Wave 6) |
| 5 | `frontend/src/app/obligations/**` |
| 6 | `frontend/src/app/documents/[id]/graph/**` |
| 7 | `frontend/src/app/analytics/**` (replaces analytics-v2), `frontend/src/styles/v3-tokens.css` (light theme map appended), `frontend/src/components/v3/theme-provider.tsx` |
| 8 | `frontend/tailwind.config.ts`, `frontend/src/app/globals.css`, `frontend/src/app/compare/**` (deletion), `frontend/src/app/deals/**` (deletion), Vercel project settings (external) |

**Convention:** all new v3 components live under `frontend/src/components/v3/**` — version-namespaced so future redesigns can coexist or supersede cleanly. Older non-v3 components remain at their existing paths and are only removed in Wave 8.

---

## 6. Process discipline

### Rebase-on-start
Every fresh session in any wave worktree runs `git fetch origin master --quiet && git rebase origin/master` **before any other action**. Sessions overrunning 24h rebase daily. Not at PR time — at session start.

### PR queuing
GitHub auto-merge enabled with **rebase** strategy. Never manual-merge two PRs simultaneously across sessions. Let GitHub serialise.

### Branch protection
Wave 0's PR also enables branch protection on `master`: required PR, required CI, no direct push, no force push. (Currently absent — I pushed `feat/v2-landing` and was offered an auto-PR-creation hint; master itself is unprotected.) Pull this forward to Wave 0 if you want it tightened before any v3 hits production.

### Vercel hardening
Until Wave 8 lands the production-branch lock, **no `vercel --prod` runs against this project without explicit per-deploy authorization from Macdara on the specific commit**. The 2026-05-15 22:40 AWST unauthorised production deploy (rolled back same evening) is the precedent that justifies this discipline.

### Definition of "wave is done"
A wave's gate is passed only when ALL of these are true:

- [ ] PR(s) merged to master via rebase
- [ ] Production deploy is the merged commit (Vercel deployments tab shows it)
- [ ] brightclause.com loaded in a browser, visually inspected against BRIEF.md success criteria
- [ ] Lighthouse run on the changed route — no regression vs previous wave's score (mobile + desktop)
- [ ] No console errors, no 404s on assets, no failed network requests on golden path
- [ ] ≥24 hours elapsed without rollback or hotfix
- [ ] Status table in §3 of this file updated (`status` → `merged`)
- [ ] Output paths in §5 updated if files moved during the wave

Wave N+1 may start scoping only after these check.

### Smaller PRs (multi-worktree rule §6)
A wave is one feature or one fix. Wave 3 (Dashboard + ⌘K) is the only multi-feature wave and is acceptable because ⌘K replaces `/search` functionally and the two ship together to keep the search affordance unbroken.

---

## 7. Disposition of existing branches

| Branch | Status | Action |
|---|---|---|
| `master` | Production source of truth | Untouched until Wave 0 PR merges. Branch protection enabled in Wave 0. |
| `feat/v2-landing` | Superseded | Do not delete (work product preserved). Do not merge. Will be left in the registry as `archived` once Wave 0 lands. |
| `feat/v3-redesign` | Wave 0 in flight | Continue Wave 0 work here. PR's title and body should reference this plan. On Wave 1 mint, create a fresh branch off master — do not reuse this one. |
| `docs/redesign-plan` (this branch) | Plan PR pending | Merges to master before Wave 0 PR opens. The lock arrives before the work. |

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Direction wrong, discovered mid-Wave | BRIEF.md locks direction. Wave 2 (Analytics pilot at `/analytics-v2`) is a parallel-route validation before any existing route is touched. If it fails to deliver the BRIEF §What success looks like criterion, replan before Wave 3. |
| Token system unstable under app-density layouts | Wave 1 includes the `/_dev/primitives` harness route. Primitives must render correctly in isolation before Wave 2 wires them into Analytics. |
| Production deployed outside plan (recurrence of 2026-05-15 incident) | Wave 8 hardens Vercel. Pre-Wave-8: per-deploy authorization rule (see §6). Wave 0 also enables master branch protection. |
| Stale branches regress fixes | Rebase-on-start discipline (§6). Branches >2 days old rebase before merge. |
| Multi-worktree conflicts | Output paths reserved (§5). Wave 4–6 are sequential per BRIEF build order, reducing parallel-write surface. |
| Scope creep into backend / features | §2 "explicitly out" list. PRs adding non-redesign work get split or rejected. |
| Compare and Deals routes still in code post-Wave 7 | Wave 8 deletes them. Until then, they continue to render the v1 design language — acceptable visible inconsistency for the duration of the build. |
| Light theme regresses dark theme | Wave 7 is the only wave that touches both themes. Visual diff (screenshot baseline) on every existing route required as gate. |

---

## 9. Out-of-band open questions

Not direction decisions (those are locked in BRIEF). Process decisions that need a one-line answer from Macdara before Wave 0 closes.

1. **Master branch protection: pull forward to Wave 0 or leave for Wave 8?** Recommend: pull forward.
2. **PR-per-screen or PR-per-wave for Wave 3?** (Wave 3 is the only wave with two surfaces — Dashboard + ⌘K palette.) Recommend: one PR; they ship together because ⌘K replaces `/search` functionally.
3. **Storybook or `/_dev/primitives` harness for Wave 1?** Recommend: `/_dev/primitives` (no extra tool, faster setup, ships behind `NODE_ENV=development` guard).
4. **Vercel deployment protection level?** Options: (a) production-branch lock only, (b) lock + require manual promote on Vercel dashboard, (c) lock + require GitHub Approved Reviewer. Recommend (b).
5. **Wave 0 owner.** Macdara handles directly on `feat/v3-redesign`, or hand-off via a `/new-worktree` scoped prompt? Currently: Macdara directly, in flight.

---

## 10. References

- BRIEF: [`docs/redesign/BRIEF.md`](./BRIEF.md)
- v1 audit: [`docs/v1-audit/AUDIT.md`](../v1-audit/AUDIT.md)
- v1 audit screenshots: [`docs/v1-audit/screenshots/`](../v1-audit/screenshots/)
- Multi-worktree rule: [`~/.claude/rules/multi-worktree-projects.md`](file:///c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md)
- Git workflow rule: [`~/.claude/rules/git-workflow.md`](file:///c:/Users/Hard-Worker/.claude/rules/git-workflow.md)
- Superseded branch (preserved): `feat/v2-landing`
