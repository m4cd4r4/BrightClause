# BrightClause v1 — Live UX Audit

Captured 2026-05-15 from the live production site at https://brightclause.com after API restoration via `api.brightclause.com`.

Screenshots in [`./screenshots/`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/).

---

## Summary verdict

v1 is a **stronger product than the marketing surface suggests.** The dashboard, obligations tracker, analytics page, and knowledge graph all show real, dense, information-rich work. The system has more legitimate substance than v2's editorial reskin makes visible.

**What v1 has that the redesign must preserve:**
- Dense, professional dark surface (warm ink + gold accent)
- Information-first composition — every page leads with KPIs or a clear empty state
- Real data tables (analytics) with three different lenses on the same dataset (matrix, bars, list)
- Force-directed knowledge graph that is *actually impressive*
- Consistent top nav across the app
- Disciplined empty states (Compare, Deals)

**What v1 needs in the v2026 dashboard rebuild:**
- Modernise the typography (kill the editorial serif inside the app shell)
- Tighter density + better information hierarchy (KPI cards are too sparse, doc list rows waste vertical space)
- A proper sidebar instead of crowded top nav (8 nav items + search + Tour + Upload + GitHub + theme = noise)
- Real chart components instead of CSS bar fills
- Status pills with a single, modern token system
- A "command bar / quick action" surface (Linear/Raycast pattern)
- One motion moment per surface

---

## Per-surface audit

### 1. Dashboard ([`screenshots/dashboard.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/dashboard.png))

**What's there:** 3 KPI cards (Contracts: 3, Clauses found: 22, Ready to review: 3), document list (left), risk panel (right, empty until contract selected).

**Strengths:**
- KPI numbers are large and confident
- Document list rows show filename + page count + section count + status, which is the right cardinality
- Right-pane "Select a contract to see its risk breakdown" is a real empty state, not "no data"

**Weaknesses:**
- KPI cards are visually whisper-thin — the metric is big but the card has no chart, no sparkline, no delta. Linear/Posthog/Vercel give every KPI a trend line or comparison.
- "Clauses found: 22" is a total but doesn't tell me if that's good. Add a per-document average or a "vs. expected" indicator.
- Document list rows are 70px+ tall with thin borders. At 3 docs that's fine; at 30 it'll be unusable. Reference: Linear issue rows are 36px; Attio rows are 40px.
- The right-side risk panel sits empty 90% of the time (until selection). That's wasted real estate. Better: show portfolio-level risk distribution there by default (the 4 risk-tier bars from the analytics page) and only switch to per-doc on selection.
- "Click to see risk" microcopy ("3 contracts · click to see risk") is too quiet — could be a clear column header.
- Top nav has 5 items + Search + Tour + Upload + GitHub icon + theme toggle = 10 affordances in one bar. Cramped on a 1440 viewport.
- The eye icon and chevron in each row do roughly the same thing (open the document). Pick one.

**Rebuild target:** Convert top nav → left sidebar with grouped sections. KPI cards become a 4-up strip with sparklines. Doc list becomes a denser table with sortable columns. Right pane shows portfolio risk distribution by default with a drilldown on selection.

---

### 2. Document detail ([`screenshots/document-detail.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/document-detail.png))

**What's there:** Risk-tier summary header (Critical 6 · High 2 · Low 0 · Medium 1), Clause Types nav (left), Extracted Clauses list (center), Contract Timeline (left lower).

**Strengths:**
- Three-column layout is the right shape for this workspace
- Clause cards are colored by risk tier — fast visual triage
- Timeline is a real differentiator and lives in the right place
- Top action bar has Graph / PDF / Report / Obligations / Export — covers the user jobs

