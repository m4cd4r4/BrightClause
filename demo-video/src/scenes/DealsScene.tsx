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
import { ScreenshotReveal } from "../components/ScreenshotReveal";

const deals = [
  { name: "Acme Corp Acquisition", docs: 12, risk: "High", progress: 78, clauses: 88, obligations: 15 },
  { name: "TechStart Series B", docs: 6, risk: "Medium", progress: 92, clauses: 42, obligations: 8 },
  { name: "GlobalTrade JV", docs: 9, risk: "Low", progress: 45, clauses: 63, obligations: 11 },
];

const riskColorMap: Record<string, string> = {
  High: colors.high,
  Medium: colors.medium,
  Low: colors.low,
};

interface DealsSceneProps {
  mobile?: boolean;
}

export const DealsScene: React.FC<DealsSceneProps> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const getCardProgress = (i: number) =>
    spring({ frame: frame - 10 - i * STAGGER.slow, fps, config: springs.panel });

  const getProgress = (i: number, target: number) => {
    const start = 30 + i * STAGGER.slow;
    return interpolate(frame, [start, start + 35], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });
  };

  const glowSweepProgress = interpolate(frame, [60, 140], [0, 3], {
    extrapolateRight: "clamp",
  });

  const fileIconsOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: "clamp" });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Font sizes
  const sz = mobile
    ? { dealName: 38, riskBadge: 22, progressLabel: 20, progressPct: 24, statCount: 40, statLabel: 16 }
    : { dealName: 32, riskBadge: 15, progressLabel: 14, progressPct: 16, statCount: 34, statLabel: 13 };

  const sidePad = mobile ? 32 : 80;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      <ScreenshotReveal
        src="assets/journey/160-deals-list.png"
        delay={0}
        startScale={0.6}
        endScale={0.63}
        opacity={0.08}
        blur={6}
        borderRadius={16}
        y={30}
      />
      <GlowOrb color={colors.accent} size={mobile ? 300 : 400} x="50%" y="50%" maxOpacity={0.08} delay={10} />

      <SceneBadge title="Deal Grouping" subtitle="Batch Upload & Aggregate Analysis" mobile={mobile} />

      <div
        style={{
          position: "absolute",
          left: sidePad,
          right: sidePad,
          top: mobile ? 0 : 130,
          bottom: mobile ? 0 : 60,
          display: "flex",
          flexDirection: mobile ? "column" : "row",
          gap: mobile ? 36 : 28,
          justifyContent: mobile ? "center" : undefined,
          alignItems: mobile ? undefined : "center",
        }}
      >
        {deals.map((deal, i) => {
          const progress = getCardProgress(i);
          const riskCol = riskColorMap[deal.risk];

          const rotateY = mobile ? 0 : interpolate(progress, [0, 1], [8, 0]);
          const scale = Math.max(0, progress);

          const glowDistance = Math.abs(glowSweepProgress - i);
          const glowIntensity = interpolate(glowDistance, [0, 0.8], [0.15, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={deal.name}
              style={{
                flex: mobile ? undefined : 1,
                perspective: mobile ? undefined : "800px",
              }}
            >
              <div
                style={{
                  transform: mobile ? `scale(${scale})` : `scale(${scale}) rotateY(${rotateY}deg)`,
                  transformOrigin: "center center",
                  backgroundColor: colors.bgCard,
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: mobile ? "row" : "column",
                  overflow: "hidden",
                  height: undefined,
                  boxShadow: glowIntensity > 0
                    ? `0 0 30px ${colors.accent}${Math.floor(glowIntensity * 255).toString(16).padStart(2, "0")}`
                    : "none",
                }}
              >
                {/* Accent stripe */}
                {mobile ? (
                  <div style={{ width: 6, backgroundColor: riskCol }} />
                ) : (
                  <div style={{ height: 4, backgroundColor: riskCol }} />
                )}

                <div
                  style={{
                    padding: mobile ? "36px 32px" : "28px 28px 24px 28px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: mobile ? "center" : undefined, gap: mobile ? 16 : undefined, flexDirection: mobile ? "row" : "column" }}>
                    <h3
                      style={{
                        fontFamily: fonts.display,
                        fontSize: sz.dealName,
                        color: colors.text,
                        fontWeight: 600,
                        margin: 0,
                        lineHeight: 1.2,
                        flex: mobile ? 1 : undefined,
                      }}
                    >
                      {deal.name}
                    </h3>

                    {/* Risk badge */}
                    <div style={{ marginTop: mobile ? 0 : 12, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <div style={{ width: mobile ? 10 : 8, height: mobile ? 10 : 8, borderRadius: "50%", backgroundColor: riskCol }} />
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: sz.riskBadge,
                          color: riskCol,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {deal.risk} Risk
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: mobile ? 28 : 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: sz.progressLabel,
                          color: colors.textDim,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Analysis Progress
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: sz.progressPct,
                          color: colors.accent,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {Math.floor(getProgress(i, deal.progress))}%
                      </span>
                    </div>
                    <div style={{ height: mobile ? 10 : 6, backgroundColor: colors.bgCardHover, borderRadius: 3 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${getProgress(i, deal.progress)}%`,
                          backgroundColor: colors.accent,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      marginTop: mobile ? 28 : 24,
                      paddingTop: mobile ? 28 : 24,
                      display: "flex",
                      gap: 20,
                      borderTop: `1px solid ${colors.border}`,
                    }}
                  >
                    {[
                      { label: "Documents", value: deal.docs, color: colors.blue },
                      { label: "Clauses", value: deal.clauses, color: colors.accent },
                      { label: "Obligations", value: deal.obligations, color: colors.purple },
                    ].map((stat) => (
                      <div key={stat.label} style={{ flex: 1, textAlign: "center" as const }}>
                        <div>
                          <AnimatedCounter
                            target={stat.value}
                            delay={25 + i * STAGGER.slow}
                            color={stat.color}
                            fontSize={sz.statCount}
                          />
                        </div>
                        <div
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: sz.statLabel,
                            color: colors.textDim,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            marginTop: 2,
                          }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* File icons footer - desktop only */}
                {!mobile && (
                  <div
                    style={{
                      padding: "12px 28px",
                      backgroundColor: colors.bgCardHover,
                      borderTop: `1px solid ${colors.border}`,
                      opacity: fileIconsOpacity,
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    {Array.from({ length: Math.min(deal.docs, 8) }).map((_, j) => (
                      <div
                        key={j}
                        style={{
                          width: 28,
                          height: 34,
                          borderRadius: 4,
                          backgroundColor: colors.bg,
                          border: `1px solid ${colors.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textDim} strokeWidth="1.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                        </svg>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
