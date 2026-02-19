import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts, centered, springs, STAGGER } from "../styles";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { ShieldLogo } from "../components/ShieldLogo";
import { GlowOrb } from "../components/GlowOrb";
import { FadeInSlide } from "../components/FadeInSlide";
import { ScreenshotReveal } from "../components/ScreenshotReveal";

const PILLS = [
  "Chat with Contracts",
  "Risk Assessment",
  "Obligation Tracking",
  "Deal Grouping",
];

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleProgress = spring({
    frame: frame - 15,
    fps,
    config: springs.smooth,
  });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  // Exit animation in final 25 frames
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
      {/* AI-generated atmospheric background */}
      <ScreenshotReveal
        src="assets/intro-bg.png"
        delay={0}
        startScale={1.05}
        endScale={1.1}
        opacity={0.12}
        blur={12}
        borderRadius={0}
        shadow={false}
      />
      {/* Real product screenshot floating behind content */}
      <ScreenshotReveal
        src="assets/screenshot-dashboard.png"
        delay={5}
        startScale={0.55}
        endScale={0.6}
        opacity={0.18}
        blur={3}
        borderRadius={20}
        perspective
        rotateX={8}
        y={180}
        shadow={false}
      />

      <AnimatedBackground showParticles showGrid showScanLine />
      <GlowOrb pulse y="42%" maxOpacity={0.45} />

      <div
        style={{
          ...centered,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Shield */}
        <div style={{ marginBottom: 40 }}>
          <ShieldLogo size={120} />
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 96,
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
        <FadeInSlide delay={30} slideDistance={20}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 32,
              color: colors.textSoft,
              margin: "20px 0 0 0",
              fontWeight: 400,
              textShadow: "0 2px 20px rgba(0,0,0,0.9)",
            }}
          >
            AI-Powered Contract Intelligence
          </p>
        </FadeInSlide>

        {/* Pills — staggered entrance */}
        <div style={{ display: "flex", gap: 16, marginTop: 56 }}>
          {PILLS.map((item, i) => {
            const pillProgress = spring({
              frame: frame - 45 - i * STAGGER.fast,
              fps,
              config: springs.snappy,
            });
            const pillY = interpolate(pillProgress, [0, 1], [15, 0]);
            return (
              <div
                key={item}
                style={{
                  padding: "10px 20px",
                  backgroundColor: `${colors.bgCard}cc`,
                  backdropFilter: "blur(8px)",
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  fontFamily: fonts.mono,
                  fontSize: 18,
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
