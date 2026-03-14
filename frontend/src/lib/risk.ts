export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export const riskConfig: Record<RiskLevel, {
  color: string
  bg: string
  border: string
  glow: string
  label: string
}> = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]',
    label: 'Critical',
  },
  high: {
    color: 'text-orange-400',
    bg: 'bg-orange-500',
    border: 'border-orange-500/30',
    glow: 'shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    label: 'High',
  },
  medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500',
    border: 'border-amber-500/30',
    glow: '',
    label: 'Medium',
  },
  low: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    glow: '',
    label: 'Low',
  },
}

export const riskCellColors: Record<string, string> = {
  critical: 'bg-red-500/60',
  high: 'bg-orange-500/50',
  medium: 'bg-amber-500/40',
  low: 'bg-emerald-500/30',
  none: 'bg-ink-800/30',
}

export function formatClauseType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function getTopRisk(riskLevels?: Record<string, number>): RiskLevel | null {
  if (!riskLevels) return null
  const order: RiskLevel[] = ['critical', 'high', 'medium', 'low']
  for (const level of order) {
    if (riskLevels[level] && riskLevels[level] > 0) return level
  }
  return null
}

export function isRiskLevel(value: string | null | undefined): value is RiskLevel {
  return value === 'critical' || value === 'high' || value === 'medium' || value === 'low'
}
