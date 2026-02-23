import { Img, staticFile, spring, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface LogoImageProps {
  size?: number;
  delay?: number;
  glowColor?: string;
  animate?: boolean;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  size = 200,
  delay = 0,
  glowColor = "#c9a227",
  animate = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = animate
    ? spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 80 } })
    : 1;

  const glowIntensity = animate
    ? interpolate(Math.sin((frame / fps) * 1.5), [-1, 1], [8, 24])
    : 12;

  const floatY = animate
    ? interpolate(Math.sin((frame / fps) * 0.8), [-1, 1], [-3, 3])
    : 0;

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        filter: `drop-shadow(0 0 ${glowIntensity}px ${glowColor}60)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "screen" }}
      />
    </div>
  );
};