**Weaknesses:**
- The screenshot renders compressed/portrait because of full-page capture; on a real 1440 viewport the columns are narrow. The middle column with the actual clause text needs more room — that's the work surface.
- "Critical 6 / High 2 / Low 0 / Medium 1" — risk tier order is inconsistent (should be Critical → High → Medium → Low everywhere).
- "Loading..." entries visible in the left timeline column — a real failure to handle the loading state silently.
- The header background uses a strong red gradient when the doc is "Critical" — too loud. Reference: Linear / Notion / Vercel use a single colored dot or pill, not a full header tint.
- Left-side clause type filter ("All Clauses, Confidentiality, non-solicitation...") is an active filter list, but visually competes with the timeline below it. Two unrelated controls stacked in one rail.
- No clear way to scroll to a specific section in the PDF from this view (PDF is a separate page action).

**Rebuild target:** Stronger middle column (the clause reader). Left rail collapses to clause-type filter only. Timeline lifts into a horizontal strip at the top (under the action bar). PDF viewer becomes inline split-pane instead of a separate page.

---

### 3. Analytics ([`screenshots/analytics.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/analytics.png))

**What's there:** Portfolio gauge (Risk Score: 65 · Medium Risk), 4 risk-tier KPI cards, **Risk Heatmap matrix** (clauses × document × risk colored cells), Clause Distribution horizontal bars, Top Risk Items list, Cross-Document Entities table, Document Risk Summary table.

**This is the strongest surface in the whole product.** It's the page that would convince a hiring manager you can build a real product.

**Strengths:**
- Six discrete information lenses on the same dataset, all useful
- Heatmap is the right primitive for portfolio review
- Cross-Document Entities ("BUYER · EFFECTIVE DATE · JURISDICTION · SELLER") shows entity resolution working across docs
- Document Risk Summary table at the bottom is the kind of dense, sortable output a buyer wants

**Weaknesses:**
- The "Risk Score: 65" gauge looks hand-drawn (gradient arc) — modern SaaS uses recharts/visx/tremor for these
- Heatmap cells are tiny squares with numbers — readable but not interactive (no hover, no click-to-filter visible)
- Clause Distribution bars: each bar is a CSS fill, not a real chart. Same data in a Tremor BarChart would look 10x more credible.
- Top Risk Items uses the same colored pill style as the document detail, which is consistent (good), but the list has no titles — reads as wall of text.
- No filter controls at the top — can't slice by doc, by risk tier, by clause type.
- No date range — "all time" only.

**Rebuild target:** Promote this page to the **product hero**. It's the most impressive surface and the one that earns the BYOK story. Replace the CSS charts with a real chart library (Tremor, Recharts, or visx). Add filter controls. Add hover + drilldown on heatmap cells.

---

### 4. Search ([`screenshots/search.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/search.png))

**What's there:** Centered headline, query input, mode toggle (Hybrid / Semantic / Keyword), 8 example searches in a 2x4 grid.

**Strengths:**
- Empty state is well-handled — example searches reduce cold-start friction
- Mode toggle is honest about the underlying retrieval (semantic vs keyword vs hybrid)
- Single CTA, focused page

