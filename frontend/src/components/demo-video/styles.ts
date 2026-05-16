import { CSSProperties } from "react";

// Palette aligned to the v3 design tokens (see frontend/src/styles/v3-tokens.css).
export const colors = {
  bg: "#0a0a0c",
  bgCard: "#16161a",
  bgCardHover: "#1c1c22",
  border: "#27272a",
  borderLight: "#3f3f46",
  accent: "#d4a82d",
  accentGlow: "rgba(212, 168, 45, 0.15)",
  accentBright: "#e6bb3f",
  text: "#fafafa",
  textSoft: "#a1a1aa",
  textDim: "#71717a",
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#10b981",
  blue: "#60a5fa",
  purple: "#a78bfa",
  cyan: "#38bdf8",
  green: "#10b981",
};

// Geist throughout, matching the v3 system. No serif anywhere in the bundle.
export const fonts = {
  display: "var(--font-geist-sans), Inter, system-ui, sans-serif",
  body: "var(--font-geist-sans), Inter, system-ui, sans-serif",
  mono: "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace",
};

export const springs = {
  smooth: { damping: 200 },
  snappy: { damping: 20, stiffness: 200 },
  bouncy: { damping: 8 },
  heavy: { damping: 15, stiffness: 80, mass: 2 },
  logo: { damping: 12, stiffness: 80 },
  panel: { damping: 15, stiffness: 100 },
};

export const STAGGER = {
  fast: 5,
  normal: 8,
  slow: 12,
};

export const TRANSITION_FRAMES = 15;

// Scene durations (frames at 30fps)
export const SCENE_DURATIONS = {
  intro: 150,         // 5s
  problem: 150,       // 5s
  chat: 180,          // 6s
  riskDashboard: 165, // 5.5s
  obligations: 150,   // 5s
  deals: 165,         // 5.5s
  outro: 120,         // 4s
} as const;

export const centered: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "100%",
};

export const card: CSSProperties = {
  backgroundColor: colors.bgCard,
  borderRadius: 14,
  border: `1px solid ${colors.border}`,
  overflow: "hidden",
};
