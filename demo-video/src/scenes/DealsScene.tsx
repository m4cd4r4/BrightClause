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

export const DealsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Cards with 3D tilt entrance
  const getCardProgress = (i: number) =>
    spring({ frame: frame - 10 - i * STAGGER.slow, fps, config: springs.panel });

  // Progress bar with eased fill
  const getProgress = (i: number, target: number) => {
    const start = 30 + i * STAGGER.slow;
    return interpolate(frame, [start, start + 35], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    });
  };

  // Sequential glow sweep across cards
  const glowSweepProgress = interpolate(frame, [60, 140], [0, 3], {
    extrapolateRight: "clamp",
  });

  // File icons
  const fileIconsOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: "clamp" });

  // Exit
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      {/* Real deals page screenshot as depth layer */}
      <ScreenshotReveal
        src="assets/screenshot-deals.png"
        delay={0}
        startScale={0.6}
        endScale={0.63}
        opacity={0.08}
        blur={6}
        borderRadius={16}
        y={30}
      />
      <GlowOrb color={colors.accent} size={400} x="50%" y="50%" maxOpacity={0.08} delay={10} />

      <SceneBadge title="Deal Grouping" subtitle="Batch Upload & Aggregate Analysis" />

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: 130,
          bottom: 60,
          display: "flex",
          gap: 28,
        }}
      >
        {deals.map((deal, i) => {
          const progress = getCardProgress(i);
          const riskCol = riskColorMap[deal.risk];

          // 3D tilt: starts tilted, settles flat
          const rotateY = interpolate(progress, [0, 1], [8, 0]);
          const scale = Math.max(0, progress);

          // Glow sweep effect
          const glowDistance = Math.abs(glowSweepProgress - i);
          const glowIntensity = interpolate(glowDistance, [0, 0.8], [0.15, 0], {
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={deal.name}
              style={{
                flex: 1,
                perspective: "800px",
              }}
            >
              <div
                style={{
                  transform: `scale(${scale}) rotateY(${rotateY}deg)`,
                  transformOrigin: "center center",
                  backgroundColor: colors.bgCard,
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  height: "100%",
                  boxShadow: glowIntensity > 0
                    ? `0 0 30px ${colors.accent}${Math.floor(glowIntensity * 255).toString(16).padStart(2, "0")}`
                    : "none",
                }}
              >
                {/* Accent stripe */}
                <div style={{ height: 4, backgroundColor: riskCol }} />

                <div
                  style={{
                    padding: "28px 28px 24px 28px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 26,
                      color: colors.text,
                      fontWeight: 600,
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    {deal.name}
                  </h3>

                  {/* Risk badge */}
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: riskCol }} />
                    <span
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 12,
                        color: riskCol,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {deal.risk} Risk
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span
                        style={{
                          fontFamily: fonts.mono,
                          fontSize: 11,
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
                          fontSize: 13,
                          color: colors.accent,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {Math.floor(getProgress(i, deal.progress))}%
                      </span>
                    </div>
                    <div style={{ height: 6, backgroundColor: colors.bgCardHover, borderRadius: 3 }}>
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
                      marginTop: "auto",
                      paddingTop: 24,
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
                            fontSize={28}
                          />
                        </div>
                        <div
                          style={{
                            fontFamily: fonts.mono,
                            fontSize: 10,
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

                {/* File icons footer */}
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
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
