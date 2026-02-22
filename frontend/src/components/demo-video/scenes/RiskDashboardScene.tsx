import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts, springs, STAGGER } from "../styles";
import { SceneBadge } from "../components/SceneBadge";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { GlowOrb } from "../components/GlowOrb";

const riskData = [
  { level: "Critical", count: 3, color: colors.critical, pct: 3 },
  { level: "High", count: 12, color: colors.high, pct: 14 },
  { level: "Medium", count: 28, color: colors.medium, pct: 32 },
  { level: "Low", count: 45, color: colors.low, pct: 51 },
];

const topClauses = [
  { type: "Termination", count: 18, risk: "Critical" },
  { type: "Change of Control", count: 14, risk: "High" },
  { type: "IP Assignment", count: 12, risk: "High" },
  { type: "Indemnification", count: 11, risk: "Medium" },
  { type: "Non-Compete", count: 8, risk: "Medium" },
];

const riskColor = (r: string) =>
  r === "Critical" ? colors.critical : r === "High" ? colors.high : colors.medium;

export const RiskDashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const panelScale = spring({ frame: frame - 5, fps, config: springs.panel });

  // Risk bars with bouncy spring
  const getBarWidth = (i: number, pct: number) => {
    const s = spring({
      frame: frame - 25 - i * STAGGER.normal,
      fps,
      config: springs.bouncy,
    });
    return s * pct;
  };

  // Clause stagger
  const getClauseProgress = (i: number) =>
    spring({ frame: frame - 50 - i * 7, fps, config: springs.snappy });

  // Bottom stats
  const statsProgress = spring({ frame: frame - 90, fps, config: springs.smooth });
  const statsY = interpolate(statsProgress, [0, 1], [12, 0]);

  // Donut chart — eased
  const donutProgress = interpolate(frame, [20, 70], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const donutOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const buildArcs = () => {
    let offset = 0;
    return riskData.map((d) => {
      const len = (d.pct / 100) * circumference * donutProgress;
      const gap = 4;
      const arc = { offset, len: Math.max(0, len - gap), color: d.color };
      offset += (d.pct / 100) * circumference;
      return arc;
    });
  };

  // Exit
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      <GlowOrb color={colors.accent} size={300} x="30%" y="45%" maxOpacity={0.1} delay={15} />

      <SceneBadge title="Risk Dashboard" subtitle="Portfolio-Wide Risk Analysis" />

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 120,
          bottom: 130,
          display: "flex",
          gap: 32,
          transform: `scale(${Math.max(0, panelScale)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Left — Donut + Risk bars */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 32,
              opacity: donutOpacity,
            }}
          >
            <svg width="160" height="160" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
              <circle cx="90" cy="90" r={radius} fill="none" stroke={colors.bgCardHover} strokeWidth="16" />
              {buildArcs().map((arc, i) => (
                <circle
                  key={i}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth="16"
                  strokeDasharray={`${arc.len} ${circumference}`}
                  strokeDashoffset={-arc.offset}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                />
              ))}
              <text x="90" y="85" textAnchor="middle" fill={colors.text} fontFamily={fonts.display} fontSize="28" fontWeight="600">
                {Math.floor(interpolate(frame, [20, 60], [0, 88], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }))}
              </text>
              <text x="90" y="108" textAnchor="middle" fill={colors.textDim} fontFamily={fonts.mono} fontSize="11">
                CLAUSES
              </text>
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {riskData.map((d) => (
                <div key={d.level} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: d.color }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textSoft }}>{d.level}</span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textDim, marginLeft: "auto" }}>
                    {d.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk bars */}
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: "24px 28px",
              flex: 1,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 11,
                color: colors.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 20,
              }}
            >
              Risk Distribution
            </div>
            {riskData.map((risk, i) => (
              <div key={risk.level} style={{ marginBottom: i < riskData.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSoft }}>
                    {risk.level}
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 18,
                      color: risk.color,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <AnimatedCounter
                      target={risk.count}
                      delay={25 + i * STAGGER.normal}
                      color={risk.color}
                      fontSize={18}
                      fontFamily={fonts.mono}
                      fontWeight={700}
                    />
                  </span>
                </div>
                <div style={{ height: 8, backgroundColor: colors.bgCardHover, borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${getBarWidth(i, risk.pct)}%`,
                      backgroundColor: risk.color,
                      borderRadius: 4,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Top clauses */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.textDim,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 20,
            }}
          >
            Top Clause Types
          </div>
          {topClauses.map((clause, i) => {
            const progress = getClauseProgress(i);
            const x = interpolate(progress, [0, 1], [16, 0]);
            return (
              <div
                key={clause.type}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 0",
                  borderBottom: i < topClauses.length - 1 ? `1px solid ${colors.border}` : "none",
                  opacity: progress,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: riskColor(clause.risk) }} />
                  <span style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textSoft }}>{clause.type}</span>
                </div>
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 17,
                    color: colors.accent,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {clause.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom stats */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 80,
          opacity: statsProgress,
          transform: `translateY(${statsY}px)`,
        }}
      >
        {[
          { value: 88, label: "Total Clauses", color: colors.accent },
          { value: 16, label: "Documents", color: colors.text },
          { value: 15, label: "Action Items", color: colors.critical },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: "center" as const }}>
            <div>
              <AnimatedCounter target={stat.value} delay={90} color={stat.color} fontSize={42} />
            </div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 12,
                color: colors.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
