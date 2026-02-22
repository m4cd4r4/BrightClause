import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts, centered, springs } from "../styles";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { LogoImage } from "../components/LogoImage";
import { GlowOrb } from "../components/GlowOrb";
import { FadeInSlide } from "../components/FadeInSlide";
import { ScreenshotReveal } from "../components/ScreenshotReveal";

const PILLS = ["Chat", "Risk Analysis", "Obligations", "Deals", "Reports"];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleProgress = spring({ frame: frame - 15, fps, config: springs.smooth });
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // CTA buttons
  const ctaProgress = spring({ frame: frame - 45, fps, config: springs.snappy });
  const ctaY = interpolate(ctaProgress, [0, 1], [15, 0]);

  // CTA pulse glow
  const ctaGlow = interpolate(
    frame % 60,
    [0, 30, 60],
    [4, 16, 4]
  );

  // Footer
  const footerOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <AnimatedBackground backgroundImage="assets/outro-bg.png" accentColor={colors.accent} bgImageOpacity={0.15} showGrid />
      {/* Full dashboard screenshot — final impression of the real product */}
      <ScreenshotReveal
        src="assets/screenshot-dashboard.png"
        delay={10}
        startScale={1.35}
        endScale={1.45}
        opacity={0.22}
        blur={6}
        borderRadius={0}
        perspective
        rotateX={4}
        shadow={false}
      />
      <GlowOrb pulse y="40%" maxOpacity={0.5} maxScale={1.5} />

      <div style={{ ...centered }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <LogoImage size={120} delay={5} />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 68,
            fontWeight: 600,
            color: colors.text,
            margin: 0,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          Bright<span style={{ color: colors.accent }}>Clause</span>
        </h1>

        {/* Subtitle */}
        <FadeInSlide delay={30} slideDistance={15}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 22,
              color: colors.textSoft,
              margin: "16px 0 0 0",
              fontWeight: 400,
            }}
          >
            AI-Powered Contract Analysis for M&A Due Diligence
          </p>
        </FadeInSlide>

        {/* URL */}
        <div
          style={{
            marginTop: 40,
            opacity: ctaProgress,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 22,
              fontWeight: 500,
              color: colors.accent,
              letterSpacing: "0.02em",
              textShadow: `0 0 ${ctaGlow}px ${colors.accent}80`,
            }}
          >
            brightclause.com
          </span>
        </div>

        {/* Feature pills — sine wave stagger */}
        <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
          {PILLS.map((item, i) => {
            const waveDelay = 65 + Math.sin(i * 0.8) * 5;
            const pillProgress = spring({
              frame: frame - waveDelay - i * 4,
              fps,
              config: springs.snappy,
            });
            const pillY = interpolate(pillProgress, [0, 1], [10, 0]);
            return (
              <div
                key={item}
                style={{
                  padding: "6px 14px",
                  backgroundColor: colors.bgCard,
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  color: colors.textDim,
                  opacity: pillProgress,
                  transform: `translateY(${pillY}px)`,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.mono,
          fontSize: 13,
          color: colors.textDim,
          opacity: footerOpacity,
        }}
      >
        AI-Powered Contract Intelligence — brightclause.com
      </div>
    </AbsoluteFill>
  );
};
