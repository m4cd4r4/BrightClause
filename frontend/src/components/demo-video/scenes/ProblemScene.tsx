import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Easing,
} from "remotion";
import { colors, fonts, centered, springs } from "../styles";
import { SceneBadge } from "../components/SceneBadge";
import { GlowOrb } from "../components/GlowOrb";
import { ScreenshotReveal } from "../components/ScreenshotReveal";

const legalJargon = [
  "Notwithstanding the foregoing provisions set forth in Section 4.2(a)(iii), the aggregate",
  "liability of each Indemnifying Party under this Article VII shall not exceed an amount",
  "equal to the product of (x) the Per Share Merger Consideration multiplied by (y) the",
  "total number of Company Shares outstanding immediately prior to the Effective Time...",
];

const simpleMeaning = "Their total liability is capped at the acquisition price.";

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Gold highlight line scanning over text before blur
  const highlightY = interpolate(frame, [30, 60], [0, 120], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const highlightOpacity = interpolate(
    frame,
    [25, 35, 55, 65],
    [0, 0.6, 0.6, 0],
    { extrapolateRight: "clamp" }
  );

  const blurAmount = interpolate(frame, [60, 90], [0, 20], {
    extrapolateRight: "clamp",
  });
  const jargonOpacity = interpolate(frame, [60, 100], [1, 0], {
    extrapolateRight: "clamp",
  });

  const simpleProgress = spring({
    frame: frame - 90,
    fps,
    config: springs.smooth,
  });

  const beforeOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });
  const afterOpacity = interpolate(frame, [85, 100], [0, 1], {
    extrapolateRight: "clamp",
  });

  const arrowOpacity = interpolate(frame, [75, 88], [0, 1], {
    extrapolateRight: "clamp",
  });
  const arrowScale = spring({
    frame: frame - 75,
    fps,
    config: springs.snappy,
  });

  // 3D perspective entrance
  const leftCardRotate = interpolate(frame, [0, 25], [6, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const rightCardRotate = interpolate(frame, [80, 105], [6, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Exit
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      {/* Real clause expanded view — shows the problem being solved */}
      <ScreenshotReveal
        src="assets/journey/080-clause-critical-expanded.png"
        delay={5}
        startScale={1.45}
        endScale={1.52}
        opacity={0.10}
        blur={14}
        borderRadius={0}
        shadow={false}
      />
      <GlowOrb color={colors.critical} size={400} x="25%" y="50%" maxOpacity={0.15} delay={10} />
      <GlowOrb color={colors.low} size={400} x="75%" y="50%" maxOpacity={0.15} delay={110} />

      <SceneBadge title="The Problem" subtitle="Legal jargon is impenetrable" />

      <div
        style={{
          ...centered,
          flexDirection: "row",
          gap: 80,
          maxWidth: 1600,
          padding: "0 100px",
        }}
      >
        {/* Legal jargon block */}
        <div style={{ flex: 1, opacity: textOpacity, perspective: "800px" }}>
          <div
            style={{
              opacity: beforeOpacity,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.critical,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 16,
            }}
          >
            What you read
          </div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: 36,
              opacity: jargonOpacity,
              filter: `blur(${blurAmount}px)`,
              transform: `rotateX(${leftCardRotate}deg)`,
              transformOrigin: "center bottom",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Scanning highlight */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: highlightY,
                height: 24,
                background: `linear-gradient(180deg, transparent, ${colors.accent}30, transparent)`,
                opacity: highlightOpacity,
                pointerEvents: "none",
              }}
            />
            {legalJargon.map((line, i) => (
              <p
                key={i}
                style={{
                  fontFamily: fonts.body,
                  fontSize: 20,
                  color: colors.textSoft,
                  lineHeight: 1.8,
                  margin: 0,
                  opacity: interpolate(frame, [5 + i * 8, 20 + i * 8], [0, 1], {
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            opacity: arrowOpacity,
            transform: `scale(${Math.max(0, arrowScale)})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 11,
              color: colors.accent,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            AI
          </span>
        </div>

        {/* Simple English */}
        <div style={{ flex: 1, opacity: simpleProgress, perspective: "800px" }}>
          <div
            style={{
              opacity: afterOpacity,
              fontFamily: fonts.mono,
              fontSize: 12,
              color: colors.low,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 16,
            }}
          >
            What it actually means
          </div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.low}30`,
              padding: 36,
              boxShadow: `0 0 40px ${colors.low}10`,
              transform: `rotateX(${rightCardRotate}deg)`,
              transformOrigin: "center bottom",
            }}
          >
            <p
              style={{
                fontFamily: fonts.display,
                fontSize: 32,
                color: colors.text,
                lineHeight: 1.5,
                margin: 0,
                fontWeight: 500,
              }}
            >
              {simpleMeaning}
            </p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: colors.low,
                }}
              />
              <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.low }}>
                Low Risk — Standard market term
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
