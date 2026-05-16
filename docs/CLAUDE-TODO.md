# Out-of-scope follow-ups (captured, not built)

Spotted during scoped batch work. Do not fix inline in the batch that found it.

## From Batch 2 (v3 doc-detail + graph reskin, 2026-05-16)

- **doc-detail header action row overflows horizontally at mobile widths (<420px).** The PageHeader actions slot holds 5 controls (Graph, PDF, Report, Obligations, Export) which do not wrap on a 393px viewport. Consistent with the rest of v3 (BRIEF locks v3 to desktop 1280px+; shipped Batch 1 dashboard/obligations behave the same). Not a Batch 2 regression. Belongs to a future v3 responsive/mobile pass, not Batch 3 or 4 as currently scoped.

## From Batch 4 (v3 finalise, 2026-05-16)

- **`frontend/src/components/demo-video/styles.ts:26` hardcodes `display: "'Cormorant Garamond', 'Playfair Display', Georgia, serif"`.** Batch 4 removed the `Cormorant_Garamond` next/font import (no longer in the bundle), so this string now silently falls back to Playfair/Georgia/serif in the demo-video modal. Pre-existing, out of Batch 4 scope (the font-import drop was layout.tsx-only; this is a separate component style token). Belongs to the demo-video component's own polish, not the v3 reskin batches.
- **Light-theme chart-token polish.** A few Recharts elements on `/analytics` keep hardcoded dark values (the "Clause distribution" tooltip `contentStyle` `background:#1d1d22`, and the `#a1a1aa` axis tick fill). They render dark-on-light when the light theme is active. Identical to the shipped pilot (the Batch 4 promote was relocate-only and byte-equivalent), so out of Batch 4 scope. Belongs to the deferred light-theme polish pass (PROJECT-PLAN §2 marks light-theme polish beyond a single-pass token map as out).
- **`docs/v1-audit/capture-v3.mjs` and `capture-v3-debug.mjs` still point at `localhost:3000/analytics-v2`.** That route no longer exists after the Batch 4 promote. These are one-shot historical screenshot-capture scripts (their captures are already taken); not app code, out of the `frontend/src` grep scope. Repoint to `/analytics` only if these scripts are ever re-run.

## From Batch 3 (v3 search + compare + deals reskin, 2026-05-16)

- **The v3 shell's fixed 240px sidebar causes horizontal overflow at mobile width (393px) on every v3 surface.** Confirmed during Batch 3 design-review that `/search`, `/compare`, `/deals` overflow at 393px - and that the already-merged-and-live `/dashboard`, `/obligations`, `/analytics-v2` overflow identically at the same width. Root cause is shared, pre-existing infrastructure: `components/v3/shell.tsx` `.v3-side` is a hard `width: 240px` with no collapse breakpoint (`v3-tokens.css`). Not a Batch 3 regression - Batch 3 inherits the exact responsive behaviour of the shipped shell. BRIEF locks v3 to desktop 1280px+ and lists mobile/tablet as deferred. Fixing it is a cross-batch shared-primitive change (responsive sidebar collapse 240px -> 56px, already sketched in BRIEF "Layout shell"). Belongs to a dedicated v3 responsive pass, not Batch 3 or Batch 4 as currently scoped.
