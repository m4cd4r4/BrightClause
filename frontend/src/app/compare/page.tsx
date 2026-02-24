'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  GitCompareArrows, FileText, CheckCircle, Loader2,
  AlertTriangle, X, Plus, Eye
} from 'lucide-react'
import { api, Document, AnalysisSummary, Clause } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Navigation } from '@/lib/navigation'
import { type RiskLevel, riskConfig, formatClauseType, getTopRisk } from '@/lib/risk'

interface CompareDoc {
  doc: Document
  summary: AnalysisSummary | null
  clauses: Clause[]
  loading: boolean
}

function ComparePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [compareDocs, setCompareDocs] = useState<CompareDoc[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const { error: showError } = useToast()

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
    <div className="min-h-screen bg-ink-950">
      <Navigation />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-50">Document Comparison</h1>
          <p className="text-sm text-ink-500 mt-1">
            Compare clause coverage and risk levels across contracts side-by-side
          </p>
        </motion.div>

        {/* Selected Documents Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-3 mb-8"
        >
          {compareDocs.map(cd => (
            <div
              key={cd.doc.id}
              className="flex items-center gap-2 px-4 py-2.5 bg-ink-900/50 border border-ink-800/50 rounded-xl group"
            >
              {cd.loading ? (
                <Loader2 className="w-4 h-4 text-accent animate-spin" />
              ) : (
                <FileText className="w-4 h-4 text-accent" />
              )}
              <span className="text-sm text-ink-200 font-medium max-w-[200px] truncate">{cd.doc.filename}</span>
              {cd.summary && (
                <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded
                  ${cd.summary.overall_risk ? riskConfig[cd.summary.overall_risk]?.color : 'text-ink-500'}
                  ${cd.summary.overall_risk ? riskConfig[cd.summary.overall_risk]?.bg + '/15' : 'bg-ink-800/30'}`}>
                  {cd.summary.overall_risk}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeDocument(cd.doc.id)}
                className="p-0.5 text-ink-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {compareDocs.length < 5 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-ink-700 rounded-xl
                         text-sm text-ink-400 hover:text-accent hover:border-accent/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Document {compareDocs.length === 0 && '(select 2-5)'}
              </button>

              {/* Document Picker Dropdown */}
              <AnimatePresence>
                {showPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute top-full left-0 mt-2 w-80 bg-ink-900 border border-ink-700 rounded-xl shadow-xl z-20 overflow-hidden"
                  >
                    <div className="p-3 border-b border-ink-800/50">
                      <p className="text-xs text-ink-500 font-mono">Select a document to compare</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-ink-800/20">
                      {availableDocs.length === 0 ? (
                        <div className="p-4 text-center text-ink-500 text-sm">No more documents available</div>
                      ) : (
                        availableDocs.map(doc => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => addDocument(doc)}
                            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-ink-800/50 transition-colors text-left"
                          >
                            <FileText className="w-4 h-4 text-ink-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink-200 truncate">{doc.filename}</p>
                              <p className="text-[10px] text-ink-500 font-mono">
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
            className="card p-16 text-center"
          >
            <GitCompareArrows className="w-16 h-16 text-ink-700 mx-auto" />
            <h2 className="font-display text-xl font-semibold mt-6">
              {compareDocs.length === 0 ? 'Select Documents to Compare' : 'Add One More Document'}
            </h2>
            <p className="text-ink-500 mt-2 max-w-md mx-auto">
              {compareDocs.length === 0
                ? 'Choose 2-5 contracts from your portfolio to compare their clause coverage, risk levels, and key provisions side-by-side.'
                : 'Select at least 2 documents to begin comparing clauses and risk levels.'
              }
            </p>
          </motion.div>
        ) : (
          <>
            {/* Comparison Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card overflow-hidden mb-8"
            >
              <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                <h2 className="font-display text-lg font-semibold text-ink-50">Clause Comparison Matrix</h2>
                <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                  {allClauseTypes.length} clause types across {compareDocs.length} documents
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-800/30">
                      <th className="sticky left-0 bg-ink-950 z-10 px-6 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-ink-500 min-w-[160px]">
                        Clause Type
                      </th>
                      {compareDocs.map(cd => (
                        <th key={cd.doc.id} className="px-4 py-3 text-center min-w-[180px]">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-mono text-ink-400 truncate max-w-[160px]">
                              {cd.doc.filename}
                            </span>
                            {cd.summary && (
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded
                                ${riskConfig[cd.summary.overall_risk]?.color}
                                ${riskConfig[cd.summary.overall_risk]?.bg}/15`}>
                                {cd.summary.overall_risk}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/20">
                    {allClauseTypes.map((clauseType) => (
                      <tr key={clauseType} className="hover:bg-ink-900/20 transition-colors">
                        <td className="sticky left-0 bg-ink-950 z-10 px-6 py-3">
                          <span className="text-xs font-medium text-ink-300">{formatClauseType(clauseType)}</span>
                        </td>
                        {compareDocs.map(cd => {
                          const cellData = getCellData(cd, clauseType)
                          const cellKey = `${cd.doc.id}-${clauseType}`
                          const isExpanded = expandedCell === cellKey

                          return (
                            <td key={cd.doc.id} className="px-4 py-3 text-center relative">
                              {cd.loading ? (
                                <Loader2 className="w-4 h-4 text-ink-600 animate-spin mx-auto" />
                              ) : cellData ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedCell(isExpanded ? null : cellKey)}
                                  className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all
                                    ${isExpanded ? 'bg-ink-800/50 ring-1 ring-accent/30' : 'hover:bg-ink-800/30'}
                                    ${cellData.topRisk ? riskConfig[cellData.topRisk]?.color : 'text-ink-500'}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-sm ${
                                      cellData.topRisk === 'critical' ? 'bg-red-500/60' :
                                      cellData.topRisk === 'high' ? 'bg-orange-500/50' :
                                      cellData.topRisk === 'medium' ? 'bg-amber-500/40' :
                                      'bg-emerald-500/30'
                                    }`} />
                                    <span className="text-[10px] font-mono font-bold uppercase">{cellData.topRisk}</span>
                                  </div>
                                  <span className="text-[10px] text-ink-500 font-mono">{cellData.breakdown.total} clause(s)</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-ink-600 font-mono">
                                  <span className="w-2 h-2 rounded-sm bg-ink-800/50" />
                                  Not found
                                </span>
                              )}

                              {/* Expanded clause detail */}
                              {isExpanded && cellData && cellData.clauses.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-ink-900 border border-ink-700 rounded-xl shadow-xl z-30 p-4 text-left"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold text-ink-200">{formatClauseType(clauseType)}</span>
                                    <button type="button" onClick={() => setExpandedCell(null)} className="p-0.5 text-ink-500 hover:text-ink-300">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {cellData.clauses.slice(0, 3).map((clause) => (
                                      <div key={clause.id} className="p-2.5 bg-ink-800/30 rounded-lg">
                                        {clause.risk_level && (
                                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded mb-1.5 inline-block
                                            ${riskConfig[clause.risk_level as RiskLevel]?.color}
                                            ${riskConfig[clause.risk_level as RiskLevel]?.bg}/15`}>
                                            {clause.risk_level}
                                          </span>
                                        )}
                                        <p className="text-[11px] text-ink-400 leading-relaxed line-clamp-3">
                                          {clause.summary || clause.content.substring(0, 200)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                  <Link
                                    href={`/documents/${cd.doc.id}`}
                                    className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-accent hover:text-accent-light transition-colors"
                                  >
                                    <Eye className="w-3 h-3" />
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                <h2 className="font-display text-lg font-semibold text-ink-50">Coverage Gaps</h2>
                <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                  Clause types missing from individual documents
                </p>
              </div>
              <div className="p-6">
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
                      <div className="text-center py-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto" />
                        <p className="text-ink-500 text-sm mt-3">All documents cover the same clause types</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      {gaps.map(({ doc, missing }) => (
                        <div key={doc.id} className="p-4 bg-ink-900/30 border border-ink-800/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-ink-200">{doc.filename}</span>
                            <span className="text-[10px] text-ink-500 font-mono">
                              missing {missing.length} clause type{missing.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {missing.map(type => (
                              <span
                                key={type}
                                className="text-[10px] font-mono px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-400"
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
      </main>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense>
      <ComparePageContent />
    </Suspense>
  )
}
