import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts, springs } from "../styles";

interface SceneBadgeProps {
  title: string;
  subtitle: string;
  mobile?: boolean;
}

export const SceneBadge: React.FC<SceneBadgeProps> = ({ title, subtitle, mobile }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // In mobile mode, MobileFrame provides labels — don't render
  if (mobile) return null;

  const progress = spring({ frame, fps, config: springs.smooth });
  const x = interpolate(progress, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 80,
        opacity: progress,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 12,
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
        {title}
      </div>
      <span
        style={{
          color: colors.textDim,
          fontFamily: fonts.body,
          fontSize: 20,
        }}
      >
        {subtitle}
      </span>
    </div>
  );
};
