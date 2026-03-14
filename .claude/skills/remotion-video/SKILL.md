# BrightClause — Remotion Marketing Video

## Overview

The marketing video lives in `demo-video/` and is also embedded on the landing page via `@remotion/player`. This skill documents how to modify, rebuild, and deploy the video.

## Quick Commands

```bash
# Preview in Remotion Studio (opens browser)
cd demo-video && npm start

# Render to MP4 (for social media / GitHub)
cd demo-video && npm run build
# Output: demo-video/out/demo.mp4

# TypeScript check
cd demo-video && npx tsc --noEmit
```

## Architecture

```
demo-video/                          # Standalone Remotion project
├── src/
│   ├── index.tsx                    # Remotion root — registers composition
│   ├── BrightClauseDemo.tsx       # Scene sequencer (TransitionSeries)
│   ├── styles.ts                    # Design tokens (colors, fonts, CSS helpers)
│   └── scenes/
│       ├── IntroScene.tsx           # 4s   Shield logo, glow, pills
│       ├── ProblemScene.tsx         # 5.5s Legal jargon → plain English
│       ├── ChatScene.tsx            # 6.5s RAG Q&A typing demo
│       ├── RiskDashboardScene.tsx   # 5.5s Donut chart, risk bars
│       ├── ObligationsScene.tsx     # 5s   Deadline table, timeline
│       ├── DealsScene.tsx           # 5.5s Deal cards, progress
│       └── OutroScene.tsx           # 4s   URL, logo, footer
├── package.json
├── tsconfig.json
└── remotion.config.ts

frontend/src/components/
├── DemoVideoModal.tsx               # Landing page modal (lazy-loaded)
└── demo-video/                      # COPY of scenes for @remotion/player
    ├── BrightClauseDemo.tsx
    ├── styles.ts
    └── scenes/*.tsx
```

**IMPORTANT**: The `frontend/src/components/demo-video/` directory is a copy of the scene files. After modifying scenes in `demo-video/src/`, you MUST also copy the changed files to the frontend:

```bash
cp demo-video/src/styles.ts frontend/src/components/demo-video/styles.ts
cp demo-video/src/BrightClauseDemo.tsx frontend/src/components/demo-video/BrightClauseDemo.tsx
cp demo-video/src/scenes/*.tsx frontend/src/components/demo-video/scenes/
```

## Video Specs

| Property | Value |
|----------|-------|
| Duration | ~33 seconds (1000 frames) |
| FPS | 30 |
| Resolution | 1920 x 1080 |
| Scenes | 7 |
| Format (rendered) | MP4 (H.264) |

## Design System

### Colors (`styles.ts`)

```typescript
colors = {
  bg: "#06060a",           // Near-black background
  bgCard: "#0d0d14",       // Card backgrounds
  bgCardHover: "#12121c",  // Hover states, secondary cards
  border: "#1a1a2e",       // Borders
  accent: "#c9a227",       // Gold accent (brand)
  accentGlow: "rgba(201, 162, 39, 0.15)",
  text: "#eef0f6",         // Primary text
  textSoft: "#a0a4b8",     // Secondary text
  textDim: "#5c5f73",      // Tertiary / labels
  critical: "#ff4d6a",     // Risk: critical
  high: "#ff8c42",         // Risk: high
  medium: "#f5c542",       // Risk: medium
  low: "#34d399",          // Risk: low
  blue: "#5b8af5",         // Accent: info
  purple: "#9c6afa",       // Accent: secondary
}
```

### Fonts

| Role | Font | Fallback |
|------|------|----------|
| Display | Cormorant Garamond | Playfair Display, Georgia, serif |
| Body | DM Sans | -apple-system, sans-serif |
| Mono | JetBrains Mono | Fira Code, SF Mono, monospace |

**Note**: These are Google Fonts. Remotion loads them from CDN at render time. If you need offline rendering, use `@remotion/google-fonts` package.

## Remotion Rules (CRITICAL)

1. **ALL animations MUST use `useCurrentFrame()` + `interpolate()` or `spring()`** — CSS transitions, CSS animations, and Tailwind animate classes are FORBIDDEN
2. **Always clamp**: `{ extrapolateRight: "clamp" }` on every `interpolate()` call
3. **Spring configs**:
   - `damping: 200` = smooth, no bounce (text entrances)
   - `damping: 12-15` = standard (UI elements)
   - `damping: 8` = bouncy (playful)
4. **Frame math**: frame X at 30fps = X/30 seconds. E.g., frame 150 = 5.0 seconds
5. **Negative spring frames are fine**: `spring({ frame: frame - 100, ... })` returns 0 before frame 100

## How to Modify

### Changing the Logo

The shield logo appears in **IntroScene.tsx** and **OutroScene.tsx** as inline SVG:

