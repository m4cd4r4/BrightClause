import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts, centered, springs } from "../styles";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ShieldLogo } from "../components/ShieldLogo";
import { GlowOrb } from "../components/GlowOrb";
import { FadeInSlide } from "../components/FadeInSlide";

const PILLS = ["Chat", "Risk Analysis", "Obligations", "Deals", "Reports"];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 15, fps, config: springs.smooth });
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  const ctaProgress = spring({ frame: frame - 45, fps, config: springs.snappy });
  const ctaY = interpolate(ctaProgress, [0, 1], [15, 0]);

  const ctaGlow = interpolate(frame % 60, [0, 30, 60], [4, 16, 4]);

  const footerOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <AnimatedBackground showParticles showGrid showScanLine />
      <GlowOrb pulse y="40%" maxOpacity={0.5} maxScale={1.5} />

      <div style={{ ...centered }}>
        <div style={{ marginBottom: 28 }}>
          <ShieldLogo size={100} />
        </div>

        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 82,
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

        <FadeInSlide delay={30} slideDistance={15}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 28,
              color: colors.textSoft,
              margin: "16px 0 0 0",
              fontWeight: 400,
            }}
          >
            AI-Powered Contract Intelligence
          </p>
        </FadeInSlide>

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
              fontSize: 28,
              fontWeight: 500,
              color: colors.accent,
              letterSpacing: "0.02em",
              textShadow: `0 0 ${ctaGlow}px ${colors.accent}80`,
            }}
          >
            brightclause.com
          </span>
        </div>

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
                  padding: "8px 16px",
                  backgroundColor: colors.bgCard,
                  borderRadius: 6,
                  border: `1px solid ${colors.border}`,
                  fontFamily: fonts.mono,
                  fontSize: 15,
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

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.mono,
          fontSize: 16,
          color: colors.textDim,
          opacity: footerOpacity,
        }}
      >
        AI-Powered Contract Intelligence — brightclause.com
      </div>
    </AbsoluteFill>
  );
};
