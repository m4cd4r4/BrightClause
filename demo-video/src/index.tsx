import { Composition, registerRoot } from "remotion";
import { BrightClauseDemo } from "./BrightClauseDemo";
import { BrightClauseDemoMobile } from "./BrightClauseDemoMobile";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrightClauseDemo"
        component={BrightClauseDemo}
        durationInFrames={1000}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BrightClauseDemoMobile"
        component={BrightClauseDemoMobile}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

registerRoot(RemotionRoot);