```tsx
// IntroScene.tsx — lines ~50-62
<div style={{ width: 110, height: 110, borderRadius: 24,
  background: `linear-gradient(145deg, ${colors.accent} 0%, #8b6914 100%)`,
  ...
}}>
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 ..." />  <!-- Shield -->
    <path d="M9 12l2 2 4-4" />                               <!-- Checkmark -->
  </svg>
</div>
```

To replace with a custom logo:
1. Replace the `<svg>` block with your new SVG or an `<img>` tag
2. Adjust `width`/`height` on the container div
3. Update the gradient background if the logo has its own background
4. Do the same in **OutroScene.tsx** (smaller version: 90x90)
5. Copy updated files to `frontend/src/components/demo-video/scenes/`

### Adding a New Scene

1. Create `demo-video/src/scenes/NewScene.tsx`:
   ```tsx
   import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
   import { colors, fonts } from "../styles";

   export const NewScene: React.FC = () => {
     const frame = useCurrentFrame();
     const { fps } = useVideoConfig();

     const badgeOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

     return (
       <AbsoluteFill style={{ backgroundColor: colors.bg }}>
         {/* Badge */}
         <div style={{ position: "absolute", top: 48, left: 80, opacity: badgeOpacity,
           display: "flex", alignItems: "center", gap: 12 }}>
           <div style={{ padding: "6px 14px", backgroundColor: colors.accentGlow, borderRadius: 4,
             fontFamily: fonts.mono, fontSize: 13, color: colors.accent,
             textTransform: "uppercase", letterSpacing: "0.15em" }}>
             Scene Title
           </div>
           <span style={{ color: colors.textDim, fontFamily: fonts.body, fontSize: 16 }}>
             Subtitle text
           </span>
         </div>

         {/* Content here */}
       </AbsoluteFill>
     );
   };
   ```

2. Add to `BrightClauseDemo.tsx`:
   ```tsx
   import { NewScene } from "./scenes/NewScene";
   // ...
   <Sequence from={START_FRAME} durationInFrames={210}>
     <NewScene />
   </Sequence>
   ```

3. Update total `durationInFrames` in `index.tsx`

4. Copy to frontend: `cp demo-video/src/scenes/NewScene.tsx frontend/src/components/demo-video/scenes/`

### Changing Scene Duration

Edit `BrightClauseDemo.tsx` — adjust the `from` and `durationInFrames` on each `<Sequence>`. Then update `durationInFrames` in `index.tsx` to match the new total.

Current timing (with TransitionSeries, 10-frame fade overlaps):
```
Intro:       120 frames (4s)
Problem:     165 frames (5.5s)
Chat:        195 frames (6.5s)
Risk:        165 frames (5.5s)
Obligations: 150 frames (5s)
Deals:       165 frames (5.5s)
Outro:       120 frames (4s)
Total:       1000 frames ≈ 33 seconds
```

### Changing Content (Text, Data)

Each scene has its data as constants at the top of the file:
- **ProblemScene**: `legalJargon` array, `simpleMeaning` string
- **ChatScene**: `userQuestion`, `aiAnswer`, `sources` array
- **RiskDashboardScene**: `riskData`, `topClauses`
- **ObligationsScene**: `obligations`, `timelineEvents`
- **DealsScene**: `deals` array with name, docs, risk, progress, etc.

### Changing Brand Colors

Edit `demo-video/src/styles.ts` — the `colors` object. The gold accent (`#c9a227`) is used throughout. To change it, update:
- `accent` — primary brand color
- `accentGlow` — rgba version at ~15% opacity
- `accentBright` — lighter version for hover states

Then copy styles.ts to frontend.

## Deployment Checklist

After modifying the video:

1. **Preview**: `cd demo-video && npm start` — check in Remotion Studio
2. **TypeScript**: `npx tsc --noEmit` — must pass clean
3. **Copy to frontend**: Run the copy commands above
4. **Build frontend**: `cd frontend && npm run build` — verify no errors
5. **Render MP4** (optional): `cd demo-video && npm run build`
6. **Commit**: Stage both `demo-video/` and `frontend/src/components/demo-video/`
7. **Deploy**: Push to GitHub, Vercel auto-deploys frontend

## Landing Page Integration

The video modal is at `frontend/src/components/DemoVideoModal.tsx`:
- Lazy-loaded via `React.lazy()` — zero initial bundle cost
- Opens from "Watch Demo" button in hero section (`frontend/src/app/page.tsx`)
- Auto-plays on open, loops, has custom Play/Pause/Restart controls
- Portrait mobile detection shows rotate hint with dismiss option
- Close via Escape key, clicking backdrop, or X button

## Dependencies

**demo-video/package.json:**
- `remotion` ^4.0.0
- `@remotion/cli` ^4.0.0
- `react` ^18.2.0

**frontend/package.json (added):**
- `remotion` ^4.0.420
- `@remotion/player` ^4.0.420
