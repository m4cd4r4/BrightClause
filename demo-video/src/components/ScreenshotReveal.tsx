import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { springs } from "../styles";

interface ScreenshotRevealProps {
  src: string;
  delay?: number;
  startScale?: number;
  endScale?: number;
  opacity?: number;
  blur?: number;
  borderRadius?: number;
  perspective?: boolean;
  rotateX?: number;
  rotateY?: number;
  y?: number;
  shadow?: boolean;
}

export const ScreenshotReveal: React.FC<ScreenshotRevealProps> = ({
  src,
  delay = 0,
  startScale = 0.85,
  endScale = 1,
  opacity = 0.7,
  blur = 0,
  borderRadius = 16,
  perspective = false,
  rotateX = 0,
  rotateY = 0,
  y = 0,
  shadow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const revealProgress = spring({
    frame: frame - delay,
    fps,
    config: springs.smooth,
  });

  const scale = interpolate(revealProgress, [0, 1], [startScale, endScale]);
  const currentOpacity = revealProgress * opacity;

  // Slow zoom over time for cinematic feel
  const slowZoom = interpolate(
    frame,
    [delay, durationInFrames],
    [1, 1.06],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Gentle rotation animation
  const currentRotateX = interpolate(revealProgress, [0, 1], [rotateX + 4, rotateX]);
  const currentRotateY = interpolate(revealProgress, [0, 1], [rotateY, rotateY]);

  // Exit fade
  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: currentOpacity * exitOpacity,
        perspective: perspective ? "1200px" : undefined,
      }}
    >
      <div
        style={{
          transform: `
            translateY(${y}px)
            scale(${scale * slowZoom})
            rotateX(${currentRotateX}deg)
            rotateY(${currentRotateY}deg)
          `,
          transformOrigin: "center center",
          borderRadius,
          overflow: "hidden",
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          boxShadow: shadow
            ? `0 20px 60px rgba(0,0,0,0.6), 0 0 120px rgba(201,162,39,0.08)`
            : undefined,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            width: 1280,
            height: 720,
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