**Weaknesses:**
- The empty state IS the page — once a user has used search once, those example pills become wasted space
- The headline "Search Your Contract Portfolio" is redundant with the page being /search and the nav being highlighted
- "Combines semantic understanding with keyword matching" under the search button is the kind of explanation that should be a tooltip, not a permanent caption
- No filter rail (by doc, risk tier, clause type)
- No keyboard shortcut surfaced (cmd-K should open this from anywhere — current Search input in top nav doesn't have one)

**Rebuild target:** Make this a cmd-K command palette overlay instead of a route. The route can stay for direct linking, but the primary search affordance should be ⌘K from any page (Linear / Raycast / Vercel pattern).

---

### 5. Compare ([`screenshots/compare.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/compare.png))

**What's there:** Title + sublabel + "Add Document (select 2-5)" button + large empty state with placeholder card mockups.

**Strengths:**
- Empty state is clear about the input requirement (2-5 contracts)
- Placeholder cards hint at the output shape

**Weaknesses:**
- The empty state is essentially the entire page on first visit and adds no value once you've used it
- "Add Document" button is the only affordance — multi-select from the dashboard would be more natural (Notion-style "Select 2-5 and compare")
- No saved comparisons / no "recently compared" surface

**Rebuild target:** Initiate comparisons from the dashboard via row checkbox + bulk action. Keep /compare as the workspace, drop the empty-state landing.

---

### 6. Obligations ([`screenshots/obligations.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/obligations.png))

**What's there:** 4 status KPI cards (All 7 · Pending 7 · Overdue 0 · Completed 0), type filter chip row, then a grouped list under "246188537-NDA-pdf.pdf · 7 obligations" with rows showing obligation text + PENDING pill + COMPLIANCE pill + party.

**Strengths:**
- KPI status row works for this object type — obligations have a natural state machine
- Type filter chips are visible and clearly active
- Rows show enough info to triage (text + status + type + party)
- Grouped by source document — the right grouping for cross-doc tracking

**Weaknesses:**
- No date column / deadline column — "Obligation Tracker" promises deadline tracking but I don't see dates on any row
- "Overdue 0 / Completed 0" — all 7 are pending forever. No way to mark complete from this view.
- Each row has a collapse chevron (^) but no visible expanded content in the capture
- PENDING + COMPLIANCE pills use slightly different shapes/weights — minor inconsistency
- No sort, no due-date column, no priority

**Rebuild target:** This page is 70% there. Add a Due Date column, a "Mark complete" inline action, and sorting. The KPI cards stay.

---

### 7. Deals ([`screenshots/deals.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/deals.png))

**What's there:** Empty state with three feature pills (AGGREGATE RISK · TRACK OBLIGATIONS · COMPARE CLAUSES) and a "Create Your First Deal" CTA.

**Strengths:**
- Honest empty state with clear value props
- "+ New Deal" in top right + central CTA is the right doubling

**Weaknesses:**
- Once a deal exists, this page presumably becomes a list — can't audit that state without test data
- The three feature pills (AGGREGATE RISK / TRACK OBLIGATIONS / COMPARE CLAUSES) overlap with what other top-nav routes already do — Deals is a *folder* of contracts, not a different lens. Risk of feature redundancy.

**Rebuild target:** Demote Deals from top-nav to a "Workspaces" or "Collections" concept inside the dashboard. Or keep it but make clear how a Deal differs from a Portfolio view.

---

### 8. Knowledge Graph ([`screenshots/knowledge-graph.png`](file:///i:/Scratch/ContractClarity/docs/v1-audit/screenshots/knowledge-graph.png))

**What's there:** Force-directed graph of ~80 colored nodes (parties, dates, locations, dollar amounts) with edges, left rail with entity type filters (Party / Person / Location / Date / Percentage), top action bar (Dashboard / Analytics / Compare / Obligations / Deals / Classes).

**This is the second-strongest surface.** It's the one that earns the "intelligence" word in "contract intelligence."

**Strengths:**
- The graph actually has entities and they actually connect — not a demo
- Color-coded by entity type, with a filter rail
- Loads from a real document
- Dense enough to look serious

**Weaknesses:**
- No node labels visible at this zoom — looks decorative rather than functional
- No click-through (presumably hover/click reveals detail but it's not signposted)
- The top action bar duplicates the global nav (Dashboard / Analytics / Compare...) — these don't belong here; this is a focused workspace
- The graph occupies < 70% of vertical space — could be fullscreen

**Rebuild target:** Fullscreen the canvas. Click a node = side panel with that entity's appearances across docs (huge value prop). Add a search-within-graph input. Drop the redundant top action bar.

---

## Cross-cutting issues across all surfaces

1. **Typography:** Cormorant Garamond (display serif) is used inside the app for page titles ("Document Comparison", "Obligation Tracker", "Deals", "Search Your Contract Portfolio"). It reads as *legal-firm website* not *AI product*. **Replace with a geometric sans (Geist, Inter Display, Söhne) inside the app shell. Keep the serif only on the landing if at all.**
2. **Color tokens:** Warm cream-cum-dark is fine as a brand position but the dark surface is too uniform — no elevation tiers. Modern SaaS dark themes use 3-4 tiers (canvas / panel / card / popover) with subtle borders.
3. **Status pills:** Risk tier pills are colored well (Critical red / High orange / Medium amber / Low green) but inconsistent shape, weight, and case across pages. Codify one pill component.
4. **Density:** Most rows waste 30-50% vertical space. Tighten to 36-44px row height.
5. **Top nav overload:** 5 nav items + Search + Tour + Upload + GitHub + theme = too much. Move to left sidebar with grouped sections (Workspace / Documents / Insights / Settings).
6. **No keyboard layer:** No cmd-K, no shortcuts visible. This is the single biggest 2026 SaaS gap.
7. **No motion:** Every surface is static. One motion moment per page would lift the perceived quality enormously (KPI counters, heatmap cells fading in, graph nodes settling).
8. **Loading states:** Dashboard sat on skeletons before the env fix. Document detail timeline shows literal "Loading..." text rows. Both can be smoother.
9. **Empty states:** Inconsistent voice — Compare is friendly ("Compare Your Contracts"), Deals is feature-list ("AGGREGATE RISK · TRACK OBLIGATIONS · COMPARE CLAUSES"), Search is example-driven. Pick one tone.

---

## Direction for the v2026 redesign

**Stack thesis:** *"v1's substance + Linear/Attio/Posthog visual rigor + one delightful surface per route."*

**Visual direction (not Claude-design editorial):**
- **Type:** Geist / Inter Display for display, Geist / Inter for body, JetBrains Mono for citations and code only. Drop Cormorant inside the app entirely.
- **Color:** Stay dark by default (it's working). Add tier separation: canvas `#0a0a0c`, panel `#111114`, card `#16161a`, popover `#1d1d22`. Borders at 1px `#27272a`. Accent gold stays for primary actions only.
- **Risk tokens:** Codify the four risk pill styles once. Same chrome everywhere.
- **Shadow + elevation:** Two shadow tiers only. No glassmorphism, no gradients on cards.
- **Layout:** Left sidebar (collapsible, 240px / 56px). Top app bar with cmd-K search + user menu only. Page bodies max-width 1440px with edge-to-edge tables.

**Information density:**
- Table rows: 40px
- KPI cards: 96px high with sparkline
- Card grids: 12-col, 16px gutter
- Section spacing: 32px between, 16px within

**Components to introduce:**
- `<KpiCard>` with metric, delta, sparkline
- `<RiskPill>` with 4 variants, one shape
- `<DocumentRow>` with status, page count, risk badge, last-updated, actions
- `<HeatmapCell>` with hover + click
- `<CommandPalette>` (⌘K)
- `<EntityChip>` for cross-doc entities

**Routes to keep:** Dashboard, Document Detail, Analytics, Search (as palette), Obligations, Knowledge Graph (per doc).

**Routes to demote/merge:**
- **Compare** → bulk action from Dashboard
- **Deals** → "Workspaces" concept folded into Dashboard left rail

**Hero surface for marketing:** Analytics page. It's the most credible artifact and should be the screenshot in every external pitch.

**Motion budget (1 per surface):**
- Dashboard: KPI counters count up on load
- Document detail: risk pills fade in as clauses extract (poll while job runs)
- Analytics: heatmap cells fade in left-to-right
- Knowledge graph: nodes settle on first paint (already free with force-directed)
- Obligations: status pills pulse when filter changes

---

## What we don't know yet (worth checking before redesign)

1. Dashboard list with 30+ docs — does it virtualise? Does it sort?
2. Compare matrix when populated — what does the actual diff view look like?
3. Document detail at 1440px width (not full-page capture) — are columns proportioned well?
4. PDF viewer route — not yet captured
5. Mobile / tablet — entire audit was 1440x900

These are worth a second capture pass once the redesign brief is locked.
