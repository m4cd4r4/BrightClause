'use client'

import { motion } from 'framer-motion'

const riskBars = [
  { level: 'Critical', count: 3, color: 'bg-red-500', text: 'text-red-400' },
  { level: 'High', count: 7, color: 'bg-orange-500', text: 'text-orange-400' },
  { level: 'Medium', count: 12, color: 'bg-amber-500', text: 'text-amber-400' },
  { level: 'Low', count: 24, color: 'bg-emerald-500', text: 'text-emerald-400' },
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
  critical: 'text-red-400 bg-red-500/15',
  high: 'text-orange-400 bg-orange-500/15',
  medium: 'text-amber-400 bg-amber-500/15',
  low: 'text-emerald-400 bg-emerald-500/15',
}

const graphNodes = [
  { id: 'amount', label: '$5.2M', x: 150, y: 22, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { id: 'acme', label: 'Acme Corp', x: 60, y: 65, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { id: 'tech', label: 'TechStart', x: 240, y: 65, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  { id: 'ip', label: 'IP License', x: 150, y: 108, color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  { id: 'date', label: 'Jan 2024', x: 50, y: 158, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  { id: 'loc', label: 'Delaware', x: 250, y: 158, color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
]

const graphEdges: [string, string][] = [
  ['acme', 'tech'], ['acme', 'amount'], ['tech', 'amount'],
  ['acme', 'ip'], ['tech', 'ip'],
  ['acme', 'date'], ['tech', 'loc'],
]

const nodeMap = Object.fromEntries(graphNodes.map(n => [n.id, n]))

const entityLegend = [
  { label: 'Party', color: 'bg-blue-400' },
  { label: 'Amount', color: 'bg-amber-400' },
  { label: 'Date', color: 'bg-emerald-400' },
  { label: 'Location', color: 'bg-red-400' },
  { label: 'Clause', color: 'bg-purple-400' },
]

export function HeroVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="absolute -inset-10 bg-accent/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative bg-ink-950/80 border border-ink-700/40 rounded-2xl backdrop-blur-xl overflow-hidden
                      shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(201,162,39,0.05)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800/40 bg-ink-900/60">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-ink-700/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-ink-700/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-ink-700/80" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-4 py-1 bg-ink-800/50 rounded-md text-[10px] text-ink-500 font-mono">
              brightclause.com/documents/acme-techstart-ma
            </div>
          </div>
        </div>

        {/* Two-panel content */}
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Left: Risk Analysis */}
          <div className="lg:col-span-3 p-5 lg:p-6 lg:border-r border-ink-800/30">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] text-ink-500 uppercase tracking-wider font-mono mb-1">Document Analysis</p>
                <p className="text-sm font-medium text-ink-200">Acme Corp &ndash; TechStart Service Agreement</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 text-[10px] font-mono font-bold uppercase tracking-wide
                             shadow-[0_0_12px_rgba(249,115,22,0.15)] border border-orange-500/20 shrink-0 ml-4">
                HIGH RISK
              </span>
            </div>

            {/* Risk distribution */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {riskBars.map((r, i) => (
                <div key={r.level} className="text-center">
                  <motion.p
                    className={`text-lg font-mono font-bold ${r.text}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    {r.count}
                  </motion.p>
                  <p className="text-[9px] text-ink-500 uppercase tracking-wider font-mono mt-0.5">{r.level}</p>
                  <div className="h-1.5 bg-ink-800/50 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(r.count / maxCount) * 100}%` }}
                      transition={{ delay: 0.8 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${r.color}`}
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Clause list */}
            <p className="text-[10px] text-ink-500 uppercase tracking-wider font-mono mb-2">Extracted Clauses</p>
            <div className="space-y-1.5">
              {mockClauses.map((c, i) => (
                <motion.div
                  key={c.section}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.08 }}
                  className="flex items-center justify-between py-2 px-3 bg-ink-800/40 rounded-lg border border-ink-700/30"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] text-ink-400 font-mono shrink-0">{c.section}</span>
                    <span className="text-xs text-ink-100 truncate">{c.type}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ml-2 ${clauseColors[c.risk]}`}>
                    {c.risk}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Knowledge Graph */}
          <div className="lg:col-span-2 p-5 lg:p-6 border-t lg:border-t-0 border-ink-800/30 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-ink-500 uppercase tracking-wider font-mono">Knowledge Graph</p>
              <p className="text-[10px] text-ink-600 font-mono">6 entities &middot; 7 relations</p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <svg viewBox="0 0 300 185" className="w-full max-h-[240px]" aria-hidden="true">
                {graphEdges.map(([fromId, toId], i) => {
                  const from = nodeMap[fromId]
                  const to = nodeMap[toId]
                  return (
                    <motion.line
                      key={`${fromId}-${toId}`}
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke="rgba(113,113,122,0.15)"
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
                      fontFamily="ui-monospace, monospace"
                      opacity={0.75}
                    >
                      {n.label}
                    </text>
                  </motion.g>
                ))}
              </svg>
            </div>

            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-ink-800/20">
              {entityLegend.map(t => (
                <div key={t.label} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${t.color}`} />
                  <span className="text-[9px] text-ink-500 font-mono">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
