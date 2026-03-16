import { CSSProperties } from "react";

export const colors = {
  bg: "#0d0b08",
  bgCard: "#14120e",
  bgCardHover: "#1c1a15",
  border: "#1a1a2e",
  borderLight: "#252540",
  accent: "#c9a227",
  accentGlow: "rgba(201, 162, 39, 0.15)",
  accentBright: "#e4c040",
  text: "#eef0f6",
  textSoft: "#a0a4b8",
  textDim: "#5c5f73",
  critical: "#ff4d6a",
  high: "#ff8c42",
  medium: "#f5c542",
  low: "#34d399",
  blue: "#5b8af5",
  purple: "#9c6afa",
  cyan: "#38bdf8",
  green: "#22c55e",
};

export const fonts = {
  display: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
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
