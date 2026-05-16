'use client'

import { motion } from 'framer-motion'

const riskBars = [
  { level: 'Critical', count: 3, color: 'var(--v3-risk-critical)' },
  { level: 'High', count: 7, color: 'var(--v3-risk-high)' },
  { level: 'Medium', count: 12, color: 'var(--v3-risk-medium)' },
  { level: 'Low', count: 24, color: 'var(--v3-risk-low)' },
]

const maxCount = 24

const mockClauses = [
  { type: 'Termination for Convenience', risk: 'critical', section: '§4.2' },
  { type: 'Limitation of Liability Cap', risk: 'high', section: '§7.1' },
  { type: 'Change of Control Provision', risk: 'high', section: '§9.3' },
  { type: 'Confidentiality (Mutual)', risk: 'medium', section: '§5.3' },
  { type: 'Governing Law & Jurisdiction', risk: 'low', section: '§12.1' },
]

const clauseColors: Record<string, string> = {
  critical: 'var(--v3-risk-critical)',
  high: 'var(--v3-risk-high)',
  medium: 'var(--v3-risk-medium)',
  low: 'var(--v3-risk-low)',
}

// Risk-tinted pill backgrounds, matching the .v3-pill convention in v3-tokens.css.
const clauseBg: Record<string, string> = {
  critical: 'rgba(239, 68, 68, 0.15)',
  high: 'rgba(249, 115, 22, 0.15)',
  medium: 'rgba(234, 179, 8, 0.15)',
  low: 'rgba(16, 185, 129, 0.15)',
}

const graphNodes = [
  { id: 'amount', label: '$5.2M', x: 150, y: 22, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'acme', label: 'Acme Corp', x: 60, y: 65, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { id: 'tech', label: 'TechStart', x: 240, y: 65, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { id: 'ip', label: 'IP License', x: 150, y: 108, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { id: 'date', label: 'Jan 2024', x: 50, y: 158, color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  { id: 'loc', label: 'Delaware', x: 250, y: 158, color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
]

const graphEdges: [string, string][] = [
  ['acme', 'tech'], ['acme', 'amount'], ['tech', 'amount'],
  ['acme', 'ip'], ['tech', 'ip'],
  ['acme', 'date'], ['tech', 'loc'],
]

const nodeMap = Object.fromEntries(graphNodes.map(n => [n.id, n]))

const entityLegend = [
  { label: 'Party', color: '#60a5fa' },
  { label: 'Amount', color: '#34d399' },
  { label: 'Date', color: '#facc15' },
  { label: 'Location', color: '#fb923c' },
  { label: 'Clause', color: '#a78bfa' },
]

export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: 'relative' }}
    >
      <div
        className="v3-card"
        style={{ overflow: 'hidden', borderRadius: 'var(--v3-radius-lg)', boxShadow: 'var(--v3-shadow-md)' }}
      >
        {/* Browser chrome */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--v3-border-hover)' }} />
            <div style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--v3-border-hover)' }} />
            <div style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--v3-border-hover)' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div
              className="v3-mono"
              style={{
                padding: '4px 16px', background: 'var(--v3-card)', borderRadius: 'var(--v3-radius-sm)',
                fontSize: 11, color: 'var(--v3-text-muted)',
              }}
            >
              brightclause.com/documents/acme-techstart-ma
            </div>
          </div>
        </div>

        {/* Two-panel content */}
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Left: Risk Analysis */}
          <div
            className="lg:col-span-3"
            style={{ padding: 24, borderRight: '1px solid var(--v3-border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Document Analysis
                </p>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--v3-text-secondary)' }}>Acme Corp - TechStart Service Agreement</p>
              </div>
              <span
                className="v3-mono"
                style={{
                  padding: '4px 10px', borderRadius: 'var(--v3-radius-sm)', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, marginLeft: 16,
                  background: 'rgba(249, 115, 22, 0.12)', color: 'var(--v3-risk-high)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                }}
              >
                HIGH RISK
              </span>
            </div>

            {/* Risk distribution */}
            <div className="grid grid-cols-4" style={{ gap: 12, marginBottom: 20 }}>
              {riskBars.map((r, i) => (
                <div key={r.level} style={{ textAlign: 'center' }}>
                  <motion.p
                    className="v3-mono"
                    style={{ fontSize: 18, fontWeight: 600, color: r.color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    {r.count}
                  </motion.p>
                  <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{r.level}</p>
                  <div style={{ height: 6, background: 'var(--v3-card-hover)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: r.count / maxCount }}
                      transition={{ delay: 0.8 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
                      style={{ height: '100%', width: '100%', borderRadius: 999, transformOrigin: 'left', background: r.color, opacity: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Clause list */}
            <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Extracted Clauses</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mockClauses.map((c, i) => (
                <motion.div
                  key={c.section}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.08 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--v3-card-hover)', borderRadius: 'var(--v3-radius-sm)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-secondary)', flexShrink: 0 }}>{c.section}</span>
                    <span style={{ fontSize: 12, color: 'var(--v3-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.type}</span>
                  </div>
                  <span
                    className="v3-mono"
                    style={{
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px',
                      borderRadius: 'var(--v3-radius-sm)', flexShrink: 0, marginLeft: 8,
                      color: clauseColors[c.risk],
                      background: clauseBg[c.risk],
                    }}
                  >
                    {c.risk}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Knowledge Graph */}
          <div
            className="lg:col-span-2"
            style={{ padding: 24, display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Knowledge Graph</p>
              <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-disabled)' }}>6 entities &middot; 7 relations</p>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 300 185" style={{ width: '100%', maxHeight: 240 }} aria-hidden="true">
                {graphEdges.map(([fromId, toId], i) => {
                  const from = nodeMap[fromId]
                  const to = nodeMap[toId]
                  return (
                    <motion.line
                      key={`${fromId}-${toId}`}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(113,113,122,0.25)"
                      strokeWidth={1}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 + i * 0.08 }}
                    />
                  )
                })}

                {graphNodes.map((n, i) => (
                  <motion.g
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 + i * 0.1 }}
                  >
                    <circle cx={n.x} cy={n.y} r={18} fill={n.bg} stroke={n.color} strokeWidth={0.5} strokeOpacity={0.25} />
                    <motion.circle
                      cx={n.x} cy={n.y} r={3} fill={n.color}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4, ease: 'easeInOut' }}
                    />
                    <text
                      x={n.x} y={n.y + 28}
                      textAnchor="middle"
                      fill={n.color}
                      fontSize={9}
                      fontFamily="var(--font-geist-mono), monospace"
                      opacity={0.75}
                    >
                      {n.label}
                    </text>
                  </motion.g>
                ))}
              </svg>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--v3-border)' }}>
              {entityLegend.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 999, background: t.color }} />
                  <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
