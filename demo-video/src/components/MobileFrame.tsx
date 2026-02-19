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

const DESKTOP_W = 1920;
const DESKTOP_H = 1080;
const MOBILE_W = 1080;
// Scale by height to fill more vertical space (clips sides of desktop)
const SCENE_TARGET_H = 850;
const SCENE_SCALE = SCENE_TARGET_H / DESKTOP_H; // ~0.787
const SCENE_SCALED_W = DESKTOP_W * SCENE_SCALE; // ~1511 (wider than mobile, clips sides)
const BADGE_CLIP = 50; // Clip top to hide duplicate SceneBadge

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

  // Vertically center the scene within available space
  const topArea = showBranding ? 220 : 80;
  const bottomArea = 160;
  const availableH = 1920 - topArea - bottomArea;
  const sceneH = SCENE_TARGET_H - BADGE_CLIP;
  const sceneTop = topArea + Math.max(0, (availableH - sceneH) / 2);

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
            height: 160,
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
          top: showBranding ? 170 : 40,
          left: 40,
          right: 40,
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

      {/* Desktop scene scaled up, centered horizontally, clips sides */}
      <div
        style={{
          position: "absolute",
          top: sceneTop,
          left: 0,
          width: MOBILE_W,
          height: sceneH,
          overflow: "hidden",
          borderRadius: 12,
          opacity: exitOpacity,
          boxShadow: `0 10px 40px rgba(0,0,0,0.5), 0 0 80px ${colors.accentGlow}`,
        }}
      >
        <div
          style={{
            width: DESKTOP_W,
            height: DESKTOP_H,
            transform: `scale(${SCENE_SCALE}) translateX(${-(DESKTOP_W - MOBILE_W / SCENE_SCALE) / 2}px) translateY(${-BADGE_CLIP / SCENE_SCALE}px)`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160,
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
