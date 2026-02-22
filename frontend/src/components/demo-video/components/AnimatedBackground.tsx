import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { colors } from "../styles";

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  delay: number;
}

const PARTICLES: Particle[] = Array.from({ length: 10 }, (_, i) => ({
  x: 10 + ((i * 37 + 13) % 80),
  y: 100 + ((i * 53 + 7) % 20),
  size: 2 + (i % 3),
  speed: 0.3 + (i % 4) * 0.15,
  opacity: 0.08 + (i % 5) * 0.04,
  delay: i * 12,
}));

interface AnimatedBackgroundProps {
  backgroundImage?: string;
  bgImageOpacity?: number;
  showGrid?: boolean;
  showScanLine?: boolean;
  showParticles?: boolean;
  gridOpacity?: number;
  accentColor?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  backgroundImage,
  bgImageOpacity = 0.15,
  showGrid = true,
  showScanLine = true,
  showParticles = true,
  gridOpacity = 0.03,
  accentColor = colors.accent,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scanY = interpolate(frame, [0, durationInFrames], [-100, 1200], {
    extrapolateRight: "clamp",
  });
  const scanOpacity = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 0.06, 0.06, 0],
    { extrapolateRight: "clamp" }
  );

  // Pulsing radial glow
  const glowPulse = interpolate(
    Math.sin(frame * 0.04),
    [-1, 1],
    [0.03, 0.08]
  );

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* AI-generated background image */}
      {backgroundImage && (
        <Img
          src={staticFile(backgroundImage)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: bgImageOpacity,
          }}
        />
      )}

      {/* Pulsing radial glow overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${accentColor}${Math.round(glowPulse * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {showGrid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: gridOpacity,
            backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      )}

      {showScanLine && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: scanY,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            opacity: scanOpacity,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
        />
      )}

      {showParticles &&
        PARTICLES.map((p, i) => {
          const adjustedFrame = Math.max(0, frame - p.delay);
          const yOffset = adjustedFrame * p.speed;
          const currentY = p.y - (yOffset % 120);
          const fadeIn = interpolate(adjustedFrame, [0, 20], [0, 1], {
            extrapolateRight: "clamp",
          });
          const drift = Math.sin(adjustedFrame * 0.03 + i) * 8;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${p.x + drift}%`,
                top: `${currentY}%`,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                backgroundColor: accentColor,
                opacity: p.opacity * fadeIn,
              }}
            />
          );
        })}
    </AbsoluteFill>
  );
};
