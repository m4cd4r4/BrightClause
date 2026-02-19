import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts, centered } from "../styles";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowScale = interpolate(frame, [0, 40], [0.3, 1.2], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [0, 20, 100, 150], [0, 0.5, 0.5, 0.25], {
    extrapolateRight: "clamp",
  });

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });

  const titleProgress = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const subProgress = spring({ frame: frame - 40, fps, config: { damping: 200 } });

  const pillsOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const pillsY = interpolate(frame, [60, 80], [20, 0], { extrapolateRight: "clamp" });

  const scanY = interpolate(frame, [0, 150], [-100, 1200], { extrapolateRight: "clamp" });
  const scanOpacity = interpolate(frame, [0, 10, 140, 150], [0, 0.06, 0.06, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, ...centered }}>
      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.02,
        backgroundImage: `linear-gradient(to right, ${colors.accent} 1px, transparent 1px),
          linear-gradient(to bottom, ${colors.accent} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />

      {/* Scan line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: scanY, height: 2,
        background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
        opacity: scanOpacity,
      }} />

      {/* Glow */}
      <div style={{ position: "absolute", left: "50%", top: "42%", width: 500, height: 500,
        borderRadius: "50%", background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`,
        transform: `translate(-50%, -50%) scale(${glowScale})`, opacity: glowOpacity,
      }} />

      {/* Shield */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 40 }}>
        <div style={{ width: 110, height: 110, borderRadius: 24,
          background: `linear-gradient(145deg, ${colors.accent} 0%, #8b6914 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 30px 80px ${colors.accent}50, 0 0 0 1px ${colors.accent}30`,
        }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
              fill="rgba(6,6,10,0.5)" stroke="white" strokeWidth="1.5" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: fonts.display, fontSize: 82, fontWeight: 600, color: colors.text,
        margin: 0, opacity: titleProgress, transform: `translateY(${titleY}px)`,
        letterSpacing: "-0.01em", lineHeight: 1,
      }}>
        Bright<span style={{ color: colors.accent }}>Clause</span>
      </h1>

      {/* Subtitle */}
      <p style={{ fontFamily: fonts.body, fontSize: 26, color: colors.textSoft,
        margin: "20px 0 0 0", opacity: subProgress, fontWeight: 400,
      }}>
        AI-Powered Contract Intelligence
      </p>

      {/* Pills */}
      <div style={{ display: "flex", gap: 16, marginTop: 56, opacity: pillsOpacity,
        transform: `translateY(${pillsY}px)`,
      }}>
        {["Chat with Contracts", "Risk Assessment", "Obligation Tracking", "Deal Grouping"].map((item) => (
          <div key={item} style={{ padding: "10px 20px", backgroundColor: colors.bgCard,
            borderRadius: 8, border: `1px solid ${colors.border}`,
            fontFamily: fonts.mono, fontSize: 14, color: colors.textSoft,
          }}>
            {item}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
