import { Composition, registerRoot } from "remotion";
import { ContractClarityDemo } from "./ContractClarityDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ContractClarityDemo"
        component={ContractClarityDemo}
        durationInFrames={1350} // 45 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
