import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { colors, fonts, springs, STAGGER } from "../styles";
import { SceneBadge } from "../components/SceneBadge";
import { GlowOrb } from "../components/GlowOrb";
import { ScreenshotReveal } from "../components/ScreenshotReveal";

const searchResults = [
  { doc: "Acme Corp — Asset Purchase Agreement", section: "§4.1 Termination for Convenience", score: 0.97, risk: "Critical" },
  { doc: "TechStart Inc — Mutual NDA", section: "§3.2 Termination Rights", score: 0.94, risk: "High" },
  { doc: "GlobalTrade JV — Joint Venture Agreement", section: "§8.3 Termination Events", score: 0.89, risk: "High" },
  { doc: "Sunrise Properties — Commercial Lease", section: "§12 Early Termination Clause", score: 0.83, risk: "Medium" },
];

const analyticsStats = [
  { label: "Docs Indexed", value: "5", color: colors.accent },
  { label: "Avg Risk Score", value: "7.2", color: colors.high },
  { label: "Critical Clauses", value: "3", color: colors.critical },
];

const riskBar = (risk: string) =>
  risk === "Critical" ? colors.critical : risk === "High" ? colors.high : colors.medium;

interface SearchSceneProps {
  mobile?: boolean;
}

export const SearchScene: React.FC<SearchSceneProps> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const panelScale = spring({ frame: frame - 5, fps, config: springs.panel });

  // Search bar types in
  const query = "termination rights";
  const typedLen = Math.min(
    Math.floor(interpolate(frame, [10, 45], [0, query.length], { extrapolateRight: "clamp" })),
    query.length
  );
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const showCursor = typedLen < query.length;

  // Results stagger in
  const getResultProgress = (i: number) =>
    spring({ frame: frame - 50 - i * STAGGER.normal, fps, config: springs.snappy });
  const getResultX = (i: number) =>
    interpolate(getResultProgress(i), [0, 1], [24, 0]);

  // Analytics section
  const analyticsOpacity = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" });
  const analyticsY = interpolate(frame, [100, 115], [12, 0], { extrapolateRight: "clamp" });
  const getStatProgress = (i: number) =>
    spring({ frame: frame - 110 - i * STAGGER.normal, fps, config: springs.snappy });

  // Score bar animation
  const getScoreWidth = (i: number, score: number) => {
    const start = 55 + i * STAGGER.slow;
    return interpolate(frame, [start, start + 30], [0, score * 100], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const sz = mobile
    ? { searchText: 32, resultDoc: 28, resultSection: 26, score: 26, statsCount: 48, statsLabel: 20 }
    : { searchText: 19, resultDoc: 17, resultSection: 16, score: 15, statsCount: 38, statsLabel: 13 };

  const sidePad = mobile ? 32 : 80;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      {/* Secondary: analytics screenshot in corner */}
      {!mobile && (
        <ScreenshotReveal
          src="assets/journey/190-analytics-overview.png"
          delay={0}
          startScale={0.65}
          endScale={0.68}
          opacity={0.09}
          blur={6}
          borderRadius={16}
          y={30}
        />
      )}
      <GlowOrb color={colors.blue} size={mobile ? 300 : 400} x="60%" y="35%" maxOpacity={0.1} delay={10} />

      <SceneBadge title="Semantic Search" subtitle="Find Any Clause Across All Contracts" mobile={mobile} />

      <div
        style={{
          position: "absolute",
          left: sidePad,
          right: sidePad,
          top: mobile ? 0 : 115,
          bottom: mobile ? 0 : 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: mobile ? 28 : 20,
          transform: `scale(${Math.max(0, panelScale)})`,
          transformOrigin: "center top",
        }}
      >
        {/* Search bar */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            padding: mobile ? "22px 28px" : "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          {/* Search icon */}
          <svg width={mobile ? 24 : 18} height={mobile ? 24 : 18} viewBox="0 0 24 24" fill="none" stroke={colors.textDim} strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: sz.searchText,
              color: colors.text,
              flex: 1,
              letterSpacing: "0.01em",
            }}
          >
            {query.slice(0, typedLen)}
            {showCursor && (
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: sz.searchText + 2,
                  backgroundColor: colors.accent,
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                  opacity: cursorBlink ? 1 : 0,
                }}
              />
            )}
          </span>
          {/* Semantic badge */}
          <span
            style={{
              fontFamily: fonts.mono,
              fontSize: mobile ? 18 : 12,
              color: colors.blue,
              backgroundColor: `${colors.blue}12`,
              border: `1px solid ${colors.blue}25`,
              borderRadius: 6,
              padding: mobile ? "6px 14px" : "4px 10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Semantic
          </span>
        </div>

        {/* Results list */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "flex",
              padding: mobile ? "14px 28px" : "11px 24px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.bgCardHover,
            }}
          >
            {["Document", "Clause Section", "Relevance", "Risk"].map((h, i) => (
              <div
                key={h}
                style={{
                  flex: i === 0 ? 2 : i === 1 ? 2.5 : 1,
                  fontFamily: fonts.mono,
                  fontSize: mobile ? 18 : 12,
                  color: colors.textDim,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Result rows */}
          {searchResults.map((result, i) => {
            const progress = getResultProgress(i);
            const x = getResultX(i);
            const scoreWidth = getScoreWidth(i, result.score);
            const riskCol = riskBar(result.risk);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  padding: mobile ? "18px 28px" : "13px 24px",
                  alignItems: "center",
                  borderBottom: i < searchResults.length - 1 ? `1px solid ${colors.border}` : "none",
                  opacity: progress,
                  transform: `translateX(${x}px)`,
                }}
              >
                {/* Document name */}
                <div style={{ flex: 2, paddingRight: 12 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: sz.resultDoc, color: colors.textSoft }}>
                    {result.doc}
                  </span>
                </div>

                {/* Section */}
                <div style={{ flex: 2.5, paddingRight: 12 }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: sz.resultSection, color: colors.blue }}>
                    {result.section}
                  </span>
                </div>

                {/* Score bar + number */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, paddingRight: 12 }}>
                  <div style={{ flex: 1, height: mobile ? 6 : 4, backgroundColor: colors.bgCardHover, borderRadius: 2 }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${scoreWidth}%`,
                        backgroundColor: colors.accent,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: fonts.mono, fontSize: sz.score, color: colors.accent, minWidth: 36, textAlign: "right" as const }}>
                    {result.score.toFixed(2)}
                  </span>
                </div>

                {/* Risk badge */}
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: mobile ? 18 : 12,
                      color: riskCol,
                      backgroundColor: `${riskCol}15`,
                      border: `1px solid ${riskCol}25`,
                      borderRadius: 4,
                      padding: mobile ? "5px 12px" : "3px 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {result.risk}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Portfolio analytics strip */}
        <div
          style={{
            display: "flex",
            gap: mobile ? 20 : 16,
            opacity: analyticsOpacity,
            transform: `translateY(${analyticsY}px)`,
          }}
        >
          {analyticsStats.map((stat, i) => {
            const statProgress = Math.max(0, getStatProgress(i));
            return (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: colors.bgCard,
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  padding: mobile ? "28px 24px" : "18px 20px",
                  textAlign: "center" as const,
                  opacity: statProgress,
                  transform: `scale(${statProgress})`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz.statsCount,
                    fontWeight: 700,
                    color: stat.color,
                    fontVariantNumeric: "tabular-nums",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: sz.statsLabel,
                    color: colors.textDim,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}

          {/* Semantic vs keyword label */}
          <div
            style={{
              flex: 2,
              backgroundColor: colors.bgCard,
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              padding: mobile ? "28px 28px" : "18px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: mobile ? 16 : 12,
              opacity: Math.max(0, getStatProgress(2)),
              transform: `scale(${Math.max(0, getStatProgress(2))})`,
            }}
          >
            <div style={{ fontFamily: fonts.mono, fontSize: mobile ? 18 : 12, color: colors.textDim, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Search Mode
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Semantic", active: true, color: colors.blue },
                { label: "Keyword", active: false, color: colors.textDim },
                { label: "Hybrid", active: false, color: colors.textDim },
              ].map((mode) => (
                <span
                  key={mode.label}
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: mobile ? 18 : 12,
                    color: mode.active ? mode.color : colors.textDim,
                    backgroundColor: mode.active ? `${mode.color}12` : "transparent",
                    border: `1px solid ${mode.active ? `${mode.color}30` : colors.border}`,
                    borderRadius: 6,
                    padding: mobile ? "6px 14px" : "4px 10px",
                    letterSpacing: "0.06em",
                  }}
                >
                  {mode.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
