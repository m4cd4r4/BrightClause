import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { LightLeak } from "@remotion/light-leaks";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ChatScene } from "./scenes/ChatScene";
import { RiskDashboardScene } from "./scenes/RiskDashboardScene";
import { ObligationsScene } from "./scenes/ObligationsScene";
import { SearchScene } from "./scenes/SearchScene";
import { DealsScene } from "./scenes/DealsScene";
import { OutroScene } from "./scenes/OutroScene";
import { SCENE_DURATIONS } from "./styles";

const { intro: INTRO, problem: PROBLEM, chat: CHAT, riskDashboard: RISK, obligations: OBLIGATIONS, search: SEARCH, deals: DEALS, outro: OUTRO } = SCENE_DURATIONS;

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

        {/* Intro → Problem: light leak (dramatic tone shift) */}
        <TransitionSeries.Overlay durationInFrames={25}>
          <LightLeak seed={7} hueShift={45} />
        </TransitionSeries.Overlay>

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

        {/* Chat → Risk: spring slide from bottom (data reveal) */}
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 14, stiffness: 100 } })}
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

        {/* Obligations → Search: slide from right */}
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 14, stiffness: 100 } })}
        />

        {/* Search & Analytics */}
        <TransitionSeries.Sequence durationInFrames={SEARCH} premountFor={30}>
          <SearchScene />
        </TransitionSeries.Sequence>

        {/* Search → Deals: fade */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_T })}
        />

        {/* Deals */}
        <TransitionSeries.Sequence durationInFrames={DEALS} premountFor={30}>
          <DealsScene />
        </TransitionSeries.Sequence>

        {/* Deals → Outro: light leak overlay (gold) */}
        <TransitionSeries.Overlay durationInFrames={30}>
          <LightLeak seed={3} hueShift={48} />
        </TransitionSeries.Overlay>

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={OUTRO} premountFor={30}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
