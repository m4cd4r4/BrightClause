import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

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
  const { fps } = useVideoConfig();

  const badgeOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const panelScale = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 100 } });

  // Risk bar fill animations
  const getBarWidth = (i: number, pct: number) => {
    const start = 25 + i * 8;
    return interpolate(frame, [start, start + 25], [0, pct], { extrapolateRight: "clamp" });
  };

  // Counter animations
  const getCounter = (i: number, target: number) => {
    const start = 25 + i * 8;
    return Math.floor(interpolate(frame, [start, start + 25], [0, target], { extrapolateRight: "clamp" }));
  };

  // Clause list stagger
  const getClauseOpacity = (i: number) =>
    interpolate(frame, [50 + i * 7, 60 + i * 7], [0, 1], { extrapolateRight: "clamp" });
  const getClauseX = (i: number) =>
    interpolate(frame, [50 + i * 7, 60 + i * 7], [16, 0], { extrapolateRight: "clamp" });

  // Bottom stats
  const statsOpacity = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: "clamp" });
  const statsY = interpolate(frame, [90, 110], [12, 0], { extrapolateRight: "clamp" });

  // Donut chart
  const donutProgress = interpolate(frame, [20, 70], [0, 1], { extrapolateRight: "clamp" });
  const donutOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  // Build SVG donut arcs
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

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Badge */}
      <div style={{ position: "absolute", top: 48, left: 80, opacity: badgeOpacity,
        display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ padding: "6px 14px", backgroundColor: colors.accentGlow, borderRadius: 4,
          fontFamily: fonts.mono, fontSize: 13, color: colors.accent,
          textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Risk Dashboard
        </div>
        <span style={{ color: colors.textDim, fontFamily: fonts.body, fontSize: 16 }}>
          Portfolio-Wide Risk Analysis
        </span>
      </div>

      {/* Main panels */}
      <div style={{ position: "absolute", left: 80, right: 80, top: 120, bottom: 130,
        display: "flex", gap: 32,
        transform: `scale(${Math.max(0, panelScale)})`, transformOrigin: "center center",
      }}>
        {/* Left — Donut + Risk bars */}
        <div style={{ flex: 1.2, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Donut chart */}
          <div style={{ backgroundColor: colors.bgCard, borderRadius: 14,
            border: `1px solid ${colors.border}`, padding: "24px 28px",
            display: "flex", alignItems: "center", gap: 32, opacity: donutOpacity,
          }}>
            <svg width="160" height="160" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
              <circle cx="90" cy="90" r={radius} fill="none" stroke={colors.bgCardHover} strokeWidth="16" />
              {buildArcs().map((arc, i) => (
                <circle key={i} cx="90" cy="90" r={radius}
                  fill="none" stroke={arc.color} strokeWidth="16"
                  strokeDasharray={`${arc.len} ${circumference}`}
                  strokeDashoffset={-arc.offset}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                />
              ))}
              <text x="90" y="85" textAnchor="middle" fill={colors.text}
                fontFamily={fonts.display} fontSize="28" fontWeight="600">
                {getCounter(0, 88)}
              </text>
              <text x="90" y="108" textAnchor="middle" fill={colors.textDim}
                fontFamily={fonts.mono} fontSize="11">
                CLAUSES
              </text>
            </svg>

            {/* Legend */}
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
          <div style={{ backgroundColor: colors.bgCard, borderRadius: 14,
            border: `1px solid ${colors.border}`, padding: "24px 28px", flex: 1,
          }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim,
              textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>
              Risk Distribution
            </div>
            {riskData.map((risk, i) => (
              <div key={risk.level} style={{ marginBottom: i < riskData.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSoft }}>
                    {risk.level}
                  </span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 18, color: risk.color, fontWeight: 700 }}>
                    {getCounter(i, risk.count)}
                  </span>
                </div>
                <div style={{ height: 8, backgroundColor: colors.bgCardHover, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${getBarWidth(i, risk.pct)}%`,
                    backgroundColor: risk.color, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Top clauses */}
        <div style={{ flex: 1, backgroundColor: colors.bgCard, borderRadius: 14,
          border: `1px solid ${colors.border}`, padding: "24px 28px",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim,
            textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>
            Top Clause Types
          </div>
          {topClauses.map((clause, i) => (
            <div key={clause.type} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderBottom: i < topClauses.length - 1 ? `1px solid ${colors.border}` : "none",
              opacity: getClauseOpacity(i),
              transform: `translateX(${getClauseX(i)}px)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: riskColor(clause.risk) }} />
                <span style={{ fontFamily: fonts.body, fontSize: 16, color: colors.textSoft }}>
                  {clause.type}
                </span>
              </div>
              <span style={{ fontFamily: fonts.mono, fontSize: 17, color: colors.accent, fontWeight: 600 }}>
                {clause.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats strip */}
      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 80,
        opacity: statsOpacity, transform: `translateY(${statsY}px)`,
      }}>
        {[
          { value: 88, label: "Total Clauses", color: colors.accent },
          { value: 16, label: "Documents", color: colors.text },
          { value: 15, label: "Action Items", color: colors.critical },
        ].map((stat, i) => (
          <div key={stat.label} style={{ textAlign: "center" as const }}>
            <div style={{ fontFamily: fonts.display, fontSize: 42, color: stat.color, fontWeight: 600 }}>
              {getCounter(i, stat.value)}
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.textDim,
              textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
