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

const obligations = [
  { desc: "Annual audit report submission", party: "Buyer", due: "Mar 15, 2025", status: "overdue" },
  { desc: "Escrow release — 2nd tranche", party: "Escrow Agent", due: "Apr 1, 2025", status: "upcoming" },
  { desc: "IP transfer registration", party: "Seller", due: "Apr 30, 2025", status: "upcoming" },
  { desc: "Employee retention review", party: "Buyer", due: "Jun 15, 2025", status: "future" },
  { desc: "Non-compete expiry notification", party: "Both", due: "Dec 31, 2025", status: "future" },
];

const timelineEvents = [
  { date: "Jan 15", label: "Effective Date", color: colors.low },
  { date: "Mar 15", label: "Audit Due", color: colors.critical },
  { date: "Apr 1", label: "Escrow Release", color: colors.high },
  { date: "Apr 30", label: "IP Transfer", color: colors.medium },
  { date: "Jun 15", label: "Retention Review", color: colors.blue },
  { date: "Dec 31", label: "Non-Compete Ends", color: colors.purple },
];

const statusColor = (s: string) =>
  s === "overdue" ? colors.critical : s === "upcoming" ? colors.high : colors.textDim;
const statusLabel = (s: string) =>
  s === "overdue" ? "OVERDUE" : s === "upcoming" ? "DUE SOON" : "FUTURE";

interface ObligationsSceneProps {
  mobile?: boolean;
}

