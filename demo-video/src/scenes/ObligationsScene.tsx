import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../styles";

const obligations = [
  { desc: "Annual audit report submission", party: "Buyer", due: "Mar 15, 2025", type: "reporting", status: "overdue" },
  { desc: "Escrow release — 2nd tranche", party: "Escrow Agent", due: "Apr 1, 2025", type: "payment", status: "upcoming" },
  { desc: "IP transfer registration", party: "Seller", due: "Apr 30, 2025", type: "compliance", status: "upcoming" },
  { desc: "Employee retention review", party: "Buyer", due: "Jun 15, 2025", type: "delivery", status: "future" },
  { desc: "Non-compete expiry notification", party: "Both", due: "Dec 31, 2025", type: "notification", status: "future" },
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

export const ObligationsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const panelScale = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 100 } });

  // Obligation rows stagger
  const getRowOpacity = (i: number) =>
    interpolate(frame, [20 + i * 8, 32 + i * 8], [0, 1], { extrapolateRight: "clamp" });
  const getRowX = (i: number) =>
    interpolate(frame, [20 + i * 8, 32 + i * 8], [20, 0], { extrapolateRight: "clamp" });

  // Timeline
  const timelineOpacity = interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" });
  const getNodeScale = (i: number) =>
    spring({ frame: frame - 70 - i * 6, fps, config: { damping: 12, stiffness: 120 } });

  // Pulse animation for overdue
  const pulse = interpolate(frame % 40, [0, 20, 40], [1, 0.4, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Badge */}
      <div style={{ position: "absolute", top: 48, left: 80, opacity: badgeOpacity,
        display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ padding: "6px 14px", backgroundColor: colors.accentGlow, borderRadius: 4,
          fontFamily: fonts.mono, fontSize: 13, color: colors.accent,
          textTransform: "uppercase", letterSpacing: "0.15em" }}>
          Obligations & Timeline
        </div>
        <span style={{ color: colors.textDim, fontFamily: fonts.body, fontSize: 16 }}>
          Deadline Tracking — Never Miss a Date
        </span>
      </div>

      <div style={{ position: "absolute", left: 80, right: 80, top: 120, bottom: 100,
        display: "flex", flexDirection: "column", gap: 24,
        transform: `scale(${Math.max(0, panelScale)})`, transformOrigin: "center top",
      }}>
        {/* Obligations table */}
        <div style={{ backgroundColor: colors.bgCard, borderRadius: 14,
          border: `1px solid ${colors.border}`, flex: 1, overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{ display: "flex", padding: "14px 28px", borderBottom: `1px solid ${colors.border}`,
            backgroundColor: colors.bgCardHover }}>
            {["Obligation", "Responsible Party", "Due Date", "Status"].map((h, i) => (
              <div key={h} style={{ flex: i === 0 ? 2.5 : 1,
                fontFamily: fonts.mono, fontSize: 11, color: colors.textDim,
                textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {obligations.map((ob, i) => (
            <div key={i} style={{
              display: "flex", padding: "14px 28px", alignItems: "center",
              borderBottom: i < obligations.length - 1 ? `1px solid ${colors.border}` : "none",
              opacity: getRowOpacity(i), transform: `translateX(${getRowX(i)}px)`,
              backgroundColor: ob.status === "overdue" ? `${colors.critical}08` : "transparent",
            }}>
              <div style={{ flex: 2.5, display: "flex", alignItems: "center", gap: 10 }}>
                {ob.status === "overdue" && (
                  <div style={{ width: 8, height: 8, borderRadius: "50%",
                    backgroundColor: colors.critical, opacity: pulse }} />
                )}
                <span style={{ fontFamily: fonts.body, fontSize: 15, color: colors.textSoft }}>
                  {ob.desc}
                </span>
              </div>
              <div style={{ flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.textDim }}>
                {ob.party}
              </div>
              <div style={{ flex: 1, fontFamily: fonts.mono, fontSize: 14,
                color: ob.status === "overdue" ? colors.critical : colors.textSoft }}>
                {ob.due}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11,
                  fontFamily: fonts.mono, textTransform: "uppercase", letterSpacing: "0.1em",
                  color: statusColor(ob.status),
                  backgroundColor: `${statusColor(ob.status)}15`,
                  border: `1px solid ${statusColor(ob.status)}25`,
                }}>
                  {statusLabel(ob.status)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline strip */}
        <div style={{ backgroundColor: colors.bgCard, borderRadius: 14,
          border: `1px solid ${colors.border}`, padding: "24px 40px",
          opacity: timelineOpacity,
        }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim,
            textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>
            Contract Timeline
          </div>

          {/* Timeline line + nodes */}
          <div style={{ position: "relative", height: 80 }}>
            {/* Horizontal line */}
            <div style={{ position: "absolute", top: 12, left: 0, right: 0,
              height: 2, backgroundColor: colors.border }} />

            {timelineEvents.map((evt, i) => {
              const left = `${(i / (timelineEvents.length - 1)) * 100}%`;
              const scale = Math.max(0, getNodeScale(i));
              return (
                <div key={i} style={{ position: "absolute", left, top: 0,
                  transform: `translateX(-50%) scale(${scale})`, transformOrigin: "top center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%",
                    backgroundColor: colors.bgCard, border: `3px solid ${evt.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: evt.color }} />
                  </div>
                  <span style={{ fontFamily: fonts.mono, fontSize: 12, color: evt.color, fontWeight: 600,
                    whiteSpace: "nowrap" }}>
                    {evt.date}
                  </span>
                  <span style={{ fontFamily: fonts.body, fontSize: 12, color: colors.textDim,
                    whiteSpace: "nowrap" }}>
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
