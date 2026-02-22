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

const userQuestion = "What are the termination rights in this contract?";

const aiAnswer = `The contract contains two termination provisions:

1. Either party may terminate with 90 days written notice (§4.1)
2. Immediate termination for material breach with 30-day cure period (§4.2)

The change-of-control clause in §9.3 also triggers automatic termination rights.`;

const sources = [
  { page: 4, section: "§4.1", label: "Termination for Convenience" },
  { page: 5, section: "§4.2", label: "Termination for Cause" },
  { page: 12, section: "§9.3", label: "Change of Control" },
];

interface ChatSceneProps {
  mobile?: boolean;
}

export const ChatScene: React.FC<ChatSceneProps> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const windowScale = spring({ frame: frame - 5, fps, config: springs.panel });
  const shadowSpread = interpolate(Math.max(0, windowScale), [0, 1], [0, 40], {
    extrapolateRight: "clamp",
  });

  const typedLen = Math.min(
    Math.floor(interpolate(frame, [20, 60], [0, userQuestion.length], { extrapolateRight: "clamp" })),
    userQuestion.length
  );
  const cursorBlink = Math.floor(frame / 15) % 2 === 0;
  const showCursor = typedLen < userQuestion.length;

  const dotsOpacity = interpolate(frame, [65, 75, 85, 90], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  const aiOpacity = interpolate(frame, [90, 105], [0, 1], { extrapolateRight: "clamp" });
  const aiY = interpolate(frame, [90, 105], [15, 0], { extrapolateRight: "clamp" });

  const answerLines = aiAnswer.split("\n").filter(Boolean);

  const getSourceProgress = (i: number) =>
    spring({ frame: frame - 135 - i * STAGGER.normal, fps, config: springs.snappy });

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Font sizes
  const sz = mobile
    ? { header: 24, user: 32, ai: 30, sourcesLabel: 22, srcPage: 22, srcSection: 20, dots: 12 }
    : { header: 16, user: 22, ai: 21, sourcesLabel: 14, srcPage: 15, srcSection: 14, dots: 8 };

  const sidePad = mobile ? 32 : 120;
  const topPad = mobile ? 0 : 130;
  const bottomPad = mobile ? 0 : 60;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      <ScreenshotReveal
        src="assets/chat-bg.png"
        delay={0}
        startScale={1.05}
        endScale={1.1}
        opacity={0.1}
        blur={14}
        borderRadius={0}
        shadow={false}
      />
      {!mobile && (
        <ScreenshotReveal
          src="assets/screenshot-risk.png"
          delay={0}
          startScale={0.7}
          endScale={0.72}
          opacity={0.08}
          blur={6}
          borderRadius={12}
          y={40}
        />
      )}
      <GlowOrb color={colors.blue} size={mobile ? 300 : 350} x="50%" y="50%" maxOpacity={0.12} delay={5} />

      <SceneBadge title="Contract Q&A" subtitle="RAG-Powered Chat — Ask Anything" mobile={mobile} />

      <div
        style={{
          position: "absolute",
          left: sidePad,
          right: sidePad,
          top: topPad,
          bottom: bottomPad,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transform: `scale(${Math.max(0, windowScale)})`,
          transformOrigin: "center center",
        }}
      >
        <div
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            display: "flex",
            flexDirection: "column",
            boxShadow: `0 ${shadowSpread}px ${shadowSpread * 2}px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: mobile ? "18px 28px" : "16px 28px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#febc2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28c840" }} />
            </div>
            <span style={{ fontFamily: fonts.mono, fontSize: sz.header, color: colors.textDim, marginLeft: 8 }}>
              Acme-TechStart-Acquisition.pdf — Chat
            </span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: mobile ? 36 : 32, display: "flex", flexDirection: "column", gap: mobile ? 28 : 24, overflow: "hidden" }}>
            {/* User message */}
            <div style={{ alignSelf: "flex-end", maxWidth: mobile ? "90%" : "65%" }}>
              <div
                style={{
                  backgroundColor: `${colors.accent}20`,
                  borderRadius: "16px 16px 4px 16px",
                  padding: mobile ? "20px 26px" : "16px 22px",
                  border: `1px solid ${colors.accent}30`,
                }}
              >
                <p style={{ fontFamily: fonts.body, fontSize: sz.user, color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  {userQuestion.slice(0, typedLen)}
                  {showCursor && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: sz.user + 2,
                        backgroundColor: colors.accent,
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                        opacity: cursorBlink ? 1 : 0,
                      }}
                    />
                  )}
                </p>
              </div>
            </div>

            {/* Thinking dots */}
            {dotsOpacity > 0 && (
              <div style={{ alignSelf: "flex-start", opacity: dotsOpacity }}>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: mobile ? "16px 24px" : "12px 20px",
                    backgroundColor: colors.bgCardHover,
                    borderRadius: "16px 16px 16px 4px",
                  }}
                >
                  {[0, 1, 2].map((i) => {
                    const bobY = Math.sin(frame * 0.2 + i * 1.2) * 3;
                    return (
                      <div
                        key={i}
                        style={{
                          width: sz.dots,
                          height: sz.dots,
                          borderRadius: "50%",
                          backgroundColor: colors.textDim,
                          transform: `translateY(${bobY}px)`,
                          opacity: 0.5 + Math.sin(frame * 0.15 + i * 1.5) * 0.3,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI response */}
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: mobile ? "95%" : "75%",
                opacity: aiOpacity,
                transform: `translateY(${aiY}px)`,
              }}
            >
              <div
                style={{
                  backgroundColor: colors.bgCardHover,
                  borderRadius: "16px 16px 16px 4px",
                  padding: mobile ? "24px 30px" : "20px 26px",
                  border: `1px solid ${colors.border}`,
                }}
              >
                {answerLines.map((line, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: fonts.body,
                      fontSize: sz.ai,
                      color: colors.textSoft,
                      margin: i > 0 ? "8px 0 0 0" : 0,
                      lineHeight: 1.6,
                      opacity: interpolate(
                        frame,
                        [95 + i * STAGGER.normal, 105 + i * STAGGER.normal],
                        [0, 1],
                        { extrapolateRight: "clamp" }
                      ),
                    }}
                  >
                    {line}
                  </p>
                ))}

                {/* Sources */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: `1px solid ${colors.border}`,
                    display: "flex",
                    gap: mobile ? 12 : 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: sz.sourcesLabel,
                      color: colors.textDim,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginRight: 4,
                      opacity: interpolate(frame, [130, 140], [0, 1], { extrapolateRight: "clamp" }),
                    }}
                  >
                    Sources:
                  </span>
                  {sources.map((src, i) => {
                    const progress = getSourceProgress(i);
                    const slideX = interpolate(progress, [0, 1], [20, 0]);
                    return (
                      <div
                        key={src.section}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: mobile ? "6px 14px" : "4px 10px",
                          backgroundColor: `${colors.blue}15`,
                          borderRadius: 6,
                          border: `1px solid ${colors.blue}25`,
                          opacity: progress,
                          transform: `translateX(${slideX}px)`,
                        }}
                      >
                        <span style={{ fontFamily: fonts.mono, fontSize: sz.srcPage, color: colors.blue, fontWeight: 600 }}>
                          p.{src.page}
                        </span>
                        <span style={{ fontFamily: fonts.mono, fontSize: sz.srcSection, color: colors.textDim }}>
                          {src.section}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
