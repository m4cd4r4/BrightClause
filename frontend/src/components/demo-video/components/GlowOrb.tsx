import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../styles";

interface GlowOrbProps {
  color?: string;
  size?: number;
  x?: string;
  y?: string;
  delay?: number;
  maxScale?: number;
  maxOpacity?: number;
  pulse?: boolean;
}

export const GlowOrb: React.FC<GlowOrbProps> = ({
  color = colors.accent,
  size = 500,
  x = "50%",
  y = "42%",
  delay = 0,
  maxScale = 1.2,
  maxOpacity = 0.5,
  pulse = false,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - delay);

  const scale = interpolate(adjustedFrame, [0, 40], [0.3, maxScale], {
    extrapolateRight: "clamp",
  });

  let opacity = interpolate(adjustedFrame, [0, 20], [0, maxOpacity], {
    extrapolateRight: "clamp",
  });

  if (pulse) {
    const pulseValue = Math.sin(adjustedFrame * 0.06) * 0.15;
    opacity = opacity * (0.85 + pulseValue);
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};
