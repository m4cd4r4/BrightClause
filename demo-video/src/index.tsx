import { Composition, registerRoot } from "remotion";
import { BrightClauseDemo } from "./BrightClauseDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BrightClauseDemo"
        component={BrightClauseDemo}
        durationInFrames={1000} // ~33s at 30fps (scenes - transition overlaps)
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
