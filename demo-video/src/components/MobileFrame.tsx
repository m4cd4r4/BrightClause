import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts, springs } from "../styles";

interface MobileFrameProps {
  children: React.ReactNode;
  label: string;
  sublabel?: string;
  showBranding?: boolean;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  label,
  sublabel,
  showBranding = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const labelProgress = spring({ frame: frame - 3, fps, config: springs.smooth });
  const labelY = interpolate(labelProgress, [0, 1], [10, 0]);

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Layout areas
  const brandingH = showBranding ? 140 : 0;
  const labelH = 60;
  const ctaH = 120;
  const contentTop = brandingH + labelH;
  const contentBottom = ctaH;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Top branding bar */}
      {showBranding && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: brandingH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: exitOpacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 42,
              fontWeight: 600,
              color: colors.text,
              letterSpacing: "-0.01em",
            }}
          >
            Bright<span style={{ color: colors.accent }}>Clause</span>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              color: colors.textDim,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            AI Contract Intelligence
          </div>
        </div>
      )}

      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: showBranding ? brandingH : 20,
          left: 40,
          right: 40,
          height: labelH,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: labelProgress * exitOpacity,
          transform: `translateY(${labelY}px)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "6px 14px",
            backgroundColor: colors.accentGlow,
            borderRadius: 4,
            fontFamily: fonts.mono,
            fontSize: 16,
            color: colors.accent,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
          }}
        >
          {label}
        </div>
        {sublabel && (
          <span
            style={{
              color: colors.textDim,
              fontFamily: fonts.body,
              fontSize: 18,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>

      {/* Native content area — children render at full mobile resolution */}
      <div
        style={{
          position: "absolute",
          top: contentTop,
          left: 0,
          right: 0,
          bottom: contentBottom,
          overflow: "hidden",
          opacity: exitOpacity,
        }}
      >
        {children}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: ctaH,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          opacity: exitOpacity,
        }}
      >
        <div
          style={{
            width: 60,
            height: 2,
            backgroundColor: colors.accent,
            borderRadius: 1,
            opacity: 0.4,
          }}
        />
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 18,
            color: colors.accent,
            letterSpacing: "0.02em",
          }}
        >
          brightclause.com
        </span>
      </div>
    </AbsoluteFill>
  );
};
