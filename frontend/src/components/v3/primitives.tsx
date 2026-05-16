'use client'

import { ReactNode, useEffect, useState } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export function RiskPill({
  level,
  size = 'sm',
  children,
}: {
  level: RiskLevel | 'neutral'
  size?: 'sm' | 'md'
  children?: ReactNode
}) {
  return (
    <span className={`v3-pill v3-pill-${level}${size === 'md' ? ' v3-pill-md' : ''}`}>
      {children ?? level}
    </span>
  )
}

export function KpiCard({
  label,
  value,
  delta,
  spark,
  intent = 'default',
  animateOnMount = true,
}: {
  label: string
  value: number | string
  delta?: { value: number; period: string }
  spark?: number[]
  intent?: 'default' | RiskLevel
  animateOnMount?: boolean
}) {
  const [display, setDisplay] = useState(animateOnMount && typeof value === 'number' ? 0 : value)
  useEffect(() => {
    if (!animateOnMount || typeof value !== 'number') return
    const start = performance.now()
    const dur = 700
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, animateOnMount])

  const accent =
    intent === 'critical' ? 'var(--v3-risk-critical)'
    : intent === 'high' ? 'var(--v3-risk-high)'
    : intent === 'medium' ? 'var(--v3-risk-medium)'
    : intent === 'low' ? 'var(--v3-risk-low)'
    : 'var(--v3-accent)'

  return (
    <div className="v3-card v3-card-hover" style={{ padding: 16, height: 104, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="v3-mono" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--v3-text-muted)' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: intent === 'default' ? 'var(--v3-text-primary)' : accent }}>
            {display}
          </div>
          {delta && (
            <div className="v3-mono" style={{ marginTop: 4, fontSize: 11, color: delta.value >= 0 ? 'var(--v3-risk-low)' : 'var(--v3-risk-critical)' }}>
              {delta.value >= 0 ? '↑' : '↓'} {Math.abs(delta.value)} <span style={{ color: 'var(--v3-text-muted)' }}>· {delta.period}</span>
            </div>
          )}
        </div>
        {spark && spark.length > 1 && (
          <div style={{ width: 80, height: 36 }}>
            <ResponsiveContainer>
              <LineChart data={spark.map((v, i) => ({ i, v }))}>
                <Line type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  crumb,
  actions,
}: {
  title: string
  subtitle?: string
  crumb?: string
  actions?: ReactNode
}) {
  return (
    <div className="v3-pageheader" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, paddingTop: 8 }}>
      <div>
        {crumb && (
          <div className="v3-mono" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--v3-text-muted)', marginBottom: 6 }}>
            {crumb}
          </div>
        )}
        <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--v3-text-primary)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--v3-text-secondary)' }}>{subtitle}</p>}
      </div>
      {actions && <div className="v3-pageheader-actions" style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  )
}

export function Section({
  title,
  hint,
  actions,
  children,
}: {
  title: string
  hint?: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>{title}</h2>
          {hint && <span style={{ fontSize: 12, color: 'var(--v3-text-muted)', marginLeft: 8 }}>{hint}</span>}
        </div>
        {actions}
      </div>
      <div className="v3-card" style={{ padding: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </section>
  )
}

export function HeatmapCell({
  count,
  level,
  onClick,
  delay = 0,
}: {
  count: number
  level: RiskLevel | null
  onClick?: () => void
  delay?: number
}) {
  const color =
    level === 'critical' ? '239, 68, 68'
    : level === 'high' ? '249, 115, 22'
    : level === 'medium' ? '234, 179, 8'
    : level === 'low' ? '16, 185, 129'
    : '161, 161, 170'
  const alpha = count === 0 ? 0.04 : Math.min(0.9, 0.18 + (count - 1) * 0.18)
  return (
    <button
      type="button"
      onClick={onClick}
      title={count > 0 ? `${count} ${level} clause${count > 1 ? 's' : ''}` : 'no clauses'}
      style={{
        width: 32,
        height: 32,
        borderRadius: 4,
        border: '1px solid rgba(255,255,255,0.04)',
        background: `rgba(${color}, ${alpha})`,
        color: count > 0 ? (level === 'medium' ? '#0a0a0c' : '#fff') : 'transparent',
        fontSize: 11,
        fontWeight: 600,
        cursor: count > 0 ? 'pointer' : 'default',
        opacity: 0,
        animation: `v3-cell-in 400ms ${delay}ms ease-out forwards`,
        fontFamily: 'var(--font-geist-mono), monospace',
      }}
    >
      {count > 0 ? count : ''}
    </button>
  )
}

export function EntityChip({
  type,
  name,
  count,
}: {
  type: 'party' | 'date' | 'money' | 'location' | 'person' | 'percentage' | string
  name: string
  count?: number
}) {
  const dot =
    type === 'party' ? '#60a5fa'
    : type === 'date' ? '#a78bfa'
    : type === 'money' ? '#34d399'
    : type === 'location' ? '#fb923c'
    : type === 'person' ? '#f472b6'
    : type === 'percentage' ? '#facc15'
    : '#a1a1aa'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 999,
      background: 'var(--v3-card)', border: '1px solid var(--v3-border)',
      fontSize: 12,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: dot }} />
      <span style={{ color: 'var(--v3-text-primary)' }}>{name}</span>
      {count !== undefined && (
        <span className="v3-mono" style={{ color: 'var(--v3-text-muted)', fontSize: 11 }}>{count}</span>
      )}
    </span>
  )
}
