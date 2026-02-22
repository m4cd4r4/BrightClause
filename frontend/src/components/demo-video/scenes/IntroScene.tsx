import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts, centered, springs, STAGGER } from "../styles";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { LogoImage } from "../components/LogoImage";
import { GlowOrb } from "../components/GlowOrb";
import { FadeInSlide } from "../components/FadeInSlide";
import { ScreenshotReveal } from "../components/ScreenshotReveal";

const PILLS = [
  "Chat with Contracts",
  "Risk Assessment",
  "Obligation Tracking",
  "Deal Grouping",
];

export const IntroScene: React.FC<{ mobile?: boolean }> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleProgress = spring({
    frame: frame - 20,
    fps,
    config: springs.smooth,
  });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  // Gold accent line expanding from center
  const lineWidth = interpolate(frame, [25, 60], [0, mobile ? 200 : 400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Background fade — circuits visible at start, then fade to black
  const bgFade = interpolate(frame, [50, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Exit animation
  const exitProgress = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const exitScale = interpolate(exitProgress, [0, 1], [1, 0.95]);
  const exitOpacity = interpolate(exitProgress, [0, 1], [1, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Background layers — fade to black mid-scene */}
      <div style={{ position: "absolute", inset: 0, opacity: bgFade, pointerEvents: "none" }}>
        <AnimatedBackground
          backgroundImage="assets/intro-bg.png"
          bgImageOpacity={0.18}
          accentColor={colors.accent}
          showGrid
          showScanLine
          showParticles
        />

        {/* Product screenshot floating behind — real dashboard with analysis data */}
        <ScreenshotReveal
          src="assets/journey/040-dashboard-with-analysis.png"
          delay={8}
          startScale={0.58}
          endScale={0.65}
          opacity={0.25}
          blur={2}
          borderRadius={20}
          perspective
          rotateX={6}
          y={mobile ? 300 : 170}
          shadow={false}
        />
      </div>

      <GlowOrb pulse y="42%" maxOpacity={0.4} />

      <div
        style={{
          ...centered,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <LogoImage size={mobile ? 140 : 180} delay={0} />
        </div>

        {/* Gold accent line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
            opacity: lineOpacity,
            marginBottom: 24,
            boxShadow: `0 0 12px ${colors.accent}40`,
          }}
        />

        {/* Title */}
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: mobile ? 64 : 96,
            fontWeight: 600,
            color: colors.text,
            margin: 0,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Bright<span style={{ color: colors.accent }}>Clause</span>
        </h1>

        {/* Subtitle */}
        <FadeInSlide delay={35} slideDistance={20}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: mobile ? 22 : 32,
              color: colors.textSoft,
              margin: "20px 0 0 0",
              fontWeight: 400,
              textShadow: "0 2px 20px rgba(0,0,0,0.9)",
            }}
          >
            AI-Powered Contract Intelligence
          </p>
        </FadeInSlide>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: mobile ? 10 : 16,
            marginTop: mobile ? 36 : 56,
            justifyContent: "center",
          }}
        >
          {PILLS.map((item, i) => {
            const pillProgress = spring({
              frame: frame - 50 - i * STAGGER.fast,
              fps,
              config: springs.snappy,
            });
            const pillY = interpolate(pillProgress, [0, 1], [15, 0]);
            return (
              <div
                key={item}
                style={{
                  padding: mobile ? "8px 14px" : "10px 20px",
                  backgroundColor: `${colors.bgCard}cc`,
                  backdropFilter: "blur(10px)",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  fontFamily: fonts.mono,
                  fontSize: mobile ? 14 : 18,
                  color: colors.textSoft,
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
    </AbsoluteFill>
  );
};
