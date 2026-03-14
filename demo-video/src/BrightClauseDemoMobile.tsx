import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { LightLeak } from "@remotion/light-leaks";
import { MobileFrame } from "./components/MobileFrame";
import { ProblemScene } from "./scenes/ProblemScene";
import { ChatScene } from "./scenes/ChatScene";
import { RiskDashboardScene } from "./scenes/RiskDashboardScene";
import { ObligationsScene } from "./scenes/ObligationsScene";
import { SearchScene } from "./scenes/SearchScene";
import { DealsScene } from "./scenes/DealsScene";
import { colors, fonts, springs } from "./styles";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { ShieldLogo } from "./components/ShieldLogo";
import { GlowOrb } from "./components/GlowOrb";
import { FadeInSlide } from "./components/FadeInSlide";

// Scene durations (slightly longer for mobile readability)
const INTRO = 130;       // 4.3s
const PROBLEM = 170;     // 5.7s
const CHAT = 200;        // 6.7s
const RISK = 170;        // 5.7s
const OBLIGATIONS = 155; // 5.2s
const SEARCH = 160;      // 5.3s
const DEALS = 170;       // 5.7s
const OUTRO = 130;       // 4.3s

const FADE_T = 15;
const SLIDE_T = 18;

// Mobile-native Intro (no desktop wrapper needed)
const MobileIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleProgress = spring({ frame: frame - 15, fps, config: springs.smooth });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const PILLS = ["Chat with Contracts", "Risk Assessment", "Obligation Tracking", "Deal Grouping"];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      <AnimatedBackground showParticles showGrid showScanLine />
      <GlowOrb pulse y="45%" maxOpacity={0.45} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "0 60px",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <ShieldLogo size={140} />
        </div>

        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 84,
            fontWeight: 600,
            color: colors.text,
            margin: 0,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            textAlign: "center",
            textShadow: "0 4px 30px rgba(0,0,0,0.8)",
          }}
        >
          Bright<span style={{ color: colors.accent }}>Clause</span>
        </h1>

        <FadeInSlide delay={30} slideDistance={20}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 34,
              color: colors.textSoft,
              margin: "24px 0 0 0",
              fontWeight: 400,
              textAlign: "center",
              textShadow: "0 2px 20px rgba(0,0,0,0.9)",
            }}
          >
            AI-Powered Contract Intelligence
          </p>
        </FadeInSlide>

        {/* Pills in 2x2 grid for mobile */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 56,
            justifyContent: "center",
            maxWidth: 700,
          }}
        >
          {PILLS.map((item, i) => {
            const pillProgress = spring({
              frame: frame - 50 - i * 6,
              fps,
              config: springs.snappy,
            });
            const pillY = interpolate(pillProgress, [0, 1], [15, 0]);
            return (
              <div
                key={item}
                style={{
                  padding: "14px 26px",
                  backgroundColor: `${colors.bgCard}cc`,
                  backdropFilter: "blur(8px)",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  fontFamily: fonts.mono,
                  fontSize: 20,
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

// Mobile-native Outro
const MobileOutro: React.FC = () => {
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
      <GlowOrb pulse y="42%" maxOpacity={0.5} maxScale={1.5} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "0 60px",
        }}
      >
        <div style={{ marginBottom: 28 }}>
          <ShieldLogo size={120} />
        </div>

        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 74,
            fontWeight: 600,
            color: colors.text,
            margin: 0,
            opacity: titleProgress,
            transform: `translateY(${titleY}px)`,
            letterSpacing: "-0.01em",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          Bright<span style={{ color: colors.accent }}>Clause</span>
        </h1>

        <FadeInSlide delay={30} slideDistance={15}>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: 30,
              color: colors.textSoft,
              margin: "20px 0 0 0",
              fontWeight: 400,
              textAlign: "center",
            }}
          >
            AI-Powered Contract Intelligence
          </p>
        </FadeInSlide>

        <div
          style={{
            marginTop: 48,
            opacity: ctaProgress,
            transform: `translateY(${ctaY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: 30,
              fontWeight: 500,
              color: colors.accent,
              letterSpacing: "0.02em",
              textShadow: `0 0 ${ctaGlow}px ${colors.accent}80`,
            }}
          >
            brightclause.com
          </span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.mono,
          fontSize: 18,
          color: colors.textDim,
          opacity: footerOpacity,
        }}
      >
        AI-Powered Contract Intelligence
      </div>
    </AbsoluteFill>
  );
};

export const BrightClauseDemoMobile: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      <TransitionSeries>
        {/* Mobile-native Intro */}
        <TransitionSeries.Sequence durationInFrames={INTRO} premountFor={30}>
          <MobileIntro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Overlay durationInFrames={25}>
          <LightLeak seed={7} hueShift={30} />
        </TransitionSeries.Overlay>

        {/* Problem — native mobile layout */}
        <TransitionSeries.Sequence durationInFrames={PROBLEM} premountFor={30}>
          <MobileFrame label="The Problem" sublabel="Legal jargon is impenetrable">
            <ProblemScene mobile />
          </MobileFrame>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: SLIDE_T })}
        />

        {/* Chat — native mobile layout */}
        <TransitionSeries.Sequence durationInFrames={CHAT} premountFor={30}>
          <MobileFrame label="Contract Q&A" sublabel="RAG-Powered Chat">
            <ChatScene mobile />
          </MobileFrame>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Risk Dashboard — native mobile layout */}
        <TransitionSeries.Sequence durationInFrames={RISK} premountFor={30}>
          <MobileFrame label="Risk Analysis" sublabel="88 Clauses Analyzed" showBranding={false}>
            <RiskDashboardScene mobile />
          </MobileFrame>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Obligations — native mobile card layout */}
        <TransitionSeries.Sequence durationInFrames={OBLIGATIONS} premountFor={30}>
          <MobileFrame label="Obligations" sublabel="Deadline Tracking" showBranding={false}>
            <ObligationsScene mobile />
          </MobileFrame>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Search & Analytics */}
        <TransitionSeries.Sequence durationInFrames={SEARCH} premountFor={30}>
          <MobileFrame label="Semantic Search" sublabel="Find Any Clause" showBranding={false}>
            <SearchScene mobile />
          </MobileFrame>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Deals — native mobile stacked cards */}
        <TransitionSeries.Sequence durationInFrames={DEALS} premountFor={30}>
          <MobileFrame label="Deal Room" sublabel="3 Active Deals" showBranding={false}>
            <DealsScene mobile />
          </MobileFrame>
        </TransitionSeries.Sequence>

        <TransitionSeries.Overlay durationInFrames={30}>
          <LightLeak seed={3} hueShift={45} />
        </TransitionSeries.Overlay>

        {/* Mobile-native Outro */}
        <TransitionSeries.Sequence durationInFrames={OUTRO} premountFor={30}>
          <MobileOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
