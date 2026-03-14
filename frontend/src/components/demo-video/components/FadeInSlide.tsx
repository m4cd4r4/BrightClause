import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { springs } from "../styles";

interface FadeInSlideProps {
  delay?: number;
  slideDistance?: number;
  direction?: "up" | "down" | "left" | "right";
  config?: Record<string, number>;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const FadeInSlide: React.FC<FadeInSlideProps> = ({
  delay = 0,
  slideDistance = 30,
  direction = "up",
  config = springs.smooth,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({ frame: frame - delay, fps, config });
  const offset = interpolate(progress, [0, 1], [slideDistance, 0]);

  const transform =
    direction === "up"
      ? `translateY(${offset}px)`
      : direction === "down"
        ? `translateY(${-offset}px)`
        : direction === "left"
          ? `translateX(${offset}px)`
          : `translateX(${-offset}px)`;

  return (
    <div
      style={{
        opacity: progress,
        transform,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
