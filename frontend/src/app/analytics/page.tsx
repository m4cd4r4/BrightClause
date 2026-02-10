'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BarChart3, Shield, AlertTriangle, CheckCircle, FileText,
  TrendingUp, Activity, Loader2, ChevronRight, Eye, GitBranch
} from 'lucide-react'
import { api, Document, AnalysisSummary } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Navigation } from '@/lib/navigation'
import { type RiskLevel, riskConfig, riskCellColors, formatClauseType, getTopRisk } from '@/lib/risk'

interface DocAnalysis {
  doc: Document
  summary: AnalysisSummary | null
}

export default function AnalyticsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [analyses, setAnalyses] = useState<Map<string, AnalysisSummary>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingAnalyses, setLoadingAnalyses] = useState(false)
  const [crossRefs, setCrossRefs] = useState<Array<{
    normalized_name: string
    entity_type: string
    document_count: number
    documents: Array<{ document_id: string; filename: string; contexts: string[] }>
  }>>([])
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null)
  const { error: showError } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const docsResponse = await api.documents.list({ limit: 100 })
      const completed = docsResponse.documents.filter(d => d.status === 'completed')
      setDocuments(completed)
      setLoading(false)

      setLoadingAnalyses(true)
      const summaries = new Map<string, AnalysisSummary>()
      const results = await Promise.allSettled(
        completed.map(doc => api.analysis.summary(doc.id))
      )
      results.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value.clauses_extracted > 0) {
          summaries.set(completed[i].id, result.value)
        }
      })
      setAnalyses(summaries)

      // Load cross-document entity references
      try {
        const crossRefData = await api.graph.crossReference(2)
        setCrossRefs(crossRefData.entities)
      } catch {
        // Cross-reference is optional, don't fail the page
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err)
      showError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
      setLoadingAnalyses(false)
    }
  }

  const docAnalyses: DocAnalysis[] = useMemo(() =>
    documents.map(doc => ({
      doc,
      summary: analyses.get(doc.id) || null,
    })).filter(da => da.summary !== null),
    [documents, analyses]
  )

  // Aggregate stats
  const portfolioStats = useMemo(() => {
    let totalClauses = 0
    let critical = 0, high = 0, medium = 0, low = 0
    const clauseTypeFreq: Record<string, { total: number; risks: Record<string, number> }> = {}

    for (const { summary } of docAnalyses) {
      if (!summary) continue
      totalClauses += summary.clauses_extracted
      critical += summary.risk_summary.critical || 0
      high += summary.risk_summary.high || 0
      medium += summary.risk_summary.medium || 0
      low += summary.risk_summary.low || 0

      for (const [clauseType, breakdown] of Object.entries(summary.clause_breakdown)) {
        if (!clauseTypeFreq[clauseType]) {
          clauseTypeFreq[clauseType] = { total: 0, risks: {} }
        }
        clauseTypeFreq[clauseType].total += breakdown.total
        for (const [risk, count] of Object.entries(breakdown.risk_levels)) {
          clauseTypeFreq[clauseType].risks[risk] = (clauseTypeFreq[clauseType].risks[risk] || 0) + count
        }
      }
    }

    const totalRisk = critical + high + medium + low
    const healthScore = totalRisk > 0
      ? Math.round(((low * 100 + medium * 60 + high * 25 + critical * 0) / (totalRisk * 100)) * 100)
      : 100

    return {
      totalDocs: docAnalyses.length,
      totalClauses,
      critical, high, medium, low,
      healthScore,
      clauseTypeFreq,
    }
  }, [docAnalyses])

  // All unique clause types across all documents (sorted by frequency)
  const allClauseTypes = useMemo(() =>
    Object.entries(portfolioStats.clauseTypeFreq)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([type]) => type),
    [portfolioStats.clauseTypeFreq]
  )

  // Top risk highlights across all docs
  const allHighlights = useMemo(() => {
    const highlights: Array<{ docName: string; docId: string; clause_type: string; risk_level: string; summary: string }> = []
    for (const { doc, summary } of docAnalyses) {
      if (!summary) continue
      for (const h of summary.high_risk_highlights) {
        highlights.push({ docName: doc.filename, docId: doc.id, ...h })
      }
    }
    return highlights.sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
      return (order[a.risk_level] ?? 4) - (order[b.risk_level] ?? 4)
    })
  }, [docAnalyses])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-950">
        <Navigation />
        <main className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-96 rounded-xl" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navigation />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-50">Portfolio Analytics</h1>
          <p className="text-sm text-ink-500 mt-1">
            Risk assessment across {portfolioStats.totalDocs} analyzed contracts
          </p>
        </motion.div>

        {docAnalyses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-16 text-center"
          >
            <BarChart3 className="w-16 h-16 text-ink-700 mx-auto" />
            <h2 className="font-display text-xl font-semibold mt-6">No Analysis Data Yet</h2>
            <p className="text-ink-500 mt-2 max-w-md mx-auto">
              Upload and analyze contracts from the dashboard to see portfolio-wide risk analytics.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-accent text-ink-950 font-semibold rounded-xl hover:bg-accent-light transition-colors">
              Go to Dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Health Score + Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {/* Portfolio Health Score - Prominent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-2 lg:col-span-1 card p-6"
              >
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-3">
                    Portfolio Health
                  </div>
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-ink-800/50" />
                      <circle
                        cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${portfolioStats.healthScore * 2.64} 264`}
                        className={portfolioStats.healthScore >= 70 ? 'text-emerald-400' : portfolioStats.healthScore >= 40 ? 'text-amber-400' : 'text-red-400'}
                        stroke="currentColor"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold font-mono ${
                        portfolioStats.healthScore >= 70 ? 'text-emerald-400' : portfolioStats.healthScore >= 40 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {portfolioStats.healthScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-ink-500 mt-2 font-mono uppercase">
                    {portfolioStats.healthScore >= 70 ? 'Good Standing' : portfolioStats.healthScore >= 40 ? 'Needs Review' : 'At Risk'}
                  </p>
                </div>
              </motion.div>

              {/* Risk Level Stats */}
              {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level, i) => (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * (i + 1) }}
                  className="card p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${riskConfig[level].bg}/10`}>
                      {level === 'critical' ? <AlertTriangle className={`w-4 h-4 ${riskConfig[level].color}`} /> :
                       level === 'high' ? <TrendingUp className={`w-4 h-4 ${riskConfig[level].color}`} /> :
                       level === 'medium' ? <Activity className={`w-4 h-4 ${riskConfig[level].color}`} /> :
                       <CheckCircle className={`w-4 h-4 ${riskConfig[level].color}`} />}
                    </div>
                  </div>
                  <p className={`text-2xl font-bold font-mono ${riskConfig[level].color}`}>
                    {portfolioStats[level]}
                  </p>
                  <p className="text-[10px] text-ink-500 font-mono uppercase tracking-wide mt-1">
                    {riskConfig[level].label} Risk
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Risk Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card overflow-hidden mb-8"
            >
              <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-50">Risk Heatmap</h2>
                    <p className="text-[11px] text-ink-500 mt-1 font-mono">
                      Clause types vs. documents &middot; {loadingAnalyses ? 'Loading...' : `${docAnalyses.length} contracts`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase">
                    {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map(level => (
                      <div key={level} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-sm ${riskCellColors[level]}`} />
                        <span className="text-ink-500">{level}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded-sm ${riskCellColors.none}`} />
                      <span className="text-ink-500">none</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-800/30">
                      <th className="sticky left-0 bg-ink-950 z-10 px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-ink-500 min-w-[180px]">
                        Document
                      </th>
                      {allClauseTypes.map(type => (
                        <th key={type} className="px-2 py-3 text-center min-w-[70px]">
                          <span className="text-[9px] font-mono uppercase tracking-wide text-ink-500 whitespace-nowrap">
                            {formatClauseType(type)}
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-ink-500">
                        Overall
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/20">
                    {docAnalyses.map(({ doc, summary }, rowIdx) => (
                      <tr key={doc.id} className="hover:bg-ink-900/30 transition-colors group">
                        <td className="sticky left-0 bg-ink-950 group-hover:bg-ink-900/30 z-10 px-4 py-3">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="flex items-center gap-2 text-ink-300 hover:text-accent transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[150px] text-xs font-medium">{doc.filename}</span>
                          </Link>
                        </td>
                        {allClauseTypes.map(type => {
                          const clauseData = summary?.clause_breakdown[type]
                          const topRisk = getTopRisk(clauseData?.risk_levels)
                          return (
                            <td key={type} className="px-2 py-3 text-center">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: rowIdx * 0.02 + allClauseTypes.indexOf(type) * 0.01 }}
                                className={`w-8 h-8 rounded-md mx-auto flex items-center justify-center text-[10px] font-mono font-bold
                                  ${topRisk ? riskCellColors[topRisk] : riskCellColors.none}
                                  ${topRisk ? 'text-ink-100' : 'text-ink-700'}`}
                                title={clauseData ? `${clauseData.total} clause(s) - ${topRisk || 'unknown'} risk` : 'Not found'}
                              >
                                {clauseData ? clauseData.total : ''}
                              </motion.div>
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wide
                            ${summary?.overall_risk ? riskConfig[summary.overall_risk]?.color : 'text-ink-500'}
                            ${summary?.overall_risk ? riskConfig[summary.overall_risk]?.bg + '/10' : 'bg-ink-800/30'}`}>
                            {summary?.overall_risk || '?'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Two Column: Clause Distribution + Top Risks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Clause Type Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                  <h2 className="font-display text-lg font-semibold text-ink-50">Clause Distribution</h2>
                  <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                    {portfolioStats.totalClauses} total clauses across {allClauseTypes.length} types
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  {allClauseTypes.map((type, i) => {
                    const data = portfolioStats.clauseTypeFreq[type]
                    const maxCount = Math.max(...Object.values(portfolioStats.clauseTypeFreq).map(d => d.total))
                    const pct = maxCount > 0 ? (data.total / maxCount) * 100 : 0
                    const topRisk = getTopRisk(data.risks)

                    return (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.03 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-ink-300">{formatClauseType(type)}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono ${topRisk ? riskConfig[topRisk]?.color : 'text-ink-500'}`}>
                              {topRisk?.toUpperCase() || 'N/A'}
                            </span>
                            <span className="text-xs font-mono text-ink-400">{data.total}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-ink-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.4 + i * 0.03, duration: 0.5 }}
                            className={`h-full rounded-full ${topRisk ? riskConfig[topRisk]?.bg : 'bg-ink-600'}`}
                            style={{ opacity: 0.6 }}
                          />
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Top Risk Highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                  <h2 className="font-display text-lg font-semibold text-ink-50">Top Risk Items</h2>
                  <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                    {allHighlights.length} flagged clauses across portfolio
                  </p>
                </div>
                <div className="divide-y divide-ink-800/20 max-h-[500px] overflow-y-auto">
                  {allHighlights.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto" />
                      <p className="text-ink-500 text-sm mt-3">No high-risk clauses detected</p>
                    </div>
                  ) : (
                    allHighlights.slice(0, 15).map((highlight, i) => (
                      <motion.div
                        key={`${highlight.docId}-${highlight.clause_type}-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.03 }}
                        className="px-6 py-4 hover:bg-ink-900/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${
                                highlight.risk_level === 'critical' ? 'text-red-400' : 'text-orange-400'
                              }`} />
                              <span className="text-xs font-semibold uppercase tracking-wide text-ink-200">
                                {formatClauseType(highlight.clause_type)}
                              </span>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                                highlight.risk_level === 'critical'
                                  ? 'bg-red-500/15 text-red-400'
                                  : 'bg-orange-500/15 text-orange-400'
                              }`}>
                                {highlight.risk_level}
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-500 mb-1 font-mono">{highlight.docName}</p>
                            <p className="text-xs text-ink-400 leading-relaxed line-clamp-2">
                              {highlight.summary}
                            </p>
                          </div>
                          <Link
                            href={`/documents/${highlight.docId}`}
                            className="p-1.5 text-ink-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* Cross-Document Entity References */}
            {crossRefs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                className="card overflow-hidden mb-8"
              >
                <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-accent" />
                    <div>
                      <h2 className="font-display text-lg font-semibold text-ink-50">Cross-Document Entities</h2>
                      <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                        {crossRefs.length} entities appearing in 2+ contracts
                      </p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-ink-800/20">
                  {crossRefs.slice(0, 20).map((entity, i) => (
                    <motion.div
                      key={`${entity.normalized_name}-${entity.entity_type}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.02 }}
                    >
                      <button
                        onClick={() => setExpandedEntity(
                          expandedEntity === entity.normalized_name ? null : entity.normalized_name
                        )}
                        className="w-full px-6 py-4 text-left hover:bg-ink-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-ink-800/50 text-ink-400">
                              {entity.entity_type}
                            </span>
                            <span className="text-sm font-medium text-ink-200">{entity.normalized_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-accent">{entity.document_count} docs</span>
                            <ChevronRight className={`w-4 h-4 text-ink-600 transition-transform ${
                              expandedEntity === entity.normalized_name ? 'rotate-90' : ''
                            }`} />
                          </div>
                        </div>
                      </button>
                      {expandedEntity === entity.normalized_name && (
                        <div className="px-6 pb-4 space-y-2">
                          {entity.documents.map(doc => (
                            <div key={doc.document_id} className="pl-4 border-l-2 border-ink-800/50">
                              <Link
                                href={`/documents/${doc.document_id}`}
                                className="text-xs font-medium text-ink-300 hover:text-accent transition-colors flex items-center gap-1.5"
                              >
                                <FileText className="w-3 h-3" />
                                {doc.filename}
                              </Link>
                              {doc.contexts.length > 0 && (
                                <p className="text-[11px] text-ink-500 mt-1 line-clamp-2">
                                  {doc.contexts[0]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Risk by Document - Summary Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                <h2 className="font-display text-lg font-semibold text-ink-50">Document Risk Summary</h2>
                <p className="text-[11px] text-ink-500 mt-0.5 font-mono">
                  Per-document clause count and risk breakdown
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink-800/30">
                      <th className="px-6 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-ink-500">Document</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-ink-500">Clauses</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-red-400/70">Crit</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-orange-400/70">High</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-amber-400/70">Med</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-emerald-400/70">Low</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-ink-500">Overall</th>
                      <th className="px-4 py-3 text-center text-[10px] font-mono uppercase tracking-widest text-ink-500">Risk Bar</th>
                      <th className="px-4 py-3 text-right text-[10px] font-mono uppercase tracking-widest text-ink-500"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/20">
                    {docAnalyses
                      .sort((a, b) => {
                        const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
                        return (order[a.summary?.overall_risk || 'low'] ?? 4) - (order[b.summary?.overall_risk || 'low'] ?? 4)
                      })
                      .map(({ doc, summary }) => {
                        const total = summary ? summary.risk_summary.critical + summary.risk_summary.high + summary.risk_summary.medium + summary.risk_summary.low : 0
                        return (
                          <tr key={doc.id} className="hover:bg-ink-900/20 transition-colors group">
                            <td className="px-6 py-3">
                              <Link
                                href={`/documents/${doc.id}`}
                                className="flex items-center gap-2 text-ink-300 hover:text-accent transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[250px] text-xs font-medium">{doc.filename}</span>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-ink-300">{summary?.clauses_extracted || 0}</td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-red-400">{summary?.risk_summary.critical || 0}</td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-orange-400">{summary?.risk_summary.high || 0}</td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-amber-400">{summary?.risk_summary.medium || 0}</td>
                            <td className="px-4 py-3 text-center text-xs font-mono text-emerald-400">{summary?.risk_summary.low || 0}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase
                                ${summary?.overall_risk ? riskConfig[summary.overall_risk]?.color : 'text-ink-500'}
                                ${summary?.overall_risk ? riskConfig[summary.overall_risk]?.bg + '/10' : 'bg-ink-800/30'}`}>
                                {summary?.overall_risk || '?'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {total > 0 && (
                                <div className="flex h-2 rounded-full overflow-hidden w-24">
                                  {summary && summary.risk_summary.critical > 0 && (
                                    <div className="bg-red-500" style={{ width: `${(summary.risk_summary.critical / total) * 100}%` }} />
                                  )}
                                  {summary && summary.risk_summary.high > 0 && (
                                    <div className="bg-orange-500" style={{ width: `${(summary.risk_summary.high / total) * 100}%` }} />
                                  )}
                                  {summary && summary.risk_summary.medium > 0 && (
                                    <div className="bg-amber-500" style={{ width: `${(summary.risk_summary.medium / total) * 100}%` }} />
                                  )}
                                  {summary && summary.risk_summary.low > 0 && (
                                    <div className="bg-emerald-500" style={{ width: `${(summary.risk_summary.low / total) * 100}%` }} />
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/documents/${doc.id}`}
                                className="p-1.5 text-ink-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors inline-flex"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </main>
    </div>
  )
}
