# v3 Landing Reskin - Design Rationale

**Deliverable #1 of the v3 landing reskin brief.** Written before any code.
This is a rendering reskin of the existing v1 marketing landing at `/`, not a content rewrite. Every v1 section, CTA, feature claim, link, the hero video and the screenshot showcase survive identically; only the rendering layer moves to the v3 design system. If this doc contradicts `docs/redesign/BRIEF.md` or `v3-tokens.css`, the source files win.

---

## 1. v1 landing inventory (proves nothing is lost)

Source: `frontend/src/app/page.tsx` (724 lines) plus three composed child components.

| # | Section | Content that must survive | v1 chrome being replaced |
|---|---|---|---|
| 1 | Fixed nav | `logo-minimal.png` + "BrightClause" wordmark + "Try It Live" -> `/dashboard` | `bg-ink-950/85 backdrop-blur-xl`, `ink-*` borders, `font-display`, accent `#c9a227` |
| 2 | Hero | H1 "Upload a Contract. Know the Risks.", subcopy, "Try It Live" -> `/dashboard`, conditional "Watch Demo" re-open button, `HeroVisual` -> lazy `HeroVideoPlayer` dissolve | `ink-*` text, `theme-dark-frame` wrapper, accent shadows |
| 3 | Screenshot Showcase | 5 tabs (Dashboard/Analytics/Obligations/Compare/Search), autoplay+progress, cinema mode, arrow-key nav, the 5 `/assets/screenshot-*.png` | `bg-accent/15`, `theme-dark-frame`, `ink-*`, raw traffic-light hexes |
| 4 | How It Works | 6 stages: Upload / Extract / Embed / Analyze / Chat / Act with exact descriptions and icons | `ink-*`, accent connector, **infinite traveling dots**, one-shot ripple rings |
| 5 | Key Features | All 12 features (exact title + description + icon): Chat with Your Contract, AI Clause Extraction, Risk Assessment, Plain-English Translator, Obligation Tracker, Executive Reports, Timeline Extraction, Deal Grouping, Knowledge Graph, Hybrid Vector Search, PDF Viewer & Export, Dark & Light Mode. Bento: 1 primary + 2 supporting + 9 list | `bg-ink-900/50`, **`bg-gradient-to-br from-accent/5` hover wash (card gradient - banned in v3)**, `ink-*` |
| 6 | 16+ Clause Types | All 16: Termination, Indemnification, Limitation of Liability, Confidentiality, Non-Compete, Intellectual Property, Change of Control, Assignment, Governing Law, Dispute Resolution, Warranty, Force Majeure, Payment Terms, Insurance, Audit Rights, Data Privacy | `ink-*` chips, stagger reveal |
| 7 | Built for Trust | 4 cards with count-up stat logic: Zero data sharing, 16+ clause types, <2s per document, 100% coverage. Exact titles + descriptions + `useCountUp` + `useInView` | `bg-ink-900/30`, `ink-*`, accent badges |
| 8 | Architecture | 4 capability points (Ask Questions in Plain English, Non-Blocking Analysis, Full Audit Trail, Secure by Design) + 5-tier stack: Presentation (Next.js 14, TypeScript, Tailwind CSS, Framer Motion), API Gateway (FastAPI, 8 Routers, Server Proxy, Pydantic), Processing (Celery Workers, RAG Pipeline, Tesseract OCR, Clause Extraction), Storage (PostgreSQL 16, pgvector, Redis 7, MinIO S3), AI (Ollama, llama3.2, Nomic Embeddings, Vector Search) | `theme-dark-frame`, coloured tier bars, **infinite traveling pulse dot**, hardcoded `#c9a227` arrows |
| 9 | CTA | `logo-minimal.png` (64px) + "Upload Your First Contract" + subcopy + "Try It Live" -> `/dashboard` | `ink-*`, accent button |
| 10 | Footer | `logo-minimal.png` (20px) + "BrightClause" + "Built by Macdara" + 6 internal links (Dashboard, Analytics, Search, Compare, Obligations, Deals) + GitHub external `https://github.com/m4cd4r4/BrightClause` | `ink-*` |

Cross-cutting v1 elements preserved: `id="main-content"` (skip-link target from `layout.tsx`), `aria-label="Landing navigation"`, all `aria-hidden` on decorative icons, the 2000ms hero-video auto-reveal timer, `lazy`/`Suspense` code-splitting of the video and showcase, `next/image` for the logo and screenshots.

Child components reskinned in place (logic untouched):
- `frontend/src/app/hero-visual.tsx` - the product-preview mock (risk bars, clause list, mini knowledge graph). Internal motion is a *depiction of the product* and is retained per the v3 motion note; only colours move to v3 tokens.
- `frontend/src/components/HeroVideoPlayer.tsx` - Remotion `<Player>` wrapper. All player handlers, fullscreen logic, scene scrubber, click-outside dismiss kept byte-identical; only chrome colours move to v3.
- `frontend/src/components/ScreenshotShowcase.tsx` - tab/autoplay/cinema/keyboard logic kept byte-identical; only chrome colours move to v3.
- `frontend/src/components/demo-video/styles.ts` - the single style token file the 7 Remotion scenes consume (239 references across 13 files). Font + palette swapped to v3; **zero scene logic touched**.

