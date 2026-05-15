# BrightClause v3 — Redesign Brief

**Locked:** 2026-05-16
**Branch:** `feat/v3-redesign`
**Input:** [v1 UX audit](file:///i:/Scratch/ContractClarity/docs/v1-audit/AUDIT.md)
**Out of scope:** the discarded v2 "Instrument" editorial direction on `feat/v2-landing`

---

## Thesis

> v1's substance + Linear/Attio/Posthog visual rigor + one delightful motion moment per route.

The product already has the data, the IP, and the depth. The redesign is a **chrome and density upgrade**, not a feature pivot. We keep the routes that earned their place (Dashboard, Document Detail, Analytics, Obligations, Knowledge Graph) and demote the ones that didn't (Compare → bulk action, Deals → folded into Workspaces).

## Non-goals

- Editorial/literary aesthetic (rejected after v2 attempt)
- shadcn default look (loses what makes the brand memorable)
- Pivoting away from contract intelligence
- Light theme as the default (dark is working)
- Adding new features before fixing the chrome
- Multi-user auth or roles (still out of scope for portfolio)

---

## Locked design decisions

### Typography

- **Display + body:** Geist Sans (variable font). Fallback: Inter, system-ui.
- **Mono:** Geist Mono. Used for: clause citations (`p.18 § 11.2`), entity IDs, code, status timestamps, document filenames in dense tables.
- **No serif anywhere inside the app.** Cormorant Garamond stays available only for the marketing landing, and even there only as a single pull-quote moment if at all.
- **Scale (rem):** 0.75 / 0.8125 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.25 / 3
- **Weights:** 400 / 500 / 600 only. No 700 anywhere. No 300.

### Color tokens (dark, the default)

```
--canvas        #0a0a0c   page bg
--panel         #111114   section / sidebar bg
--card          #16161a   card / row bg
--card-hover    #1c1c22
--popover       #1d1d22   floating surfaces (menus, palette)
--border        #27272a   1px borders, dividers
--border-hover  #3f3f46

--text-primary    #fafafa
--text-secondary  #a1a1aa
--text-muted      #71717a
--text-disabled   #52525b

--accent          #d4a82d    legal gold (slightly cooled from v1's #c9a227)
--accent-hover    #e6bb3f
--accent-fg       #0a0a0c    foreground on accent buttons

--risk-critical   #ef4444
--risk-high       #f97316
--risk-medium     #eab308
--risk-low        #10b981

--ring            #d4a82d80  focus ring (accent at 50%)
```

Light theme is supported but not the default. Defer light-theme token mapping until after v3 ships.

### Elevation

Two shadow tiers only.

```
--shadow-sm   0 1px 2px rgba(0,0,0,.45)
--shadow-md   0 4px 12px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.5)
```

No glassmorphism. No gradients on cards. Use the panel/card/popover background tiers for depth instead of shadows where possible.

### Radius

`--radius-sm: 6px` (pills, chips, inline controls)
`--radius-md: 10px` (cards, inputs, buttons)
`--radius-lg: 14px` (large panels, modals)

### Spacing scale

4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 80. No others.

### Density

- Table row height: **40px**
- Compact table row: 32px
- KPI card height: 104px (was unbounded; now bounded with sparkline)
- Section vertical spacing: 32px between, 16px within
- Page max-width: 1440px, edge-to-edge tables
- Sidebar width: 240px expanded, 56px collapsed

---

## Layout shell

```
┌────────────────────────────────────────────────────────────────────┐
│ Top bar  (48px)   ⌘K search           [theme] [bell] [user menu]   │
├──────────┬─────────────────────────────────────────────────────────┤
│ Sidebar  │  Page content                                            │
│  240/56  │                                                          │
│          │                                                          │
│ Workspace│  ┌─ Page header ──────────────────────────────────────┐  │
│  Portfolio  │ H1 + crumb + actions                              │  │
│  Deals    │  └────────────────────────────────────────────────────┘  │
│  Search   │                                                          │
│          │  ┌─ KPI strip ───────────────────────────────────────┐  │
│ Insights │  │ 4x KpiCard with sparklines                       │  │
│  Risk    │  └────────────────────────────────────────────────────┘  │
│  Obligns │                                                          │
│  Entities│  ┌─ Primary surface ─────────────────────────────────┐  │
│          │  │ (heatmap, table, graph, etc)                      │  │
│ Settings │  └────────────────────────────────────────────────────┘  │
│  API key │                                                          │
│  Theme   │                                                          │
└──────────┴─────────────────────────────────────────────────────────┘
```

**Top bar:** 48px, `--panel` bg, 1px bottom border. Contains: ⌘K palette trigger (full-width search input visually, opens overlay), theme toggle, notification bell (future), user menu (future).

**Sidebar:** 240px expanded / 56px collapsed (icon-only). `--panel` bg, 1px right border. Two groups: **Workspace** (Portfolio, Deals/Workspaces, Search shortcut), **Insights** (Risk, Obligations, Entities). Settings drawer at the bottom.

**Page body:** max-width 1440px centered, 32px horizontal padding.

---

## Component contracts (v3 primitives)

### `<KpiCard>`

```tsx
<KpiCard
  label="Contracts"
  value={3}
  delta={{ value: 2, period: "30d" }}
  spark={[1, 1, 2, 2, 2, 3, 3]}
  intent="default" | "risk-critical" | "risk-high" | "risk-medium" | "risk-low"
/>
```
- 104px tall, full-width inside its grid cell
- Label: mono, 11px, uppercase, `--text-muted`
- Value: 32px, weight 600
- Delta: 12px with up/down arrow, color reflects intent
- Sparkline: 24px tall, drawn with Recharts `<LineChart>`, no axes, 1px stroke
- Hover: `--card-hover` bg, 150ms ease-out

### `<RiskPill>`

```tsx
<RiskPill level="critical" | "high" | "medium" | "low" size="sm" | "md" />
```
- One shape (rounded-sm pill), one weight (500), one case (uppercase tracking-wider)
- Background at 12% alpha of the level color, foreground at full
- 1px border in the level color at 30% alpha
- Sizes: sm = 20px height, md = 24px height
- **No exceptions.** Every risk indicator in the app uses this component.

### `<DocumentRow>` (table row)

```tsx
<DocumentRow
  filename="acme-msa-final-2026-04-22.pdf"
  pages={28}
  clauses={21}
  risk={{ critical: 6, high: 2, medium: 1, low: 12 }}
  updatedAt="2026-05-15T14:00:00Z"
  status="ready" | "processing" | "error"
/>
```
- 40px row, hover `--card-hover`
- Columns: filename (mono, truncated) | pages | clauses | risk-strip (4 colored segments showing distribution) | updated (relative time) | row actions

### `<HeatmapCell>`

```tsx
<HeatmapCell
  value={3}                   // count of clauses in this cell
  level="critical"            // dominant risk in this cell
  onClick={...}
/>
```
- 32px square
- Background = risk color at 8% + 12% per count above 1, capped at 90%
- Hover: 1px ring in `--accent`
- Click: opens filter drill-down

### `<CommandPalette>` (⌘K)

```tsx
<CommandPalette
  groups={[
    { heading: "Documents", items: [...] },
    { heading: "Actions", items: [...] },
    { heading: "Navigate", items: [...] },
  ]}
/>
```
- Overlay on `--popover`, 640px wide, vertically centered
- Triggers: ⌘K / Ctrl+K from anywhere; click on top-bar search
- Sections: Documents (search server-side), Actions (Upload, New Deal, Toggle theme), Navigate (Dashboard, Analytics, Obligations, etc)
- Keyboard nav with arrow keys + enter
- Phase 1 ships with Navigate + static Actions. Documents search wires in phase 2.

### `<EntityChip>`

```tsx
<EntityChip type="party" | "date" | "money" | "location" | "person" name="Acme Corp" count={3} />
```
- Color-coded dot by type, name in body, count badge
- Used in: knowledge graph node detail, cross-document entities table, document detail sidebar

---

## Motion budget

One delightful moment per surface. Use `framer-motion` (already a dep).

| Surface | Moment | Trigger |
|---|---|---|
| Dashboard | KPI counters count up from 0 | On mount |
| Document detail | Risk pills fade in stagger as clauses arrive | Poll while extraction job runs |
| Analytics | Heatmap cells fade in column-by-column | On mount |
| Knowledge graph | Force layout settles | On mount (free) |
| Obligations | Status pills pulse when filter changes | Filter change |
| Command palette | Slide+fade open from top | ⌘K |

No "decorative" animation. Every motion has a reason.

---

## Chart library decision

**Recharts.** Reasons:
- Smaller than Tremor (Tremor pulls a full UI kit)
- Composable primitives; not opinionated about chart chrome
- Plays well with custom tokens (no override fight)
- Already used in adjacent Macdara projects

Phase 1 uses: `LineChart` (sparklines), `BarChart` (clause distribution), `RadialBarChart` (portfolio risk score). Heatmap stays bespoke (12-line CSS grid + cell component).

---

## Surface priority

Build order, smallest-blast-radius first:

1. **Tokens + global CSS** (`tokens.css`, font loading, theme provider)
2. **Layout shell** (sidebar + topbar + page wrapper)
3. **Primitives** (KpiCard, RiskPill, DocumentRow, HeatmapCell, EntityChip)
4. **Analytics page** (pilot - shipped at `/analytics-v2` first, swap to `/analytics` after sign-off)
5. **Dashboard page**
6. **Document detail page**
7. **Obligations page**
8. **Knowledge graph page** (lightest lift - mostly fullscreen the canvas)
9. **Command palette** (⌘K) - lands alongside step 5
10. **Light theme tokens** - lands after step 8

Compare and Deals are NOT in this list; they will be reworked as bulk actions and a Workspaces concept once the core five surfaces are shipped.

---

## What success looks like

A user lands on `brightclause.com/analytics` and the page reads as a top-quartile 2026 SaaS analytics surface. Specifically:

- Geist throughout, no serif inside the app
- 4-tier dark surface with visible elevation
- Real Recharts charts, not CSS bars
- Heatmap cells respond to hover and click
- One motion moment (cell fade-in) lifts the perceived quality
- KPI cards have sparklines + deltas
- Page header has H1 + breadcrumb + action button, no decorative chrome
- ⌘K opens a working palette

If a hiring manager screenshots Analytics and posts it in a Slack channel of senior engineers, the response is "what is this product" not "this looks like a portfolio project."

---

## Out-of-scope (deferred to v4 or beyond)

- Auth, accounts, billing
- PDF inline split-pane (stays as separate route in v3)
- Compare matrix redesign
- Deals → Workspaces migration
- Light theme polish
- Mobile + tablet (desktop 1280px+ only in v3)
- E2E test rewrite (existing Playwright tests stay)
