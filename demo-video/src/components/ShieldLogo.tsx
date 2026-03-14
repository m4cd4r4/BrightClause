import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { colors, springs } from "../styles";

interface ShieldLogoProps {
  size?: number;
  delay?: number;
}

export const ShieldLogo: React.FC<ShieldLogoProps> = ({
  size = 110,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: springs.logo,
  });

  const iconSize = Math.round(size * 0.55);

  return (
    <div style={{ transform: `scale(${scale})` }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          background: `linear-gradient(145deg, ${colors.accent} 0%, #8b6914 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 ${Math.round(size * 0.27)}px ${Math.round(size * 0.73)}px ${colors.accent}50, 0 0 0 1px ${colors.accent}30`,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
            fill="rgba(6,6,10,0.5)"
            stroke="white"
            strokeWidth="1.5"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