## 2. v3 mapping approach

The landing root changes from `<main className="min-h-screen light-editorial">` to `<main className="v3">`. That single class (from `v3-tokens.css`) establishes the `--v3-*` token scope, the Geist family, and - critically - pulls in the `html.light .v3` light variant, so the existing `theme.tsx` `html.light` toggle drives the landing's light theme with no new toggle and no `light-editorial`/`theme-dark-frame` machinery.

Authoring follows the established v3 convention (`primitives.tsx`, `shell.tsx`, Batches 1-4): inline styles referencing `var(--v3-*)` plus the `.v3-btn` / `.v3-card` component classes; Tailwind retained only for layout (flex, grid, gap, max-width, responsive breakpoints), never for colour, border, radius or elevation.

| v1 token | v3 replacement |
|---|---|
| `bg-ink-950/95` nav, `backdrop-blur-xl` | `var(--v3-panel)` + 1px `var(--v3-border)` bottom, no glass blur (BRIEF: no glassmorphism) |
| `bg-ink-900/50` cards, `border-ink-700/60` | `.v3-card` (`var(--v3-card)` + `var(--v3-border)` + `--v3-radius-md`) |
| `bg-gradient-to-br from-accent/5` hover wash | dropped; hover -> `var(--v3-card-hover)` / `var(--v3-border-hover)` (BRIEF: no card gradients) |
| `text-ink-50/100` | `var(--v3-text-primary)` |
| `text-ink-400/500` | `var(--v3-text-secondary)` / `var(--v3-text-muted)` |
| accent `#c9a227`, `bg-accent` button | `var(--v3-accent)` `#d4a82d`; primary CTA = `.v3-btn .v3-btn-primary` |
| `font-display` / `font-mono` (Tailwind) | inherited Geist from `.v3`; mono labels via `.v3-mono` |
| risk colours `bg-red-500` etc | `var(--v3-risk-critical|high|medium|low)` |
| `rounded-xl/2xl` | `--v3-radius-md` (10px) / `--v3-radius-lg` (14px) |
| ad-hoc shadows | `var(--v3-shadow-sm|md)` only |
| spacing | snapped to the 4/8/12/16/20/24/32/40/56/80 scale |

No `--v3-*` token value is modified. No primitive's public signature is touched. No app route is touched. The only shared-component edit is the sanctioned `V3Shell` logo swap.

## 3. The single motion moment

The v3 budget is one deliberate moment per surface. The chosen moment for the landing is the **hero visual -> demo-video dissolve** (`AnimatePresence`, 2000ms auto-reveal then a 1.5s eased cross-dissolve). It is the product's own signature reveal and already exists; it stays.

Per the agreed "moderate" motion scope:
- **Kept:** the hero dissolve (signature); tasteful one-shot `whileInView` section reveals (aid scannability); the How-It-Works connector line draw; clause-chip stagger; trust count-up; architecture tier slide-in; screenshot crossfade; `HeroVisual` internal product-preview motion (depicts the app).
- **Removed (decorative infinite loops, the "animation pile-up" the brief warns against):** the How It Works **infinitely repeating traveling connector dots**, and the Architecture **infinitely repeating traveling pulse dot**. Both are `repeat: Infinity` ornamentation with no informational purpose.
- **Accessibility:** a `useReducedMotion()` gate degrades the hero dissolve and the section reveals to instant when the user prefers reduced motion (v1 only covered unused CSS `.scroll-reveal`; this honours the brief hard rule for the framer animations that actually run).

## 4. Logo wiring

Asset: `frontend/public/logo-minimal.png` (verified present, 37 KB, the clean gold section-mark; also already referenced by v1 nav/CTA/footer and `layout.tsx` JSON-LD).

1. **`frontend/src/components/v3/shell.tsx` (the single sanctioned shared edit, additive only):** replace the hardcoded `§` glyph box (lines ~46-53) with `<Image src="/logo-minimal.png" alt="BrightClause" width={28} height={28}>` next to the existing "BrightClause" wordmark. No structural shell change; the surrounding flex container, border and padding are unchanged. Incidentally removes a `fontWeight: 700` (BRIEF: no 700) since the glyph box is gone.
2. **Landing:** the logo continues to appear in the nav (36px), the CTA section (64px) and the footer (20px) exactly as v1, re-rendered in the v3 surface. No new placements added (no scope creep).

## 5. What this reskin explicitly does not do

Backend, APIs, data, feature behaviour, any app route, primitive signatures, the `V3Shell` structure beyond the logo, `--v3-*` token values, `BRIEF.md`/`AUDIT.md`. The mobile-393 responsive sidebar overflow stays a captured future pass. New out-of-scope findings go to `docs/CLAUDE-TODO.md`, not fixed inline.
