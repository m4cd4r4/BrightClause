'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ClipboardCheck, Clock, AlertTriangle, CheckCircle, FileText,
  Filter, Loader2, CreditCard, Truck, Bell, ShieldCheck,
  FileBarChart, ChevronDown, ChevronRight, ExternalLink,
} from 'lucide-react'
import { api, ObligationItem } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { V3Shell } from '@/components/v3/shell'
import { PageHeader } from '@/components/v3/primitives'

type ObligationWithDoc = ObligationItem & { document_id: string; filename: string }

const typeConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  payment: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Payment' },
  delivery: { icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Delivery' },
  notification: { icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Notification' },
  compliance: { icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Compliance' },
  reporting: { icon: FileBarChart, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Reporting' },
  general: { icon: ClipboardCheck, color: 'text-ink-400', bg: 'bg-ink-800/50', label: 'General' },
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Completed' },
  overdue: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Overdue' },
}

// Map v1 status colors to v3 tokens
const statusV3: Record<string, { color: string; border: string; bg: string; label: string }> = {
  pending: { color: 'var(--v3-risk-medium)', border: 'rgba(234,179,8,0.3)', bg: 'rgba(234,179,8,0.08)', label: 'Pending' },
  completed: { color: 'var(--v3-risk-low)', border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.08)', label: 'Completed' },
  overdue: { color: 'var(--v3-risk-critical)', border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)', label: 'Overdue' },
}

// Map obligation types to v3-compatible icon colors
const typeV3: Record<string, { color: string; bg: string; label: string; icon: typeof Clock }> = {
  payment: { color: 'var(--v3-risk-low)', bg: 'rgba(16,185,129,0.1)', label: 'Payment', icon: CreditCard },
  delivery: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', label: 'Delivery', icon: Truck },
  notification: { color: 'var(--v3-risk-medium)', bg: 'rgba(234,179,8,0.1)', label: 'Notification', icon: Bell },
  compliance: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'Compliance', icon: ShieldCheck },
  reporting: { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', label: 'Reporting', icon: FileBarChart },
  general: { color: 'var(--v3-text-secondary)', bg: 'var(--v3-panel)', label: 'General', icon: ClipboardCheck },
}

export default function ObligationsPage() {
  const router = useRouter()
  const { error: showError } = useToast()
  const [obligations, setObligations] = useState<ObligationWithDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const response = await api.obligations.all({
        status: filterStatus || undefined,
        obligation_type: filterType || undefined,
        limit: 100,
      })
      setObligations(response.obligations)
    } catch (err) {
      console.error('Failed to load obligations:', err)
      showError('Failed to load obligations.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const grouped = obligations.reduce<Record<string, ObligationWithDoc[]>>((acc, ob) => {
    const key = `${ob.document_id}::${ob.filename}`
    if (!acc[key]) acc[key] = []
    acc[key].push(ob)
    return acc
  }, {})

  const statusCounts = {
    all: obligations.length,
    pending: obligations.filter(o => o.status === 'pending').length,
    overdue: obligations.filter(o => o.status === 'overdue').length,
    completed: obligations.filter(o => o.status === 'completed').length,
  }

  return (
    <V3Shell>
      <PageHeader
        crumb="Insights"
        title="Obligation Tracker"
        subtitle="Deadlines, commitments, and obligations across all contracts"
      />

      {/* Status KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setFilterStatus('')}
          className="v3-card v3-card-hover"
          style={{
            padding: 16, height: 104, textAlign: 'left', cursor: 'pointer',
            outline: filterStatus === '' ? '2px solid var(--v3-accent)' : 'none', outlineOffset: -2,
            border: filterStatus === '' ? '1px solid var(--v3-accent)' : '1px solid var(--v3-border)',
            borderRadius: 'var(--v3-radius-md)', background: filterStatus === '' ? 'rgba(212,168,45,0.04)' : 'var(--v3-card)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={16} color="var(--v3-text-secondary)" />
            <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>All</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: 'var(--v3-text-primary)' }}>{statusCounts.all}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('pending')}
          className="v3-card v3-card-hover"
          style={{
            padding: 16, height: 104, textAlign: 'left', cursor: 'pointer',
            outline: filterStatus === 'pending' ? '2px solid var(--v3-risk-medium)' : 'none', outlineOffset: -2,
            border: filterStatus === 'pending' ? '1px solid rgba(234,179,8,0.4)' : '1px solid var(--v3-border)',
            borderRadius: 'var(--v3-radius-md)', background: filterStatus === 'pending' ? 'rgba(234,179,8,0.04)' : 'var(--v3-card)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--v3-risk-medium)" />
            <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>Pending</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: 'var(--v3-risk-medium)' }}>{statusCounts.pending}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('overdue')}
          className="v3-card v3-card-hover"
          style={{
            padding: 16, height: 104, textAlign: 'left', cursor: 'pointer',
            outline: filterStatus === 'overdue' ? '2px solid var(--v3-risk-critical)' : 'none', outlineOffset: -2,
            border: filterStatus === 'overdue' ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--v3-border)',
            borderRadius: 'var(--v3-radius-md)', background: filterStatus === 'overdue' ? 'rgba(239,68,68,0.04)' : 'var(--v3-card)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--v3-risk-critical)" />
            <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>Overdue</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: 'var(--v3-risk-critical)' }}>{statusCounts.overdue}</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('completed')}
          className="v3-card v3-card-hover"
          style={{
            padding: 16, height: 104, textAlign: 'left', cursor: 'pointer',
            outline: filterStatus === 'completed' ? '2px solid var(--v3-risk-low)' : 'none', outlineOffset: -2,
            border: filterStatus === 'completed' ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--v3-border)',
            borderRadius: 'var(--v3-radius-md)', background: filterStatus === 'completed' ? 'rgba(16,185,129,0.04)' : 'var(--v3-card)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} color="var(--v3-risk-low)" />
            <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>Completed</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color: 'var(--v3-risk-low)' }}>{statusCounts.completed}</div>
        </button>
      </div>

      {/* Type filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        <Filter size={14} color="var(--v3-text-muted)" style={{ flexShrink: 0 }} />
        <button
          type="button"
          onClick={() => setFilterType('')}
          style={{
            height: 28, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', flexShrink: 0, border: '1px solid',
            background: filterType === '' ? 'rgba(212,168,45,0.12)' : 'var(--v3-card)',
            color: filterType === '' ? 'var(--v3-accent)' : 'var(--v3-text-secondary)',
            borderColor: filterType === '' ? 'rgba(212,168,45,0.3)' : 'var(--v3-border)',
          }}
        >
          All Types
        </button>
        {Object.entries(typeV3).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilterType(key)}
            style={{
              height: 28, padding: '0 12px', borderRadius: 999, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', flexShrink: 0, border: '1px solid',
              background: filterType === key ? cfg.bg : 'var(--v3-card)',
              color: filterType === key ? cfg.color : 'var(--v3-text-secondary)',
              borderColor: filterType === key ? cfg.color : 'var(--v3-border)',
            }}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={24} color="var(--v3-accent)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : obligations.length === 0 ? (
        <div className="v3-card" style={{ padding: '56px 40px' }}>
          <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
            {filterStatus || filterType ? (
              <>
                <Filter size={36} color="var(--v3-text-muted)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', marginBottom: 8 }}>No Matching Obligations</h2>
                <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                  No obligations found for
                  {filterStatus && <span style={{ color: 'var(--v3-text-primary)', fontWeight: 500 }}> {statusConfig[filterStatus]?.label || filterStatus}</span>}
                  {filterStatus && filterType && ' +'}
                  {filterType && <span style={{ color: 'var(--v3-text-primary)', fontWeight: 500 }}> {typeConfig[filterType]?.label || filterType}</span>}
                  . Try broadening your filters or check a different status.
                </p>
                <button
                  type="button"
                  onClick={() => { setFilterStatus(''); setFilterType('') }}
                  className="v3-btn"
                  style={{ fontSize: 13, color: 'var(--v3-accent)' }}
                >
                  Clear All Filters
                </button>
              </>
            ) : (
              <>
                <ClipboardCheck size={36} color="var(--v3-text-muted)" style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', marginBottom: 8 }}>No Obligations Yet</h2>
                <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                  Obligations are extracted automatically when you analyze a contract — payment deadlines,
                  delivery requirements, compliance milestones, and notification duties. Upload and analyze
                  a contract from the dashboard to get started.
                </p>
                <Link
                  href="/dashboard"
                  className="v3-btn v3-btn-primary"
                  style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
                >
                  Go to Dashboard
                  <ChevronRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grouped).map(([key, docObligations]) => {
            const [docId, filename] = key.split('::')
            return (
              <section key={key} className="v3-card" style={{ overflow: 'hidden' }}>
                {/* Document header */}
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--v3-border)',
                  background: 'var(--v3-panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <FileText size={14} color="var(--v3-accent)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <h3 className="v3-mono" style={{ fontSize: 13, fontWeight: 500, color: 'var(--v3-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {filename}
                      </h3>
                      <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                        {docObligations.length} obligation{docObligations.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/documents/${docId}`)}
                    className="v3-btn v3-btn-ghost"
                    style={{ padding: '0 8px', height: 28 }}
                    aria-label="View document"
                  >
                    <ExternalLink size={13} />
                  </button>
                </div>

                {/* Obligation rows */}
                <div>
                  {docObligations.map((ob, i) => {
                    const cfg = typeV3[ob.obligation_type] || typeV3.general
                    const sV3 = statusV3[ob.status] || statusV3.pending
                    const Icon = cfg.icon
                    const isExpanded = expandedId === ob.id

                    return (
                      <div
                        key={ob.id}
                        style={{ borderBottom: i < docObligations.length - 1 ? '1px solid var(--v3-border)' : 0 }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : ob.id)}
                          style={{
                            width: '100%', textAlign: 'left', padding: '12px 16px',
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'inherit',
                          }}
                        >
                          <div style={{
                            marginTop: 2, padding: 8, borderRadius: 'var(--v3-radius-sm)',
                            background: cfg.bg, flexShrink: 0,
                          }}>
                            <Icon size={14} color={cfg.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: 'var(--v3-text-primary)', lineHeight: 1.5, margin: '0 0 8px' }}>
                              {ob.description}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                              {/* Status pill using v3 tokens */}
                              <span
                                className="v3-mono"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', height: 20,
                                  padding: '0 8px', borderRadius: 'var(--v3-radius-sm)',
                                  fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                                  background: sV3.bg, color: sV3.color,
                                  border: `1px solid ${sV3.border}`,
                                }}
                              >
                                {sV3.label}
                              </span>
                              {/* Type pill */}
                              <span
                                className="v3-mono"
                                style={{
                                  display: 'inline-flex', alignItems: 'center', height: 20,
                                  padding: '0 8px', borderRadius: 'var(--v3-radius-sm)',
                                  fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
                                  background: cfg.bg, color: cfg.color,
                                  border: '1px solid transparent',
                                }}
                              >
                                {cfg.label}
                              </span>
                              {/* Due date */}
                              {ob.due_date && (
                                <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Clock size={11} />
                                  {ob.due_date}
                                </span>
                              )}
                              {/* Responsible party */}
                              {ob.responsible_party && (
                                <span style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                                  {ob.responsible_party}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronDown
                            size={14}
                            color="var(--v3-text-muted)"
                            style={{ flexShrink: 0, marginTop: 4, transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
                          />
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{
                              margin: '0 16px 12px 56px', padding: 12,
                              background: 'var(--v3-panel)', border: '1px solid var(--v3-border)',
                              borderRadius: 'var(--v3-radius-sm)',
                              fontSize: 12, color: 'var(--v3-text-muted)',
                              display: 'flex', flexDirection: 'column', gap: 6,
                            }}>
                              {ob.responsible_party && (
                                <p style={{ margin: 0 }}><span style={{ color: 'var(--v3-text-muted)' }}>Responsible:</span> <span style={{ color: 'var(--v3-text-secondary)' }}>{ob.responsible_party}</span></p>
                              )}
                              {ob.due_date && (
                                <p style={{ margin: 0 }}><span style={{ color: 'var(--v3-text-muted)' }}>Due:</span> <span style={{ color: 'var(--v3-text-secondary)' }}>{ob.due_date}</span></p>
                              )}
                              <p style={{ margin: 0 }}><span style={{ color: 'var(--v3-text-muted)' }}>Type:</span> <span style={{ color: 'var(--v3-text-secondary)' }}>{ob.obligation_type}</span></p>
                              <p style={{ margin: 0 }}><span style={{ color: 'var(--v3-text-muted)' }}>Extracted:</span> <span style={{ color: 'var(--v3-text-secondary)' }}>{new Date(ob.created_at).toLocaleDateString()}</span></p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </V3Shell>
  )
}
