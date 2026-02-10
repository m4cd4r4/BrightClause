import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

const deals = [
  {
    name: "Acme Corp Acquisition",
    docs: 12,
    risk: "High",
    progress: 78,
    clauses: 88,
    obligations: 15,
  },
  {
    name: "TechStart Series B",
    docs: 6,
    risk: "Medium",
    progress: 92,
    clauses: 42,
    obligations: 8,
  },
  {
    name: "GlobalTrade JV",
    docs: 9,
    risk: "Low",
    progress: 45,
    clauses: 63,
    obligations: 11,
  },
];

const riskColorMap: Record<string, string> = {
  High: colors.high,
  Medium: colors.medium,
  Low: colors.low,
};

export const DealsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Cards stagger
  const getCardScale = (i: number) =>
    spring({ frame: frame - 10 - i * 10, fps, config: { damping: 15, stiffness: 100 } });

  // Progress bar fill
  const getProgress = (i: number, target: number) => {
    const start = 30 + i * 12;
    return interpolate(frame, [start, start + 30], [0, target], { extrapolateRight: "clamp" });
  };

  // Stat counters
  const getCounter = (i: number, target: number) => {
    const start = 25 + i * 12;
    return Math.floor(interpolate(frame, [start, start + 25], [0, target], { extrapolateRight: "clamp" }));
  };

  // File icons animation
  const fileIconsOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Badge */}
      <div style={{ position: "absolute", top: 48, left: 80, opacity: badgeOpacity,
        display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ padding: "6px 14px", backgroundColor: colors.accentGlow, borderRadius: 4,
          fontFamily: fonts.mono, fontSize: 13, color: colors.accent,
          textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Deal Grouping
        </div>
        <span style={{ color: colors.textDim, fontFamily: fonts.body, fontSize: 16 }}>
          Batch Upload & Aggregate Analysis
        </span>
      </div>

      {/* Deal cards */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 130, bottom: 60,
        display: "flex", gap: 28 }}>
        {deals.map((deal, i) => {
          const scale = Math.max(0, getCardScale(i));
          const riskCol = riskColorMap[deal.risk];
          return (
            <div key={deal.name} style={{
              flex: 1,
              transform: `scale(${scale})`, transformOrigin: "center center",
              backgroundColor: colors.bgCard, borderRadius: 16,
              border: `1px solid ${colors.border}`,
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}>
              {/* Card header — accent stripe */}
              <div style={{ height: 4, backgroundColor: riskCol }} />

              <div style={{ padding: "28px 28px 24px 28px", display: "flex", flexDirection: "column", flex: 1 }}>
                {/* Deal name */}
                <h3 style={{ fontFamily: fonts.display, fontSize: 26, color: colors.text,
                  fontWeight: 600, margin: 0, lineHeight: 1.2 }}>
                  {deal.name}
                </h3>

                {/* Risk badge */}
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: riskCol }} />
                  <span style={{ fontFamily: fonts.mono, fontSize: 12, color: riskCol,
                    textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {deal.risk} Risk
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim,
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Analysis Progress
                    </span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.accent }}>
                      {Math.floor(getProgress(i, deal.progress))}%
                    </span>
                  </div>
                  <div style={{ height: 6, backgroundColor: colors.bgCardHover, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${getProgress(i, deal.progress)}%`,
                      backgroundColor: colors.accent, borderRadius: 3 }} />
                  </div>
                </div>

                {/* Stats */}
                <div style={{ marginTop: "auto", paddingTop: 24,
                  display: "flex", gap: 20, borderTop: `1px solid ${colors.border}` }}>
                  {[
                    { label: "Documents", value: deal.docs, color: colors.blue },
                    { label: "Clauses", value: deal.clauses, color: colors.accent },
                    { label: "Obligations", value: deal.obligations, color: colors.purple },
                  ].map((stat) => (
                    <div key={stat.label} style={{ flex: 1, textAlign: "center" as const }}>
                      <div style={{ fontFamily: fonts.display, fontSize: 28, color: stat.color, fontWeight: 600 }}>
                        {getCounter(i, stat.value)}
                      </div>
                      <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim,
                        textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* File icons footer */}
              <div style={{ padding: "12px 28px", backgroundColor: colors.bgCardHover,
                borderTop: `1px solid ${colors.border}`, opacity: fileIconsOpacity,
                display: "flex", gap: 6, flexWrap: "wrap",
              }}>
                {Array.from({ length: Math.min(deal.docs, 8) }).map((_, j) => (
                  <div key={j} style={{ width: 28, height: 34, borderRadius: 4,
                    backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={colors.textDim} strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
