import { AbsoluteFill, Sequence } from "remotion";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { ChatScene } from "./scenes/ChatScene";
import { RiskDashboardScene } from "./scenes/RiskDashboardScene";
import { ObligationsScene } from "./scenes/ObligationsScene";
import { DealsScene } from "./scenes/DealsScene";
import { OutroScene } from "./scenes/OutroScene";

// 45 seconds at 30fps = 1350 frames
// Scene breakdown:
//   Intro:        0–150   (5s)   — Logo, tagline, feature pills
//   Problem:    150–360   (7s)   — Legal jargon → plain English
//   Chat:       360–570   (7s)   — RAG Q&A with typing + sources
//   Risk:       570–780   (7s)   — Donut chart, risk bars, clause types
//   Obligations:780–990   (7s)   — Deadline table + timeline strip
//   Deals:      990–1200  (7s)   — Deal cards with progress + stats
//   Outro:     1200–1350  (5s)   — CTA, logo, feature pills

export const ClauseLensDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#06060a" }}>
      <Sequence from={0} durationInFrames={150}>
        <IntroScene />
      </Sequence>

      <Sequence from={150} durationInFrames={210}>
        <ProblemScene />
      </Sequence>

      <Sequence from={360} durationInFrames={210}>
        <ChatScene />
      </Sequence>

      <Sequence from={570} durationInFrames={210}>
        <RiskDashboardScene />
      </Sequence>

      <Sequence from={780} durationInFrames={210}>
        <ObligationsScene />
      </Sequence>

      <Sequence from={990} durationInFrames={210}>
        <DealsScene />
      </Sequence>

      <Sequence from={1200} durationInFrames={150}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
