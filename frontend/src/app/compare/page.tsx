'use client'

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  GitCompareArrows, FileText, CheckCircle, Loader2,
  AlertTriangle, X, Plus, Eye
} from 'lucide-react'
import { api, Document, AnalysisSummary, Clause } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { type RiskLevel, formatClauseType, getTopRisk } from '@/lib/risk'
import { V3Shell } from '@/components/v3/shell'
import { PageHeader, RiskPill } from '@/components/v3/primitives'

interface CompareDoc {
  doc: Document
  summary: AnalysisSummary | null
  clauses: Clause[]
  loading: boolean
}

const toRiskLevel = (level: string | null | undefined): RiskLevel =>
  level === 'critical' || level === 'high' || level === 'medium' || level === 'low' ? level : 'low'

function ComparePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [compareDocs, setCompareDocs] = useState<CompareDoc[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const { error: showError } = useToast()

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPicker])

  // Update URL whenever the selected doc IDs change
  const updateUrl = useCallback((docIds: string[]) => {
    const params = new URLSearchParams()
    if (docIds.length > 0) params.set('docs', docIds.join(','))
    router.replace(`/compare${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }, [router])

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.documents.list({ limit: 100 })
        setDocuments(response.documents.filter(d => d.status === 'completed'))
      } catch (err) {
        console.error('Failed to load documents:', err)
        showError('Failed to load documents. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [showError])

  // Restore selected documents from URL after the document list loads
  useEffect(() => {
    if (loading || initialized) return
    setInitialized(true)

    const docParam = searchParams.get('docs')
    if (!docParam) return

    const ids = docParam.split(',').filter(Boolean)
    const toAdd = ids
      .map(id => documents.find(d => d.id === id))
      .filter((d): d is Document => d !== undefined)
      .slice(0, 5)

    if (toAdd.length === 0) return

    // Set all as loading immediately so the UI responds at once
    setCompareDocs(toAdd.map(doc => ({ doc, summary: null, clauses: [], loading: true })))

    // Fetch analysis for each in parallel
    toAdd.forEach(async (doc) => {
      try {
        const [summary, clauses] = await Promise.all([
          api.analysis.summary(doc.id).catch(() => null),
          api.analysis.clauses(doc.id).catch(() => [] as Clause[]),
        ])
        setCompareDocs(prev => prev.map(cd =>
          cd.doc.id === doc.id ? { ...cd, summary, clauses, loading: false } : cd
        ))
      } catch {
        setCompareDocs(prev => prev.map(cd =>
          cd.doc.id === doc.id ? { ...cd, loading: false } : cd
        ))
      }
    })
  }, [loading, documents, initialized, searchParams])

  const addDocument = async (doc: Document) => {
    if (compareDocs.find(cd => cd.doc.id === doc.id)) return
    if (compareDocs.length >= 5) return

    const newEntry: CompareDoc = { doc, summary: null, clauses: [], loading: true }
    setCompareDocs(prev => {
      const next = [...prev, newEntry]
      updateUrl(next.map(cd => cd.doc.id))
      return next
    })
    setShowPicker(false)

    try {
      const [summary, clauses] = await Promise.all([
        api.analysis.summary(doc.id).catch(() => null),
        api.analysis.clauses(doc.id).catch(() => [] as Clause[]),
      ])
      setCompareDocs(prev => prev.map(cd =>
        cd.doc.id === doc.id ? { ...cd, summary, clauses, loading: false } : cd
      ))
    } catch {
      setCompareDocs(prev => prev.map(cd =>
        cd.doc.id === doc.id ? { ...cd, loading: false } : cd
      ))
    }
  }

  const removeDocument = (docId: string) => {
    setCompareDocs(prev => {
      const next = prev.filter(cd => cd.doc.id !== docId)
      updateUrl(next.map(cd => cd.doc.id))
      return next
    })
  }

  // Collect all clause types across compared docs
  const allClauseTypes = useMemo(() => {
    const types = new Set<string>()
    for (const cd of compareDocs) {
      if (cd.summary?.clause_breakdown) {
        for (const type of Object.keys(cd.summary.clause_breakdown)) {
          types.add(type)
        }
      }
    }
    return Array.from(types).sort()
  }, [compareDocs])

  // Available docs (not already selected)
  const availableDocs = useMemo(
    () => documents.filter(d => !compareDocs.find(cd => cd.doc.id === d.id)),
    [documents, compareDocs]
  )

  const getCellData = (cd: CompareDoc, clauseType: string) => {
    const breakdown = cd.summary?.clause_breakdown[clauseType]
    if (!breakdown) return null
    const topRisk = getTopRisk(breakdown.risk_levels)
    const matchingClauses = cd.clauses.filter(c => c.clause_type === clauseType)
    return { breakdown, topRisk, clauses: matchingClauses }
  }

  return (
    <V3Shell>
      <PageHeader
        crumb="Workspace"
        title="Document Comparison"
        subtitle="Compare clause coverage and risk levels across contracts side-by-side"
      />

      {/* Selected Documents Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 32 }}
      >
        {compareDocs.map(cd => (
          <div
            key={cd.doc.id}
            className="v3-card"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}
          >
            {cd.loading ? (
              <Loader2 size={16} color="var(--v3-accent)" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <FileText size={16} color="var(--v3-accent)" />
            )}
            <span style={{ fontSize: 13, color: 'var(--v3-text-primary)', fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cd.doc.filename}</span>
            {cd.summary && (
              <RiskPill level={cd.summary.overall_risk ? toRiskLevel(cd.summary.overall_risk) : 'neutral'}>
                {cd.summary.overall_risk}
              </RiskPill>
            )}
            <button
              type="button"
              onClick={() => removeDocument(cd.doc.id)}
              style={{ display: 'flex', padding: 2, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--v3-text-muted)' }}
              aria-label="Remove document"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {compareDocs.length < 5 && (
          <div ref={pickerRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="v3-btn"
              style={{ borderStyle: 'dashed', color: 'var(--v3-text-secondary)' }}
            >
              <Plus size={16} />
              Add Document {compareDocs.length === 0 && '(select 2-5)'}
            </button>

            {/* Document Picker Dropdown */}
            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 320,
                    background: 'var(--v3-popover)', border: '1px solid var(--v3-border)',
                    borderRadius: 'var(--v3-radius-lg)', boxShadow: 'var(--v3-shadow-md)', zIndex: 20, overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: 12, borderBottom: '1px solid var(--v3-border)' }}>
                    <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', margin: 0 }}>Select a document to compare</p>
                  </div>
                  <div style={{ maxHeight: 256, overflowY: 'auto' }}>
                    {availableDocs.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', color: 'var(--v3-text-muted)', fontSize: 13 }}>No more documents available</div>
                    ) : (
                      availableDocs.map(doc => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => addDocument(doc)}
                          style={{
                            width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
                            background: 'transparent', border: 0, borderBottom: '1px solid var(--v3-border)',
                            cursor: 'pointer', textAlign: 'left',
                          }}
                        >
                          <FileText size={16} color="var(--v3-text-muted)" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: 'var(--v3-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</p>
                            <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', margin: 0 }}>
                              {doc.page_count ? `${doc.page_count} pages` : 'Unknown pages'} &middot; {doc.chunk_count} chunks
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Empty State */}
      {compareDocs.length < 2 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="v3-card"
          style={{ padding: 56 }}
        >
          <div style={{ maxWidth: 512, margin: '0 auto', textAlign: 'center' }}>
            {/* Mini side-by-side comparison preview */}
            <div style={{ marginBottom: 32, opacity: 0.4, pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {[0, 1].map((col) => (
                  <div key={col} style={{ flex: 1, maxWidth: 180, borderRadius: 'var(--v3-radius-md)', border: '1px solid var(--v3-border)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <FileText size={14} color="var(--v3-text-disabled)" />
                      <div style={{ height: 10, width: 64, background: 'var(--v3-border)', borderRadius: 3 }} />
                    </div>
                    {Array.from({ length: 4 }).map((_, row) => (
                      <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ height: 8, width: 56, background: 'var(--v3-border)', borderRadius: 3 }} />
                        <div
                          style={{
                            width: 20, height: 20, borderRadius: 'var(--v3-radius-sm)',
                            backgroundColor: col === 0
                              ? ['rgba(239,68,68,0.2)', 'rgba(249,115,22,0.2)', 'rgba(16,185,129,0.15)', 'rgba(113,113,122,0.1)'][row]
                              : ['rgba(249,115,22,0.2)', 'rgba(16,185,129,0.15)', 'rgba(113,113,122,0.1)', 'rgba(239,68,68,0.2)'][row],
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <GitCompareArrows size={40} color="var(--v3-text-disabled)" style={{ margin: '0 auto', display: 'block' }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 16, color: 'var(--v3-text-primary)' }}>
              {compareDocs.length === 0 ? 'Compare Your Contracts' : 'Add One More Document'}
            </h2>
            <p style={{ color: 'var(--v3-text-muted)', marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', fontSize: 13, lineHeight: 1.6 }}>
              {compareDocs.length === 0
                ? 'Select 2-5 contracts to see a clause-by-clause comparison matrix. Spot coverage gaps, risk differences, and missing provisions across agreements.'
                : 'You need at least two documents to build the comparison matrix. Use the "Add Document" button above to pick another contract.'
              }
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Comparison Matrix */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="v3-card"
            style={{ overflow: 'hidden', marginBottom: 32 }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Clause Comparison Matrix</h2>
              <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 4, marginBottom: 0 }}>
                {allClauseTypes.length} clause types across {compareDocs.length} documents
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="v3-table">
                <thead>
                  <tr>
                    <th style={{ position: 'sticky', left: 0, zIndex: 10, minWidth: 160 }}>
                      Clause Type
                    </th>
                    {compareDocs.map(cd => (
                      <th key={cd.doc.id} style={{ textAlign: 'center', minWidth: 180 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'none', letterSpacing: 0 }}>
                            {cd.doc.filename}
                          </span>
                          {cd.summary && (
                            <RiskPill level={cd.summary.overall_risk ? toRiskLevel(cd.summary.overall_risk) : 'neutral'}>
                              {cd.summary.overall_risk}
                            </RiskPill>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allClauseTypes.map((clauseType) => (
                    <tr key={clauseType}>
                      <td style={{ position: 'sticky', left: 0, zIndex: 10, background: 'var(--v3-card)' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--v3-text-secondary)' }}>{formatClauseType(clauseType)}</span>
                      </td>
                      {compareDocs.map(cd => {
                        const cellData = getCellData(cd, clauseType)
                        const cellKey = `${cd.doc.id}-${clauseType}`
                        const isExpanded = expandedCell === cellKey

                        return (
                          <td key={cd.doc.id} style={{ textAlign: 'center', position: 'relative' }}>
                            {cd.loading ? (
                              <Loader2 size={16} color="var(--v3-text-muted)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto', display: 'block' }} />
                            ) : cellData ? (
                              <button
                                type="button"
                                onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                                style={{
                                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                  padding: '8px 12px', borderRadius: 'var(--v3-radius-md)', cursor: 'pointer',
                                  background: isExpanded ? 'var(--v3-card-hover)' : 'transparent',
                                  border: isExpanded ? '1px solid rgba(212,168,45,0.35)' : '1px solid transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{
                                    width: 8, height: 8, borderRadius: 'var(--v3-radius-sm)',
                                    background: cellData.topRisk === 'critical' ? 'var(--v3-risk-critical)'
                                      : cellData.topRisk === 'high' ? 'var(--v3-risk-high)'
                                      : cellData.topRisk === 'medium' ? 'var(--v3-risk-medium)'
                                      : 'var(--v3-risk-low)',
                                  }} />
                                  <span className="v3-mono" style={{
                                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                                    color: cellData.topRisk === 'critical' ? 'var(--v3-risk-critical)'
                                      : cellData.topRisk === 'high' ? 'var(--v3-risk-high)'
                                      : cellData.topRisk === 'medium' ? 'var(--v3-risk-medium)'
                                      : cellData.topRisk === 'low' ? 'var(--v3-risk-low)'
                                      : 'var(--v3-text-muted)',
                                  }}>{cellData.topRisk}</span>
                                </div>
                                <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{cellData.breakdown.total} clause(s)</span>
                              </button>
                            ) : (
                              <span className="v3-mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--v3-text-disabled)' }}>
                                <span style={{ width: 8, height: 8, borderRadius: 'var(--v3-radius-sm)', background: 'var(--v3-border)' }} />
                                Not found
                              </span>
                            )}

                            {/* Expanded clause detail */}
                            {isExpanded && cellData && cellData.clauses.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                  position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                  marginTop: 4, width: 288, background: 'var(--v3-popover)',
                                  border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-lg)',
                                  boxShadow: 'var(--v3-shadow-md)', zIndex: 30, padding: 16, textAlign: 'left',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--v3-text-primary)' }}>{formatClauseType(clauseType)}</span>
                                  <button type="button" onClick={() => setExpandedCell(null)} style={{ display: 'flex', padding: 2, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--v3-text-muted)' }}>
                                    <X size={14} />
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 192, overflowY: 'auto' }}>
                                  {cellData.clauses.slice(0, 3).map((clause) => (
                                    <div key={clause.id} style={{ padding: 10, background: 'var(--v3-card)', borderRadius: 'var(--v3-radius-md)' }}>
                                      {clause.risk_level && (
                                        <div style={{ marginBottom: 6 }}>
                                          <RiskPill level={toRiskLevel(clause.risk_level)}>
                                            {clause.risk_level}
                                          </RiskPill>
                                        </div>
                                      )}
                                      <p style={{ fontSize: 11, color: 'var(--v3-text-secondary)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {clause.summary || clause.content.substring(0, 200)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                                <Link
                                  href={`/documents/${cd.doc.id}`}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--v3-accent)', textDecoration: 'none' }}
                                >
                                  <Eye size={12} />
                                  View Full Document
                                </Link>
                              </motion.div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Coverage Gaps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
            className="v3-card"
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Coverage Gaps</h2>
              <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 4, marginBottom: 0 }}>
                Clause types missing from individual documents
              </p>
            </div>
            <div style={{ padding: 24 }}>
              {(() => {
                const gaps: Array<{ doc: Document; missing: string[] }> = []
                for (const cd of compareDocs) {
                  if (!cd.summary) continue
                  const missing = allClauseTypes.filter(type => !cd.summary?.clause_breakdown[type])
                  if (missing.length > 0) {
                    gaps.push({ doc: cd.doc, missing })
                  }
                }

                if (gaps.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <CheckCircle size={40} color="var(--v3-risk-low)" style={{ margin: '0 auto', display: 'block', opacity: 0.6 }} />
                      <p style={{ color: 'var(--v3-text-muted)', fontSize: 13, marginTop: 12 }}>All documents cover the same clause types</p>
                    </div>
                  )
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {gaps.map(({ doc, missing }) => (
                      <div key={doc.id} style={{ padding: 16, background: 'var(--v3-panel)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <AlertTriangle size={16} color="var(--v3-risk-medium)" />
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--v3-text-primary)' }}>{doc.filename}</span>
                          <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                            missing {missing.length} clause type{missing.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {missing.map(type => (
                            <span
                              key={type}
                              className="v3-mono"
                              style={{
                                fontSize: 11, padding: '4px 10px',
                                background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)',
                                borderRadius: 'var(--v3-radius-sm)', color: 'var(--v3-risk-medium)',
                              }}
                            >
                              {formatClauseType(type)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </motion.div>
        </>
      )}
    </V3Shell>
  )
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageContent />
    </Suspense>
  )
}
