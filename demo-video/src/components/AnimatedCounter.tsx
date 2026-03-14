import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { fonts } from "../styles";

interface AnimatedCounterProps {
  target: number;
  delay?: number;
  duration?: number;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  delay = 0,
  duration = 25,
  color = "#eef0f6",
  fontSize = 42,
  fontFamily = fonts.display,
  fontWeight = 600,
}) => {
  const frame = useCurrentFrame();

  const value = Math.floor(
    interpolate(frame, [delay, delay + duration], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    })
  );

  return (
    <span
      style={{
        fontFamily,
        fontSize,
        color,
        fontWeight,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  );
};
