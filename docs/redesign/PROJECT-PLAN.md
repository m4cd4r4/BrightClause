# BrightClause v3 Redesign — Execution Plan (Fast-Reskin, Batched)

**Companion to:** [`docs/redesign/BRIEF.md`](./BRIEF.md) (visual + structural decisions, locked 2026-05-16)
**Input:** [`docs/v1-audit/AUDIT.md`](../v1-audit/AUDIT.md) (per-surface audit of live v1)
**Plan governs:** branch shape, batch sequencing, output paths, definition-of-done. Per [c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md](file:///c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md), this file is the lock — other sessions check it before starting overlapping work.

**Revised 2026-05-16** after the foundation shipped and Macdara chose the fast path: *reskin every surface, keep every section/tool/function identical, lighter gates, no route demotions.*

---

## 1. What changed from the original 9-wave plan

The first version of this plan (9 waves, 24h soak gate between each, Compare demoted, Deals folded into Workspaces) was written before the Analytics pilot proved the approach. After Macdara saw the live `/analytics-v2` surface he chose a different shape:

- **Keep every route.** No demotions. Compare stays Compare. Deals stays Deals. This is a pure reskin: same sections, same tools, same functions, same data, same IA — only the rendering layer changes to v3 primitives.
- **Batch surfaces.** Ship 2-3 reskinned surfaces per PR, not one-per-wave.
- **No 24h soak between batches.** Each surface is additive-safe (v1 stays the fallback until the v3 page replaces it in the same PR, and the change is rendering-only). Verify on production after merge, rollback-ready.
- **Foundation is done.** Tokens, shell, primitives, and the Analytics pilot are merged and live.

If this plan contradicts BRIEF.md, the brief wins. Direction is not re-litigated here.

---

## 2. Scope

**In:** rendering-layer reskin of every product surface to the v3 design system, keeping 100% of existing functionality, data flow, and information architecture.

**Out:** backend, API, features, auth, billing, mobile-specific layouts beyond what the shell gives for free, light-theme polish beyond a single-pass mapping. No route is removed. No feature is removed or demoted.

---

## 3. Status — what is already shipped

| Item | State |
|---|---|
| v3 design tokens (`frontend/src/styles/v3-tokens.css`) | **merged** (master `5fbf8c3`, PR #29) |
| App shell + sidebar + topbar + ⌘K palette (`frontend/src/components/v3/shell.tsx`) | **merged** |
| Six primitives (`frontend/src/components/v3/primitives.tsx`) | **merged** |
| Geist Sans/Mono fonts wired (`layout.tsx`) | **merged** |
| Dev-only CSP `unsafe-eval` (`next.config.js`) | **merged** |
| `/analytics-v2` route (v3 Analytics pilot) | **promoted to `/analytics` in Batch 4 (PR #37); route removed, now 404** |
| Batch 1 `/dashboard` + `/obligations` v3 reskin | **merged** (PR #31) |
| Batch 2 `/documents/[id]` + `/documents/[id]/graph` v3 reskin | **merged** (PR #33) |
| Batch 3 `/search` + `/compare` + `/deals` + `/deals/[id]` v3 reskin | **merged, live at brightclause.com** (PR #35, master `999c1e2`) |
| v1 audit + brief + this plan | **merged** |

Production verified 2026-05-16 after Batch 4: every route renders the v3 shell - `/`, `/dashboard`, `/obligations`, `/documents/[id]`, `/documents/[id]/graph`, `/search`, `/compare`, `/deals`, `/deals/[id]`, and `/analytics` (promoted from the pilot). `/analytics-v2` is removed (404). No Cormorant/DM-Sans in the bundle. `api.brightclause.com/health` healthy (TLS CN correct). The v3 fast-reskin is complete; the v1 fallbacks are gone.

---

## 4. Remaining work — batches

Every batch is one PR, branched fresh off `master`, merged via the git-integration path (see §6). Surfaces grouped by primitive-reuse similarity so each batch compounds on the last.

| Batch | Branch | Surfaces reskinned | Why grouped | Effort | Status |
|---|---|---|---|---|---|
| 1 | `feat/v3-batch1-dashboard-obligations` | `/dashboard`, `/obligations` | Heaviest KpiCard + table + RiskPill reuse — fastest wins, lowest risk, proves the shell on real app routes | M | **merged** (PR #31, master `27b315f`, live + prod-verified 2026-05-16; writer/2×opus-reviewer) |
| 2 | `feat/v3-batch2-docdetail-graph` | `/documents/[id]`, `/documents/[id]/graph` | The two complex workspace layouts; doc-detail is the core work surface, graph just needs the shell + fullscreen canvas | L | **merged** (PR #33, master `d04e7fc`, live + prod-verified 2026-05-16; writer/opus-reviewer OVERALL PASS; alias-stickiness footgun recurred, remediated once with sanctioned git-deployment re-alias) |
| 3 | `feat/v3-batch3-search-compare-deals` | `/search`, `/compare`, `/deals`, `/deals/[id]` | Lighter, empty-state-heavy surfaces; all kept (no demotion) | M | **merged** (PR #35, master `999c1e2`, live + prod-verified 2026-05-16; writer/opus-reviewer OVERALL PASS first pass; `/design-review` SHIP READY; alias-stickiness footgun recurred again, remediated once with sanctioned git-deployment re-alias) |
| 4 | `chore/v3-finalise` | Promote `/analytics-v2` → `/analytics`, drop the now-duplicate old Analytics, light-theme token map, drop Cormorant + DM Sans imports, remove stray `frontend/nul` + PWA artefacts, consistency pass | M | **merged** (PR #37, master `a72bfec9`, live + prod-verified 2026-05-16; writer/opus-reviewer OVERALL PASS first pass; `/design-review` SHIP READY; alias-stickiness footgun recurred a 4th time, remediated once with the sanctioned git-deployment re-alias). **This completes the v3 reskin.** |

**Batch 1 retro (2026-05-16):** Executed via writer (sonnet) + 2 opus review rounds. Round 1 caught 3 dropped stat-tile nav handlers, a narrowed drag-drop zone, and a scope-creep 4th tile. Round 2 caught the `display:contents` drag wrapper failing for empty-state drops; fixed by adding additive optional `onDragOver/onDragLeave/onDrop` props to `V3Shell`. Lesson for Batch 2+: the writer/reviewer loop is mandatory for reskins — self-review missed real handler loss both times. Also during Batch 1 the API broke twice from infra recurrences (Vercel manual-alias stickiness; nginx.conf regeneration wiping the `api.brightclause.com` vhost) — both are now memory-documented; check `api.brightclause.com` TLS cert + the nginx vhost before assuming a frontend bug.

**Batch 3 retro (2026-05-16):** Writer (opus) inventoried every hook/handler/api-call across all 4 target files before writing, per the Batch 2 lesson. The fresh-context opus reviewer's line-by-line behavioural diff returned **OVERALL PASS with zero behavioural defects on the first pass** (no fix round needed) - the inventory-first discipline held. `/design-review` ran via the Playwright fallback (chrome-devtools MCP unavailable, accepted): SHIP READY at desktop/laptop/tablet, every v1 AUDIT §4/§5/§7 section preserved, no demotion. The mobile-393 sidebar overflow surfaced again and was confirmed identical on the already-shipped dashboard/obligations/analytics-v2 - pre-existing shared-shell behaviour, not a Batch 3 regression, captured in `docs/CLAUDE-TODO.md` for a future v3 responsive pass. The Vercel manual-alias stickiness footgun recurred a third consecutive time and was remediated once with the sanctioned `vercel alias set <git-production-deployment> brightclause.com` against the CI-built deployment only. Lesson: the alias-stickiness recurrence is now reliably predictable - Batch 4 should expect it and budget the single sanctioned re-alias.

**Batch 4 retro (2026-05-16):** Final batch. Writer (opus) inventoried the analytics-v2 page and confirmed a byte-equivalent move before touching `/analytics` (only the export name changed); the fresh-context opus reviewer returned **OVERALL PASS with zero defects on the first pass**, same inventory-first discipline that held for Batch 3. `/design-review` (Playwright fallback, chrome-devtools MCP not wired) was SHIP READY: `/analytics` renders the v3 surface dark and light, the light theme applies cleanly through the existing `theme.tsx` `html.light` toggle, every v3 route 200, no app console errors, body font computed Geist (no serif). The Vercel manual-alias stickiness footgun recurred a **fourth** consecutive time exactly as the brief predicted (`brightclause.com/analytics-v2` still 200 + `/analytics` still v1 immediately post-merge) and was remediated once with the sanctioned `vercel alias set <git-production-deployment> brightclause.com` against the CI-built deployment only; the API was healthy throughout (no nginx recurrence this time). Post-merge production check confirmed every v3 route (the full list, not just the changed one) renders the v3 shell and `/analytics-v2` is gone (404). **The v3 fast-reskin is complete: all surfaces are on the v3 design system and the v1 fallbacks (old Analytics, Cormorant/DM-Sans fonts) are removed.** Remaining known follow-up: the mobile-393 responsive sidebar pass in `docs/CLAUDE-TODO.md`, plus the deferred light-theme polish - both explicitly out of the reskin scope.

Batches are independent enough to parallelise across worktrees if desired, but the recommended order is 1 → 2 → 3 → 4 because each batch hardens the primitives the next one reuses, and Batch 4 must be last (it removes the v1 fallbacks).

### Per-surface contract (applies to every surface in every batch)

For each route: wrap the page in `<V3Shell>`, swap the rendering JSX to v3 primitives, keep the **exact** data fetching, hooks, state, handlers, and feature logic. No API change. No behaviour change. If a feature exists in v1 it exists identically in v3. Verify the reskinned page against its v1 audit entry in `docs/v1-audit/AUDIT.md` and its v1 screenshot.

---

## 5. Output paths reserved

| Batch | Reserved paths |
|---|---|
| 1 | `frontend/src/app/dashboard/**`, `frontend/src/app/obligations/**`, `frontend/src/components/v3/**` (new shared primitives only — additive) |
| 2 | `frontend/src/app/documents/[id]/**` (incl. `chat-panel`, `pdf-viewer`, `timeline`, `graph/`), `frontend/src/components/v3/**` (additive) |
| 3 | `frontend/src/app/search/**`, `frontend/src/app/compare/**`, `frontend/src/app/deals/**`, `frontend/src/components/v3/**` (additive) |
| 4 | `frontend/src/app/analytics/**`, `frontend/src/app/analytics-v2/**` (removed after promote), `frontend/src/styles/v3-tokens.css` (light map), `frontend/src/app/layout.tsx` (drop old fonts), `frontend/next.config.js`, `frontend/tailwind.config.ts`, `frontend/src/app/globals.css` |

Shared v3 primitives live under `frontend/src/components/v3/**` and are version-namespaced. Adding a primitive is additive and never conflicts; modifying an existing primitive's signature is a cross-batch change and must be called out in the PR.

---

## 6. Process discipline

### Deploy path (HARD RULE — incident-derived)
**Never `vercel --prod` / `vercel deploy --prod` against this project from a local checkout.** Production drifted to the rejected v2 landing twice (2026-05-15 ×2) because CLI deploys ship the local working tree and a manual `vercel alias set` then pins `brightclause.com` to it. The only sanctioned path:

1. Branch off `master`, do the reskin, push the branch.
2. Open a PR. Vercel builds a preview automatically (preview is Vercel-auth-walled — that is acceptable; the diff is rendering-only and verified locally + post-merge).
3. Merge the PR (rebase). Vercel git integration auto-builds a production deployment from `master`.
4. If `brightclause.com` does not auto-repoint to the new git deployment (manual-alias stickiness from the incident), `vercel alias set <git-production-deployment> brightclause.com` ONCE to the CI-built deployment — never to a CLI-built one.
5. Verify on `brightclause.com` directly. Keep the previous good deployment id noted for instant rollback.

Full rationale: [c:/Users/Hard-Worker/.claude/projects/i--Scratch-ContractClarity/memory/project_vercel_prod_deploy_hazard.md](file:///c:/Users/Hard-Worker/.claude/projects/i--Scratch-ContractClarity/memory/project_vercel_prod_deploy_hazard.md).

### Rebase-on-start
Every fresh session in any batch branch runs `git fetch origin master --quiet && git rebase origin/master` before any other action. Batches branch fresh off master — never reuse a merged branch.

### Definition of "batch is done"
- [ ] PR merged to master (rebase)
- [ ] Vercel git-integration production deploy is the merged commit
- [ ] `brightclause.com` repointed to the git deployment if stickiness recurs
- [ ] Every reskinned route loads 200, renders the v3 shell, no console errors on the golden path
- [ ] Every route NOT in this batch still renders unchanged (spot-checked)
- [ ] `/api/health` still 200
- [ ] §3 / §4 status updated in the same PR or an immediate follow-up commit

No 24h soak gate. Next batch may start as soon as the previous batch's production verification passes.

### Smaller PRs
One batch = one PR. If a batch's diff exceeds ~800 lines or touches a primitive's public signature, split it.

---

## 7. Disposition of branches

| Branch | Status | Action |
|---|---|---|
| `master` | Production source of truth | Git-integration auto-deploys to production. Never CLI-deploy. |
| `feat/v2-landing` | Superseded | Do not delete, do not merge. Preserved. |
| `feat/v3-redesign` | Merged (PR #29) | Auto-deleted on merge. Do not reuse. |
| `docs/redesign-plan` | Local-only artefact | Superseded by this revision. May be deleted. |
| `chore/v3-bundle-ship` (worktree) | Obsolete | The bundle it was to ship is merged. Worktree at `I:/Scratch/BrightClause-brightclause-v3-bundle-ship` can be removed via `wt-finish.sh`. |
| `chore/v3-plan-reskin-batches` | This revision's PR | Merges to master before Batch 1 opens. |

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Production drift to v2 (recurrence) | §6 hard rule: git-integration path only, never CLI. Memory file is the standing reason. |
| A reskin silently changes behaviour | Per-surface contract (§4): data/hooks/handlers byte-identical, only JSX swapped. Verify against v1 audit + screenshot. |
| Preview auth-wall blocks pre-merge verification | Accepted: diff is rendering-only, verified locally before commit and on production immediately after merge, rollback id noted. |
| Primitive signature change ripples across batches | Additive-only by default; signature changes flagged in PR and that batch goes last or solo. |
| Batch branch goes stale | Rebase-on-start (§6). Batches are short-lived (one PR each). |
| Scope creep into backend/features | §2 out-list. Reskin PRs that touch data/API logic get split or rejected. |

---

## 9. References

- BRIEF: [`docs/redesign/BRIEF.md`](./BRIEF.md)
- v1 audit: [`docs/v1-audit/AUDIT.md`](../v1-audit/AUDIT.md)
- v1 + v3 screenshots: [`docs/v1-audit/screenshots/`](../v1-audit/screenshots/)
- Vercel deploy hazard memory: [c:/Users/Hard-Worker/.claude/projects/i--Scratch-ContractClarity/memory/project_vercel_prod_deploy_hazard.md](file:///c:/Users/Hard-Worker/.claude/projects/i--Scratch-ContractClarity/memory/project_vercel_prod_deploy_hazard.md)
- Multi-worktree rule: [c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md](file:///c:/Users/Hard-Worker/.claude/rules/multi-worktree-projects.md)
