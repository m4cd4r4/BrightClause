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
          <ShieldLogo size={110} />
        </div>

        {/* Title */}
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

        {/* Subtitle */}
        <FadeInSlide delay={30} slideDistance={20}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 26,
              color: colors.textSoft,
              margin: "20px 0 0 0",
              fontWeight: 400,
            }}
          >
            AI-Powered Contract Analysis for M&A Due Diligence
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
                  backgroundColor: colors.bgCard,
                  borderRadius: 8,
                  border: `1px solid ${colors.border}`,
                  fontFamily: fonts.mono,
                  fontSize: 14,
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
