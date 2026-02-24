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

const legalJargon = [
  "Notwithstanding the foregoing provisions set forth in Section 4.2(a)(iii), the aggregate",
  "liability of each Indemnifying Party under this Article VII shall not exceed an amount",
  "equal to the product of (x) the Per Share Merger Consideration multiplied by (y) the",
  "total number of Company Shares outstanding immediately prior to the Effective Time...",
];

const simpleMeaning = "Their total liability is capped at the acquisition price.";

interface ProblemSceneProps {
  mobile?: boolean;
}

export const ProblemScene: React.FC<ProblemSceneProps> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const textOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

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

  const leftCardRotate = interpolate(frame, [0, 25], [6, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const rightCardRotate = interpolate(frame, [80, 105], [6, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Font sizes: desktop vs mobile
  const sz = mobile
    ? { label: 24, jargon: 34, meaning: 48, risk: 24, arrow: 60, arrowLabel: 22 }
    : { label: 15, jargon: 24, meaning: 38, risk: 16, arrow: 48, arrowLabel: 14 };

  const pad = mobile ? 40 : 100;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      <GlowOrb color={colors.critical} size={mobile ? 300 : 400} x="25%" y={mobile ? "25%" : "50%"} maxOpacity={0.15} delay={10} />

      <SceneBadge title="The Problem" subtitle="Legal jargon is impenetrable" mobile={mobile} />

      <div
        style={{
          ...centered,
          flexDirection: mobile ? "column" : "row",
          gap: mobile ? 40 : 80,
          maxWidth: mobile ? undefined : 1600,
          padding: mobile ? `20px ${pad}px` : `0 ${pad}px`,
        }}
      >
        {/* Legal jargon block */}
        <div style={{ flex: mobile ? undefined : 1, width: mobile ? "100%" : undefined, opacity: textOpacity, perspective: "800px" }}>
          <div
            style={{
              opacity: beforeOpacity,
              fontFamily: fonts.mono,
              fontSize: sz.label,
              color: colors.critical,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: mobile ? 20 : 16,
            }}
          >
            What you read
          </div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: mobile ? 40 : 36,
              opacity: jargonOpacity,
              filter: `blur(${blurAmount}px)`,
              transform: `rotateX(${leftCardRotate}deg)`,
              transformOrigin: "center bottom",
              position: "relative",
              overflow: "hidden",
            }}
          >
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
                  fontSize: sz.jargon,
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
            transform: `scale(${Math.max(0, arrowScale)}) ${mobile ? "rotate(90deg)" : ""}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <svg width={sz.arrow} height={sz.arrow} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: sz.arrowLabel,
              color: colors.accent,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              transform: mobile ? "rotate(-90deg)" : undefined,
            }}
          >
            AI
          </span>
        </div>

        {/* Simple English */}
        <div style={{ flex: mobile ? undefined : 1, width: mobile ? "100%" : undefined, opacity: simpleProgress, perspective: "800px" }}>
          <div
            style={{
              opacity: afterOpacity,
              fontFamily: fonts.mono,
              fontSize: sz.label,
              color: colors.low,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: mobile ? 20 : 16,
            }}
          >
            What it actually means
          </div>
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.low}30`,
              padding: mobile ? 40 : 36,
              boxShadow: `0 0 40px ${colors.low}10`,
              transform: `rotateX(${rightCardRotate}deg)`,
              transformOrigin: "center bottom",
            }}
          >
            <p
              style={{
                fontFamily: fonts.display,
                fontSize: sz.meaning,
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
                  width: mobile ? 10 : 8,
                  height: mobile ? 10 : 8,
                  borderRadius: "50%",
                  backgroundColor: colors.low,
                }}
              />
              <span style={{ fontFamily: fonts.mono, fontSize: sz.risk, color: colors.low }}>
                Low Risk — Standard market term
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
