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
import { ScreenshotReveal } from "../components/ScreenshotReveal";

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

interface RiskDashboardSceneProps {
  mobile?: boolean;
}

export const RiskDashboardScene: React.FC<RiskDashboardSceneProps> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const panelScale = spring({ frame: frame - 5, fps, config: springs.panel });

  const getBarScale = (i: number) => {
    return spring({
      frame: frame - 25 - i * STAGGER.normal,
      fps,
      config: springs.bouncy,
    });
  };

  const getClauseProgress = (i: number) =>
    spring({ frame: frame - 50 - i * 7, fps, config: springs.snappy });

  const statsProgress = spring({ frame: frame - 90, fps, config: springs.smooth });
  const statsY = interpolate(statsProgress, [0, 1], [12, 0]);

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

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Font sizes
  const sz = mobile
    ? { sectionLabel: 22, donutCount: 48, donutLabel: 20, legend: 24, legendPct: 22, barLabel: 26, barCount: 30, clauseType: 28, clauseCount: 30, statCount: 56, statLabel: 18 }
    : { sectionLabel: 14, donutCount: 36, donutLabel: 14, legend: 17, legendPct: 16, barLabel: 18, barCount: 22, clauseType: 20, clauseCount: 21, statCount: 50, statLabel: 15 };

  const sidePad = mobile ? 32 : 80;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      {!mobile && (
        <ScreenshotReveal
          src="assets/journey/080-clause-critical-expanded.png"
          delay={0}
          startScale={0.65}
          endScale={0.68}
          opacity={0.1}
          blur={5}
          borderRadius={16}
          y={20}
        />
      )}
      <SceneBadge title="Risk Dashboard" subtitle="Portfolio-Wide Risk Analysis" mobile={mobile} />

      <div
        style={{
          position: "absolute",
          left: sidePad,
          right: sidePad,
          top: mobile ? 0 : 120,
          bottom: mobile ? 0 : 130,
          display: "flex",
          flexDirection: mobile ? "column" : "row",
          gap: mobile ? 36 : 32,
          justifyContent: mobile ? "center" : undefined,
          alignItems: mobile ? undefined : "center",
          transform: `scale(${Math.max(0, panelScale)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Left — Donut + Risk bars */}
        <div style={{ flex: mobile ? undefined : 1.2, display: "flex", flexDirection: mobile ? "row" : "column", gap: mobile ? 36 : 24 }}>
          {/* Donut card */}
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: mobile ? "36px 32px" : "24px 28px",
              display: "flex",
              alignItems: mobile ? "center" : "center",
              gap: mobile ? 32 : 32,
              opacity: donutOpacity,
              flex: mobile ? 1 : undefined,
            }}
          >
            <svg width={mobile ? 220 : 160} height={mobile ? 220 : 160} viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
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
              <text x="90" y="85" textAnchor="middle" fill={colors.text} fontFamily={fonts.display} fontSize={sz.donutCount} fontWeight="600">
                {Math.floor(interpolate(frame, [20, 60], [0, 88], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.quad) }))}
              </text>
              <text x="90" y="108" textAnchor="middle" fill={colors.textDim} fontFamily={fonts.mono} fontSize={sz.donutLabel}>
                CLAUSES
              </text>
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: mobile ? 12 : 10 }}>
              {riskData.map((d) => (
                <div key={d.level} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: mobile ? 12 : 10, height: mobile ? 12 : 10, borderRadius: "50%", backgroundColor: d.color }} />
                  <span style={{ fontFamily: fonts.body, fontSize: sz.legend, color: colors.textSoft }}>{d.level}</span>
                  <span style={{ fontFamily: fonts.mono, fontSize: sz.legendPct, color: colors.textDim, marginLeft: "auto" }}>
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
              padding: mobile ? "36px 32px" : "24px 28px",
              flex: mobile ? 1 : undefined,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: sz.sectionLabel,
                color: colors.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: mobile ? 28 : 20,
              }}
            >
              Risk Distribution
            </div>
            {riskData.map((risk, i) => (
              <div key={risk.level} style={{ marginBottom: i < riskData.length - 1 ? (mobile ? 28 : 20) : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: sz.barLabel, color: colors.textSoft }}>
                    {risk.level}
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: sz.barCount,
                      color: risk.color,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <AnimatedCounter
                      target={risk.count}
                      delay={25 + i * STAGGER.normal}
                      color={risk.color}
                      fontSize={sz.barCount}
                      fontFamily={fonts.mono}
                      fontWeight={700}
                    />
                  </span>
                </div>
                <div style={{ height: mobile ? 10 : 8, backgroundColor: colors.bgCardHover, borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${risk.pct}%`,
                      backgroundColor: risk.color,
                      borderRadius: 4,
                      transformOrigin: "left",
                      transform: `scaleX(${getBarScale(i)})`,
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
            flex: mobile ? undefined : 1,
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            padding: mobile ? "36px 32px" : "24px 28px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: sz.sectionLabel,
              color: colors.textDim,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: mobile ? 24 : 20,
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
                  padding: mobile ? "22px 0" : "14px 0",
                  borderBottom: i < topClauses.length - 1 ? `1px solid ${colors.border}` : "none",
                  opacity: progress,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: mobile ? 10 : 8, height: mobile ? 10 : 8, borderRadius: "50%", backgroundColor: riskColor(clause.risk) }} />
                  <span style={{ fontFamily: fonts.body, fontSize: sz.clauseType, color: colors.textSoft }}>{clause.type}</span>
                </div>
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz.clauseCount,
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

        {/* Mobile inline stats */}
        {mobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 60,
              padding: "36px 0",
              opacity: statsProgress,
              transform: `translateY(${statsY}px)`,
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
            }}
          >
            {[
              { value: 88, label: "Total Clauses", color: colors.accent },
              { value: 16, label: "Documents", color: colors.text },
              { value: 15, label: "Action Items", color: colors.critical },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" as const }}>
                <div>
                  <AnimatedCounter target={stat.value} delay={90} color={stat.color} fontSize={sz.statCount} />
                </div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz.statLabel,
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
        )}
      </div>

      {/* Bottom stats — absolute on desktop, hidden on mobile (shown inline in column) */}
      {!mobile && (
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
                <AnimatedCounter target={stat.value} delay={90} color={stat.color} fontSize={sz.statCount} />
              </div>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: sz.statLabel,
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
      )}
    </AbsoluteFill>
  );
};
