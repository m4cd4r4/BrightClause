import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts, centered } from "../styles";

const legalJargon = [
  "Notwithstanding the foregoing provisions set forth in Section 4.2(a)(iii), the aggregate",
  "liability of each Indemnifying Party under this Article VII shall not exceed an amount",
  "equal to the product of (x) the Per Share Merger Consideration multiplied by (y) the",
  "total number of Company Shares outstanding immediately prior to the Effective Time...",
];

const simpleMeaning = "Their total liability is capped at the acquisition price.";

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Legal text appears
  const textOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  // Blur / dissolve the legal text
  const blurAmount = interpolate(frame, [80, 120], [0, 20], { extrapolateRight: "clamp" });
  const jargonOpacity = interpolate(frame, [80, 130], [1, 0], { extrapolateRight: "clamp" });

  // Simple text appears
  const simpleProgress = spring({ frame: frame - 120, fps, config: { damping: 200 } });

  // "Before / After" labels
  const beforeOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const afterOpacity = interpolate(frame, [115, 130], [0, 1], { extrapolateRight: "clamp" });

  // Arrow
  const arrowOpacity = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" });
  const arrowScale = spring({ frame: frame - 100, fps, config: { damping: 15, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, ...centered }}>
      {/* Scene badge */}
      <div style={{ position: "absolute", top: 48, left: 80,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ padding: "6px 14px", backgroundColor: colors.accentGlow, borderRadius: 4,
          fontFamily: fonts.mono, fontSize: 13, color: colors.accent,
          textTransform: "uppercase", letterSpacing: "0.15em",
        }}>
          The Problem
        </div>
        <span style={{ color: colors.textDim, fontFamily: fonts.body, fontSize: 16 }}>
          Legal jargon is impenetrable
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 80, maxWidth: 1600, padding: "0 100px" }}>
        {/* Legal jargon block */}
        <div style={{ flex: 1, opacity: textOpacity }}>
          <div style={{ opacity: beforeOpacity, fontFamily: fonts.mono, fontSize: 12,
            color: colors.critical, textTransform: "uppercase", letterSpacing: "0.15em",
            marginBottom: 16,
          }}>
            What you read
          </div>
          <div style={{
            ...( { backgroundColor: colors.bgCard, borderRadius: 14,
              border: `1px solid ${colors.border}`, padding: 36 } ),
            opacity: jargonOpacity,
            filter: `blur(${blurAmount}px)`,
          }}>
            {legalJargon.map((line, i) => (
              <p key={i} style={{ fontFamily: fonts.body, fontSize: 20, color: colors.textSoft,
                lineHeight: 1.8, margin: 0,
                opacity: interpolate(frame, [5 + i * 8, 20 + i * 8], [0, 1], { extrapolateRight: "clamp" }),
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ opacity: arrowOpacity, transform: `scale(${Math.max(0, arrowScale)})`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.accent,
            textTransform: "uppercase", letterSpacing: "0.2em",
          }}>
            AI
          </span>
        </div>

        {/* Simple English */}
        <div style={{ flex: 1, opacity: simpleProgress }}>
          <div style={{ opacity: afterOpacity, fontFamily: fonts.mono, fontSize: 12,
            color: colors.low, textTransform: "uppercase", letterSpacing: "0.15em",
            marginBottom: 16,
          }}>
            What it actually means
          </div>
          <div style={{ backgroundColor: colors.bgCard, borderRadius: 14,
            border: `1px solid ${colors.low}30`, padding: 36,
            boxShadow: `0 0 40px ${colors.low}10`,
          }}>
            <p style={{ fontFamily: fonts.display, fontSize: 32, color: colors.text,
              lineHeight: 1.5, margin: 0, fontWeight: 500,
            }}>
              {simpleMeaning}
            </p>
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: colors.low }} />
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
