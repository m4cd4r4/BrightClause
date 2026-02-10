import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

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

export const ChatScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Chat window
  const windowScale = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 100 } });

  // User message typing
  const typedLen = Math.min(
    Math.floor(interpolate(frame, [25, 75], [0, userQuestion.length], { extrapolateRight: "clamp" })),
    userQuestion.length
  );

  // Thinking dots
  const dotsOpacity = interpolate(frame, [80, 90, 100, 105], [0, 1, 1, 0], { extrapolateRight: "clamp" });

  // AI response
  const aiOpacity = interpolate(frame, [105, 120], [0, 1], { extrapolateRight: "clamp" });
  const aiY = interpolate(frame, [105, 120], [15, 0], { extrapolateRight: "clamp" });

  // Answer text reveal (line by line)
  const answerLines = aiAnswer.split("\n").filter(Boolean);
  const getLineOpacity = (i: number) =>
    interpolate(frame, [110 + i * 8, 120 + i * 8], [0, 1], { extrapolateRight: "clamp" });

  // Sources
  const sourcesOpacity = interpolate(frame, [155, 170], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Badge */}
      <div style={{ position: "absolute", top: 48, left: 80, opacity: badgeOpacity,
        display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ padding: "6px 14px", backgroundColor: colors.accentGlow, borderRadius: 4,
          fontFamily: fonts.mono, fontSize: 13, color: colors.accent,
          textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Contract Q&A
        </div>
        <span style={{ color: colors.textDim, fontFamily: fonts.body, fontSize: 16 }}>
          RAG-Powered Chat — Ask Anything
        </span>
      </div>

      {/* Chat window */}
      <div style={{ position: "absolute", left: 120, right: 120, top: 130, bottom: 60,
        transform: `scale(${Math.max(0, windowScale)})`, transformOrigin: "center center",
      }}>
        <div style={{ backgroundColor: colors.bgCard, borderRadius: 16,
          border: `1px solid ${colors.border}`, height: "100%",
          display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${colors.border}`,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#febc2e" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28c840" }} />
            </div>
            <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textDim, marginLeft: 8 }}>
              Acme-TechStart-Acquisition.pdf — Chat
            </span>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", gap: 24, overflow: "hidden" }}>
            {/* User message */}
            <div style={{ alignSelf: "flex-end", maxWidth: "65%" }}>
              <div style={{ backgroundColor: `${colors.accent}20`, borderRadius: "16px 16px 4px 16px",
                padding: "16px 22px", border: `1px solid ${colors.accent}30`,
              }}>
                <p style={{ fontFamily: fonts.body, fontSize: 18, color: colors.text, margin: 0, lineHeight: 1.5 }}>
                  {userQuestion.slice(0, typedLen)}
                  {typedLen < userQuestion.length && (
                    <span style={{ display: "inline-block", width: 2, height: 20,
                      backgroundColor: colors.accent, marginLeft: 2, verticalAlign: "text-bottom",
                      opacity: frame % 30 < 15 ? 1 : 0,
                    }} />
                  )}
                </p>
              </div>
            </div>

            {/* Thinking dots */}
            {dotsOpacity > 0 && (
              <div style={{ alignSelf: "flex-start", opacity: dotsOpacity }}>
                <div style={{ display: "flex", gap: 6, padding: "12px 20px",
                  backgroundColor: colors.bgCardHover, borderRadius: "16px 16px 16px 4px",
                }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%",
                      backgroundColor: colors.textDim,
                      opacity: ((frame + i * 8) % 30) < 15 ? 1 : 0.3,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* AI response */}
            <div style={{ alignSelf: "flex-start", maxWidth: "75%", opacity: aiOpacity,
              transform: `translateY(${aiY}px)`,
            }}>
              <div style={{ backgroundColor: colors.bgCardHover, borderRadius: "16px 16px 16px 4px",
                padding: "20px 26px", border: `1px solid ${colors.border}`,
              }}>
                {answerLines.map((line, i) => (
                  <p key={i} style={{ fontFamily: fonts.body, fontSize: 17, color: colors.textSoft,
                    margin: i > 0 ? "8px 0 0 0" : 0, lineHeight: 1.6, opacity: getLineOpacity(i),
                  }}>
                    {line}
                  </p>
                ))}

                {/* Source citations */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.border}`,
                  opacity: sourcesOpacity, display: "flex", gap: 10, flexWrap: "wrap",
                }}>
                  <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim,
                    textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4,
                  }}>Sources:</span>
                  {sources.map((src) => (
                    <div key={src.section} style={{ display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 10px", backgroundColor: `${colors.blue}15`,
                      borderRadius: 6, border: `1px solid ${colors.blue}25`,
                    }}>
                      <span style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.blue, fontWeight: 600 }}>
                        p.{src.page}
                      </span>
                      <span style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim }}>
                        {src.section}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
