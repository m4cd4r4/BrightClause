import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glow
  const glowScale = interpolate(frame, [0, 40], [0.5, 1.3], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [0, 15, 80, 120], [0, 0.4, 0.4, 0.2], { extrapolateRight: "clamp" });

  // Shield logo
  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });

  // Title
  const titleProgress = spring({ frame: frame - 15, fps, config: { damping: 200 } });
  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // Subtitle
  const subProgress = spring({ frame: frame - 30, fps, config: { damping: 200 } });

  // CTA buttons
  const ctaOpacity = interpolate(frame, [45, 65], [0, 1], { extrapolateRight: "clamp" });
  const ctaY = interpolate(frame, [45, 65], [15, 0], { extrapolateRight: "clamp" });

  // Feature pills
  const pillsOpacity = interpolate(frame, [65, 85], [0, 1], { extrapolateRight: "clamp" });
  const pillsY = interpolate(frame, [65, 85], [10, 0], { extrapolateRight: "clamp" });

  // Footer
  const footerOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });

  // Grid
  const scanY = interpolate(frame, [0, 120], [-50, 1200], { extrapolateRight: "clamp" });
  const scanOpacity = interpolate(frame, [0, 10, 110, 120], [0, 0.04, 0.04, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

      {/* Grid bg */}
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
      <div style={{ position: "absolute", left: "50%", top: "40%", width: 500, height: 500,
        borderRadius: "50%", background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`,
        transform: `translate(-50%, -50%) scale(${glowScale})`, opacity: glowOpacity,
      }} />

      {/* Shield */}
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 28 }}>
        <div style={{ width: 90, height: 90, borderRadius: 20,
          background: `linear-gradient(145deg, ${colors.accent} 0%, #8b6914 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 25px 60px ${colors.accent}50, 0 0 0 1px ${colors.accent}30`,
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
              fill="rgba(6,6,10,0.5)" stroke="white" strokeWidth="1.5" />
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: fonts.display, fontSize: 68, fontWeight: 600, color: colors.text,
        margin: 0, opacity: titleProgress, transform: `translateY(${titleY}px)`,
        letterSpacing: "-0.01em", lineHeight: 1,
      }}>
        Bright<span style={{ color: colors.accent }}>Clause</span>
      </h1>

      {/* Subtitle */}
      <p style={{ fontFamily: fonts.body, fontSize: 22, color: colors.textSoft,
        margin: "16px 0 0 0", opacity: subProgress, fontWeight: 400 }}>
        AI-Powered Contract Analysis for M&A Due Diligence
      </p>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 20, marginTop: 40,
        opacity: ctaOpacity, transform: `translateY(${ctaY}px)` }}>
        <div style={{ padding: "14px 32px", backgroundColor: colors.accent, borderRadius: 8,
          fontFamily: fonts.body, fontSize: 17, fontWeight: 600, color: colors.bg,
        }}>
          Try the Demo →
        </div>
        <div style={{ padding: "14px 32px", backgroundColor: "transparent", borderRadius: 8,
          border: `2px solid ${colors.borderLight}`, fontFamily: fonts.body, fontSize: 17,
          fontWeight: 600, color: colors.textSoft,
        }}>
          View on GitHub
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 12, marginTop: 36,
        opacity: pillsOpacity, transform: `translateY(${pillsY}px)` }}>
        {["Chat", "Risk Analysis", "Obligations", "Deals", "Reports"].map((item) => (
          <div key={item} style={{ padding: "6px 14px", backgroundColor: colors.bgCard,
            borderRadius: 6, border: `1px solid ${colors.border}`,
            fontFamily: fonts.mono, fontSize: 12, color: colors.textDim,
          }}>
            {item}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 40,
        fontFamily: fonts.mono, fontSize: 13, color: colors.textDim, opacity: footerOpacity,
      }}>
        AI-Powered Contract Intelligence — brightclause.com
      </div>
    </AbsoluteFill>
  );
};
