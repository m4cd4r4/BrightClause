import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { LightLeak } from "@remotion/light-leaks";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ChatScene } from "./scenes/ChatScene";
import { RiskDashboardScene } from "./scenes/RiskDashboardScene";
import { ObligationsScene } from "./scenes/ObligationsScene";
import { DealsScene } from "./scenes/DealsScene";
import { OutroScene } from "./scenes/OutroScene";

// Scene durations (frames at 30fps)
const INTRO = 120;       // 4s
const PROBLEM = 165;     // 5.5s
const CHAT = 195;        // 6.5s
const RISK = 165;        // 5.5s
const OBLIGATIONS = 150; // 5s
const DEALS = 165;       // 5.5s
const OUTRO = 120;       // 4s

// Transition durations
const FADE_T = 15;
const SLIDE_T = 20;

export const BrightClauseDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#06060a" }}>
      <TransitionSeries>
        {/* Intro */}
        <TransitionSeries.Sequence durationInFrames={INTRO} premountFor={30}>
          <IntroScene />
        </TransitionSeries.Sequence>

        {/* Intro → Problem: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Problem */}
        <TransitionSeries.Sequence durationInFrames={PROBLEM} premountFor={30}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        {/* Problem → Chat: slide from left */}
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: SLIDE_T })}
        />

        {/* Chat */}
        <TransitionSeries.Sequence durationInFrames={CHAT} premountFor={30}>
          <ChatScene />
        </TransitionSeries.Sequence>

        {/* Chat → Risk: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Risk Dashboard */}
        <TransitionSeries.Sequence durationInFrames={RISK} premountFor={30}>
          <RiskDashboardScene />
        </TransitionSeries.Sequence>

        {/* Risk → Obligations: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Obligations */}
        <TransitionSeries.Sequence durationInFrames={OBLIGATIONS} premountFor={30}>
          <ObligationsScene />
        </TransitionSeries.Sequence>

        {/* Obligations → Deals: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Deals */}
        <TransitionSeries.Sequence durationInFrames={DEALS} premountFor={30}>
          <DealsScene />
        </TransitionSeries.Sequence>

        {/* Deals → Outro: light leak overlay */}
        <TransitionSeries.Overlay durationInFrames={30}>
          <LightLeak seed={3} hueShift={45} />
        </TransitionSeries.Overlay>

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={OUTRO} premountFor={30}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