export const ObligationsScene: React.FC<ObligationsSceneProps> = ({ mobile }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const panelScale = spring({ frame: frame - 5, fps, config: springs.panel });

  const getRowProgress = (i: number) =>
    spring({ frame: frame - 15 - i * 7, fps, config: springs.snappy });
  const getRowX = (i: number) => {
    const progress = getRowProgress(i);
    const direction = i % 2 === 0 ? 1 : -1;
    return interpolate(progress, [0, 1], [20 * direction, 0]);
  };

  const timelineOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });
  const getNodeScale = (i: number) =>
    spring({ frame: frame - 55 - i * 5, fps, config: springs.snappy });

  const timelineLineWidth = interpolate(frame, [50, 85], [0, 100], {
    extrapolateRight: "clamp",
  });

  const overdueGlow = interpolate(frame % 50, [0, 25, 50], [0, 12, 0]);

  const exitOpacity = interpolate(
    frame,
    [durationInFrames - 25, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Font sizes
  const sz = mobile
    ? { header: 22, desc: 26, party: 24, due: 24, status: 20, timelineLabel: 22, timelineDate: 22, timelineEvent: 20 }
    : { header: 14, desc: 18, party: 17, due: 17, status: 14, timelineLabel: 14, timelineDate: 15, timelineEvent: 15 };

  const sidePad = mobile ? 32 : 80;

  // Mobile: show as card list instead of table
  if (mobile) {
    return (
      <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
        <ScreenshotReveal
          src="assets/journey/140-obligations-full.png"
          delay={0}
          startScale={0.6}
          endScale={0.63}
          opacity={0.08}
          blur={6}
          borderRadius={16}
          y={30}
        />
        <GlowOrb color={colors.purple} size={300} x="70%" y="75%" maxOpacity={0.1} delay={60} />

        <div
          style={{
            position: "absolute",
            left: sidePad,
            right: sidePad,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            justifyContent: "center",
            transform: `scale(${Math.max(0, panelScale)})`,
            transformOrigin: "center top",
          }}
        >
          {/* Obligation cards */}
          {obligations.map((ob, i) => {
            const isOverdue = ob.status === "overdue";
            return (
              <div
                key={i}
                style={{
                  backgroundColor: isOverdue ? `${colors.critical}10` : colors.bgCard,
                  borderRadius: 14,
                  border: `1px solid ${isOverdue ? `${colors.critical}40` : colors.border}`,
                  padding: "34px 32px",
                  opacity: getRowProgress(i),
                  transform: `translateX(${getRowX(i)}px)`,
                  boxShadow: isOverdue
                    ? `inset 0 0 ${overdueGlow}px ${colors.critical}30, 0 0 ${overdueGlow}px ${colors.critical}15`
                    : "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: fonts.body, fontSize: sz.desc, color: colors.textSoft, flex: 1 }}>
                    {ob.desc}
                  </span>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 4,
                      fontSize: sz.status,
                      fontFamily: fonts.mono,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: statusColor(ob.status),
                      backgroundColor: `${statusColor(ob.status)}15`,
                      border: `1px solid ${statusColor(ob.status)}25`,
                      marginLeft: 12,
                      flexShrink: 0,
                    }}
                  >
                    {statusLabel(ob.status)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  <span style={{ fontFamily: fonts.body, fontSize: sz.party, color: colors.textDim }}>
                    {ob.party}
                  </span>
                  <span style={{ fontFamily: fonts.mono, fontSize: sz.due, color: isOverdue ? colors.critical : colors.textSoft }}>
                    {ob.due}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Vertical timeline */}
          <div
            style={{
              backgroundColor: colors.bgCard,
              borderRadius: 14,
              border: `1px solid ${colors.border}`,
              padding: "36px 32px",
              opacity: timelineOpacity,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: sz.timelineLabel,
                color: colors.textDim,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 24,
              }}
            >
              Contract Timeline
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
              {timelineEvents.map((evt, i) => {
                const scale = Math.max(0, getNodeScale(i));
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transform: `scale(${scale})`,
                      transformOrigin: "left center",
                    }}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: evt.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: fonts.mono, fontSize: sz.timelineDate, color: evt.color, fontWeight: 600 }}>
                      {evt.date}
                    </span>
                    <span style={{ fontFamily: fonts.body, fontSize: sz.timelineEvent, color: colors.textDim }}>
                      {evt.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    );
  }

  // Desktop layout
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, opacity: exitOpacity }}>
      <ScreenshotReveal
        src="assets/journey/140-obligations-full.png"
        delay={0}
        startScale={0.6}
        endScale={0.63}
        opacity={0.08}
        blur={6}
        borderRadius={16}
        y={30}
      />
      <GlowOrb color={colors.purple} size={300} x="70%" y="75%" maxOpacity={0.1} delay={60} />

      <SceneBadge title="Obligations & Timeline" subtitle="Deadline Tracking — Never Miss a Date" />

      <div
        style={{
          position: "absolute",
          left: sidePad,
          right: sidePad,
          top: 120,
          bottom: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
          transform: `scale(${Math.max(0, panelScale)})`,
          transformOrigin: "center top",
        }}
      >
        {/* Obligations table */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "14px 28px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.bgCardHover,
            }}
          >
            {["Obligation", "Responsible Party", "Due Date", "Status"].map((h, i) => (
              <div
                key={h}
                style={{
                  flex: i === 0 ? 2.5 : 1,
                  fontFamily: fonts.mono,
                  fontSize: sz.header,
                  color: colors.textDim,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {obligations.map((ob, i) => {
            const isOverdue = ob.status === "overdue";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  padding: "14px 28px",
                  alignItems: "center",
                  borderBottom: i < obligations.length - 1 ? `1px solid ${colors.border}` : "none",
                  opacity: getRowProgress(i),
                  transform: `translateX(${getRowX(i)}px)`,
                  backgroundColor: isOverdue ? `${colors.critical}08` : "transparent",
                  boxShadow: isOverdue
                    ? `inset 0 0 ${overdueGlow}px ${colors.critical}30, 0 0 ${overdueGlow}px ${colors.critical}15`
                    : "none",
                }}
              >
                <div style={{ flex: 2.5, display: "flex", alignItems: "center", gap: 10 }}>
                  {isOverdue && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: colors.critical,
                        boxShadow: `0 0 ${overdueGlow}px ${colors.critical}`,
                      }}
                    />
                  )}
                  <span style={{ fontFamily: fonts.body, fontSize: sz.desc, color: colors.textSoft }}>
                    {ob.desc}
                  </span>
                </div>
                <div style={{ flex: 1, fontFamily: fonts.body, fontSize: sz.party, color: colors.textDim }}>
                  {ob.party}
                </div>
                <div
                  style={{
                    flex: 1,
                    fontFamily: fonts.mono,
                    fontSize: sz.due,
                    color: isOverdue ? colors.critical : colors.textSoft,
                  }}
                >
                  {ob.due}
                </div>
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 4,
                      fontSize: sz.status,
                      fontFamily: fonts.mono,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: statusColor(ob.status),
                      backgroundColor: `${statusColor(ob.status)}15`,
                      border: `1px solid ${statusColor(ob.status)}25`,
                    }}
                  >
                    {statusLabel(ob.status)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline strip */}
        <div
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: 14,
            border: `1px solid ${colors.border}`,
            padding: "24px 40px",
            opacity: timelineOpacity,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: sz.timelineLabel,
              color: colors.textDim,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 20,
            }}
          >
            Contract Timeline
          </div>

          <div style={{ position: "relative", height: 80 }}>
            <div
              style={{
                position: "absolute",
                top: 12,
                left: 0,
                width: `${timelineLineWidth}%`,
                height: 2,
                backgroundColor: colors.borderLight,
                boxShadow: `${timelineLineWidth > 50 ? `0 0 8px ${colors.accent}30` : "none"}`,
              }}
            />

            {timelineEvents.map((evt, i) => {
              const left = `${(i / (timelineEvents.length - 1)) * 100}%`;
              const scale = Math.max(0, getNodeScale(i));
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left,
                    top: 0,
                    transform: `translateX(-50%) scale(${scale})`,
                    transformOrigin: "top center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: colors.bgCard,
                      border: `3px solid ${evt.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: evt.color }} />
                  </div>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: sz.timelineDate,
                      color: evt.color,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {evt.date}
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.body,
                      fontSize: sz.timelineEvent,
                      color: colors.textDim,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {evt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
