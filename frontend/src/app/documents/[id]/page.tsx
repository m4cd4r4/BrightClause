'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, AlertTriangle, Shield,
  Loader2, ChevronDown, ChevronRight, Network,
  Download, Zap, FileSpreadsheet, FileType, FileJson, Lightbulb,
  FileBarChart, X, CheckCircle, ClipboardCheck, BookOpen, Key
} from 'lucide-react'
import { api, Document, Clause, AnalysisSummary, Entity, ReportData } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { exportToExcel, exportToWord, exportToPDF, exportToCSV, exportToJSON, exportReport } from '@/lib/export-lazy'
import { Navigation } from '@/lib/navigation'
import { type RiskLevel, riskConfig } from '@/lib/risk'
import { ChatPanel } from './chat-panel'
import { Timeline } from './timeline'
import { PdfViewer } from './pdf-viewer'

const clauseTypeLabels: Record<string, string> = {
  termination: 'Termination',
  indemnification: 'Indemnification',
  limitation_of_liability: 'Limitation of Liability',
  confidentiality: 'Confidentiality',
  non_compete: 'Non-Compete',
  intellectual_property: 'Intellectual Property',
  change_of_control: 'Change of Control',
  assignment: 'Assignment',
  governing_law: 'Governing Law',
  dispute_resolution: 'Dispute Resolution',
  warranty: 'Warranty',
  force_majeure: 'Force Majeure',
  payment_terms: 'Payment Terms',
  insurance: 'Insurance',
  audit_rights: 'Audit Rights',
}

function ByokForm({ onSubmit, initialKey, onCancel }: {
  onSubmit: (key: string) => void
  initialKey: string
  onCancel: () => void
}) {
  const [key, setKey] = useState(initialKey)
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(key) }}>
      <input
        type="password"
        autoFocus
        placeholder="sk-ant-api03-..."
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="w-full px-3 py-2 bg-ink-900 border border-ink-700 rounded-lg text-sm font-mono text-ink-200 placeholder-ink-600 focus:outline-none focus:border-accent mb-4"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={!key.trim()} className="flex-1 btn-primary text-sm py-2">
          <Zap className="w-4 h-4 mr-2" /> Extract Clauses
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-ink-400 hover:text-ink-200 border border-ink-700 rounded-lg">
          Cancel
        </button>
      </div>
      <p className="text-[10px] text-ink-600 mt-3 text-center">
        Get your key at <span className="text-ink-400">console.anthropic.com</span>
      </p>
    </form>
  )
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [document, setDocument] = useState<Document | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null)
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [selectedClauseType, setSelectedClauseType] = useState<string | null>(null)
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null)
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [entities, setEntities] = useState<Entity[]>([])
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [explaining, setExplaining] = useState<string | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [extractingObligations, setExtractingObligations] = useState(false)
  const [viewMode, setViewMode] = useState<'analysis' | 'pdf'>('analysis')
  const [showByokModal, setShowByokModal] = useState(false)
  const [byokApiKey, setByokApiKey] = useState(() =>
    typeof window !== 'undefined' ? sessionStorage.getItem('cc_claude_api_key') || '' : ''
  )
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { error: showError, success: showSuccess } = useToast()

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    loadDocument()
  }, [documentId])

  const loadDocument = async () => {
    try {
      const [doc, analysisRes] = await Promise.all([
        api.documents.get(documentId),
        api.analysis.summary(documentId).catch(() => null),
      ])
      setDocument(doc)
      setAnalysis(analysisRes)

      if (analysisRes && analysisRes.clauses_extracted > 0) {
        const clausesRes = await api.analysis.clauses(documentId)
        setClauses(clausesRes)
      }
      const entitiesRes = await api.graph.entities(documentId).catch(() => [])
      setEntities(entitiesRes)
    } catch (error) {
      console.error('Failed to load document:', error)
      showError('Failed to load document data.')
    } finally {
      setLoading(false)
    }
  }

  const triggerExtraction = async (apiKey?: string) => {
    // Use provided key, then stored BYOK key, then undefined (backend falls back to Ollama)
    const keyToUse = apiKey || byokApiKey || undefined
    setExtracting(true)
    try {
      await api.analysis.extract(documentId, keyToUse)
      // Poll for completion with proper cleanup
      pollIntervalRef.current = setInterval(async () => {
        const analysisRes = await api.analysis.summary(documentId).catch(() => null)
        if (analysisRes && analysisRes.status === 'completed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
          setAnalysis(analysisRes)
          const clausesRes = await api.analysis.clauses(documentId)
          setClauses(clausesRes)
          setExtracting(false)
        }
      }, 3000)
      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setExtracting(false)
      }, 120000)
    } catch (error) {
      console.error('Extraction failed:', error)
      setExtracting(false)
    }
  }

  const handleByokSubmit = (key: string) => {
    if (key.trim()) {
      sessionStorage.setItem('cc_claude_api_key', key.trim())
      setByokApiKey(key.trim())
    }
    setShowByokModal(false)
    if (key.trim()) triggerExtraction(key.trim())
  }

  const filteredClauses = clauses.filter((clause) => {
    if (selectedClauseType && clause.clause_type !== selectedClauseType) return false
    if (selectedRiskLevel && clause.risk_level !== selectedRiskLevel) return false
    return true
  })

  const toggleClause = (clauseId: string) => {
    const newExpanded = new Set(expandedClauses)
    if (newExpanded.has(clauseId)) {
      newExpanded.delete(clauseId)
    } else {
      newExpanded.add(clauseId)
    }
    setExpandedClauses(newExpanded)
  }

  const clauseTypeCounts = clauses.reduce((acc, clause) => {
    acc[clause.clause_type] = (acc[clause.clause_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleExport = async (format: string) => {
    if (!document) return
    setExporting(format)
    setShowExportMenu(false)
    try {
      switch (format) {
        case 'excel':
          await exportToExcel(document, analysis, clauses, entities)
          break
        case 'word':
          await exportToWord(document, analysis, clauses, entities)
          break
        case 'pdf':
          await exportToPDF(document, analysis, clauses, entities)
          break
        case 'csv':
          exportToCSV(document, clauses)
          break
        case 'json':
          exportToJSON(document, analysis, clauses, entities)
          break
      }
    } catch (error) {
      console.error('Export failed:', error)
      showError(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExporting(null)
    }
  }

  const handleExplain = async (clauseId: string) => {
    if (explaining || explanations[clauseId]) return
    setExplaining(clauseId)
    try {
      const result = await api.analysis.explainClause(documentId, clauseId, byokApiKey || undefined)
      setExplanations(prev => ({ ...prev, [clauseId]: result.explanation }))
    } catch {
      showError('Failed to generate explanation. Please try again.')
    } finally {
      setExplaining(null)
    }
  }

  const handleGenerateReport = async () => {
    if (generatingReport) return
    setGeneratingReport(true)
    setShowReport(true)
    try {
      const result = await api.analysis.report(documentId)
      setReport(result)
    } catch {
      showError('Failed to generate report. Please try again.')
      setShowReport(false)
    } finally {
      setGeneratingReport(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!report) return
    try {
      await exportReport(report)
      showSuccess('Report downloaded successfully.')
    } catch {
      showError('Failed to download report.')
    }
  }

  const handleExtractObligations = async () => {
    if (extractingObligations) return
    setExtractingObligations(true)
    try {
      const result = await api.obligations.extractForDocument(documentId, byokApiKey || undefined)
      showSuccess(result.message)
    } catch {
      showError('Failed to extract obligations.')
    } finally {
      setExtractingObligations(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <div className="skeleton h-28 rounded-lg col-span-2 md:col-span-3 lg:col-span-2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="card p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-8 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-ink-700 mx-auto" />
          <h2 className="mt-4 text-xl font-display font-semibold">Document Not Found</h2>
          <p className="mt-2 text-ink-500">The requested document could not be found.</p>
          <Link href="/dashboard" className="mt-6 btn-primary inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* BYOK Modal */}
      <AnimatePresence>
        {showByokModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowByokModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-md w-full p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">AI Extraction Key</h3>
                    <p className="text-xs text-ink-500">Powered by Anthropic Claude</p>
                  </div>
                </div>
                <button onClick={() => setShowByokModal(false)} className="text-ink-500 hover:text-ink-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-ink-400 mb-4">
                Enter your <span className="text-accent font-medium">Anthropic API key</span> to run AI clause extraction on this document. Your key is stored in session only and never saved to our servers.
              </p>
              <ByokForm onSubmit={handleByokSubmit} initialKey={byokApiKey} onCancel={() => setShowByokModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation>
        {/* Document Info */}
        <div className="hidden sm:flex items-center gap-3 text-sm text-ink-400">
          <FileText className="w-4 h-4" />
          <span className="max-w-[200px] truncate font-medium text-ink-200">{document.filename}</span>
          <span className="text-ink-600">|</span>
          <span className="text-[11px] font-mono">
            {document.page_count && `${document.page_count}p`}
            {analysis && ` / ${analysis.clauses_extracted} clauses`}
          </span>
        </div>

        <Link
          href={`/documents/${documentId}/graph`}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 text-ink-200 rounded-lg
                   hover:bg-ink-700 transition-colors text-sm"
        >
          <Network className="w-4 h-4" />
          <span className="hidden sm:inline">Graph</span>
        </Link>

        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'pdf' ? 'analysis' : 'pdf')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
            viewMode === 'pdf'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-ink-800 text-ink-200 hover:bg-ink-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          onClick={handleGenerateReport}
          disabled={generatingReport || !analysis}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 text-ink-200 rounded-lg
                   hover:bg-ink-700 transition-colors disabled:opacity-50 text-sm"
        >
          {generatingReport ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileBarChart className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{generatingReport ? 'Generating...' : 'Report'}</span>
        </button>

        <button
          onClick={handleExtractObligations}
          disabled={extractingObligations || !analysis}
          className="flex items-center gap-2 px-3 py-2 bg-ink-800 text-ink-200 rounded-lg
                   hover:bg-ink-700 transition-colors disabled:opacity-50 text-sm"
        >
          {extractingObligations ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ClipboardCheck className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{extractingObligations ? 'Extracting...' : 'Obligations'}</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={exporting !== null}
            className="flex items-center gap-2 px-3 py-2 bg-ink-800 text-ink-200 rounded-lg
                     hover:bg-ink-700 transition-colors disabled:opacity-50 text-sm"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-ink-900 border border-ink-700 rounded-lg shadow-xl overflow-hidden z-50"
              >
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-ink-200 hover:bg-ink-800 transition-colors"
                >
                  <FileText className="w-4 h-4 text-red-400" />
                  PDF Report
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-ink-200 hover:bg-ink-800 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  Excel (.xlsx)
                </button>
                <button
                  onClick={() => handleExport('word')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-ink-200 hover:bg-ink-800 transition-colors"
                >
                  <FileType className="w-4 h-4 text-blue-400" />
                  Word (.docx)
                </button>
                <div className="border-t border-ink-700" />
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-ink-200 hover:bg-ink-800 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-ink-400" />
                  CSV (Clauses)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-ink-200 hover:bg-ink-800 transition-colors"
                >
                  <FileJson className="w-4 h-4 text-amber-400" />
                  JSON (Full Data)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Navigation>

      <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* PDF Viewer Mode */}
        {viewMode === 'pdf' ? (
          <PdfViewer
            documentId={documentId}
            clauses={clauses}
            activeClauseId={expandedClauses.size === 1 ? Array.from(expandedClauses)[0] : null}
            onClauseClick={(id) => {
              setExpandedClauses(new Set([id]))
              setViewMode('analysis')
            }}
          />
        ) : (
        <>
        {/* Risk Summary */}
        {analysis && analysis.clauses_extracted > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
          >
            {/* Overall Risk */}
            <div className={`card p-5 col-span-2 md:col-span-3 lg:col-span-2 ${
              analysis.overall_risk === 'critical' ? 'risk-critical' :
              analysis.overall_risk === 'high' ? 'risk-high' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink-400">Overall Risk Assessment</p>
                  <p className={`text-3xl font-display font-bold mt-1 capitalize
                              ${riskConfig[analysis.overall_risk]?.color || 'text-ink-300'}`}>
                    {analysis.overall_risk}
                  </p>
                </div>
                <Shield className={`w-12 h-12 ${
                  riskConfig[analysis.overall_risk]?.color || 'text-ink-600'
                }`} />
              </div>
            </div>

            {/* Risk Distribution */}
            {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => (
              <button
                key={level}
                className={`card p-5 cursor-pointer transition-all hover:scale-[1.02] text-left w-full
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50
                          ${selectedRiskLevel === level ? 'ring-2 ring-accent' : ''}
                          ${level === 'critical' || level === 'high' ? riskConfig[level].glow : ''}`}
                onClick={() => setSelectedRiskLevel(selectedRiskLevel === level ? null : level)}
                aria-pressed={selectedRiskLevel === level}
                aria-label={`Filter by ${level} risk: ${analysis.risk_summary[level] || 0} clauses`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium uppercase tracking-wider ${riskConfig[level].color}`}>
                    {level}
                  </span>
                  {(level === 'critical' || level === 'high') && analysis.risk_summary[level] > 0 && (
                    <AlertTriangle className={`w-4 h-4 ${riskConfig[level].color}`} />
                  )}
                </div>
                <p className="text-2xl font-mono font-bold text-ink-100">
                  {analysis.risk_summary[level] || 0}
                </p>
                <p className="text-xs text-ink-500 mt-1">clauses</p>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 mb-8 text-center"
          >
            <Zap className="w-12 h-12 text-accent/50 mx-auto" />
            <h3 className="font-display text-lg font-semibold mt-4">
              {analysis ? 'No Clauses Found' : 'Analysis Not Yet Run'}
            </h3>
            <p className="text-ink-500 mt-2">
              {analysis
                ? 'The AI extraction found no clauses in this document. Try re-running the extraction.'
                : 'Extract clauses and assess risk levels for this document.'}
            </p>
            <button
              onClick={() => triggerExtraction()}
              disabled={extracting}
              className="mt-6 btn-primary"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Extracting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {analysis ? 'Re-run Clause Extraction' : 'Run Clause Extraction'}
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Clauses Section */}
        {clauses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Clause Type Sidebar */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <div className="px-4 py-3 border-b border-ink-800/50">
                  <h3 className="font-display font-semibold text-sm">Clause Types</h3>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => setSelectedClauseType(null)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors
                              ${!selectedClauseType ? 'bg-accent/10 text-accent' : 'hover:bg-ink-800 text-ink-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>All Clauses</span>
                      <span className="font-mono text-xs">{clauses.length}</span>
                    </div>
                  </button>
                  {Object.entries(clauseTypeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <button
                        key={type}
                        onClick={() => setSelectedClauseType(selectedClauseType === type ? null : type)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors
                                  ${selectedClauseType === type ? 'bg-accent/10 text-accent' : 'hover:bg-ink-800 text-ink-300'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{clauseTypeLabels[type] || type.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-xs">{count}</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="card mt-4 p-4">
                <Timeline documentId={documentId} />
              </div>
            </div>

            {/* Clauses List */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">
                  Extracted Clauses
                  {(selectedClauseType || selectedRiskLevel) && (
                    <span className="ml-2 text-sm font-normal text-ink-500">
                      ({filteredClauses.length} of {clauses.length})
                    </span>
                  )}
                </h3>
                {(selectedClauseType || selectedRiskLevel) && (
                  <button
                    onClick={() => {
                      setSelectedClauseType(null)
                      setSelectedRiskLevel(null)
                    }}
                    className="text-sm text-accent hover:text-accent-light"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredClauses.map((clause, index) => {
                    const risk = riskConfig[clause.risk_level as RiskLevel] || riskConfig.low
                    const isExpanded = expandedClauses.has(clause.id)

                    return (
                      <motion.div
                        key={clause.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.02 }}
                        className={`card overflow-hidden transition-all ${risk.border} border
                                  ${clause.risk_level === 'critical' ? 'risk-critical' : ''}
                                  ${clause.risk_level === 'high' ? 'risk-high' : ''}`}
                      >
                        <button
                          onClick={() => toggleClause(clause.id)}
                          className="w-full px-5 py-4 text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-ink-500 mt-1 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-ink-500 mt-1 flex-shrink-0" />
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-ink-100">
                                    {clauseTypeLabels[clause.clause_type] || clause.clause_type.replace(/_/g, ' ')}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase ${risk.color} ${risk.bg}/10`}>
                                    {clause.risk_level}
                                  </span>
                                  {clause.confidence && (
                                    <span className="text-xs text-ink-500">
                                      {(clause.confidence * 100).toFixed(0)}% confidence
                                    </span>
                                  )}
                                  {clause.page_number != null && (
                                    <span className="text-xs text-ink-600 font-mono">
                                      p.{clause.page_number}
                                    </span>
                                  )}
                                </div>
                                {clause.summary && (
                                  <p className="text-sm text-ink-400 mt-1 line-clamp-1">{clause.summary}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-ink-800/50"
                            >
                              <div className="px-5 py-4 space-y-4">
                                {/* Full Summary */}
                                {clause.summary && (
                                  <div>
                                    <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">
                                      Summary
                                    </h4>
                                    <p className="text-sm text-ink-300">{clause.summary}</p>
                                  </div>
                                )}

                                {/* Risk Factors */}
                                {clause.risk_factors && clause.risk_factors.length > 0 && (
                                  <div>
                                    <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider mb-2">
                                      Risk Factors
                                    </h4>
                                    <ul className="space-y-1">
                                      {clause.risk_factors.map((factor, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-ink-400">
                                          <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${risk.color}`} />
                                          {factor}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Original Content */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-medium text-ink-500 uppercase tracking-wider">
                                      Original Text
                                    </h4>
                                    {clause.page_number != null && (
                                      <span className="text-[11px] text-ink-500 font-mono">
                                        Page {clause.page_number}
                                        {clause.chunk_index != null && ` · Chunk ${clause.chunk_index + 1}`}
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-4 bg-ink-900/50 rounded-lg border border-ink-800/50">
                                    <p className="text-sm text-ink-300 font-mono whitespace-pre-wrap">
                                      {clause.content}
                                    </p>
                                  </div>
                                </div>

                                {/* Plain English Explanation */}
                                {explanations[clause.id] ? (
                                  <div>
                                    <h4 className="text-xs font-medium text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                      <Lightbulb className="w-3 h-3" />
                                      Plain English Explanation
                                    </h4>
                                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                                      <p className="text-sm text-ink-300 whitespace-pre-wrap leading-relaxed">
                                        {explanations[clause.id]}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleExplain(clause.id)}
                                    disabled={explaining === clause.id}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg
                                             bg-accent/10 text-accent hover:bg-accent/20 transition-colors
                                             text-sm font-medium disabled:opacity-50"
                                  >
                                    {explaining === clause.id ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Explaining...
                                      </>
                                    ) : (
                                      <>
                                        <Lightbulb className="w-4 h-4" />
                                        Explain in Plain English
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {filteredClauses.length === 0 && (
                <div className="card p-12 text-center">
                  <FileText className="w-12 h-12 text-ink-700 mx-auto" />
                  <p className="mt-4 text-ink-500">No clauses match the selected filters.</p>
                </div>
              )}
            </div>
          </div>
        )}
        </>
        )}
      </main>
      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-ink-950 border border-ink-800/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800/50">
                <div className="flex items-center gap-3">
                  <FileBarChart className="w-5 h-5 text-accent" />
                  <h2 className="font-display text-lg font-semibold text-ink-100">Executive Summary Report</h2>
                </div>
                <div className="flex items-center gap-2">
                  {report && (
                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-lg
                               hover:bg-accent/20 transition-colors text-sm font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  )}
                  <button onClick={() => setShowReport(false)} className="p-1.5 text-ink-500 hover:text-ink-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {generatingReport && !report ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 text-accent animate-spin" />
                    <p className="text-ink-400 text-sm">Generating executive summary...</p>
                    <p className="text-ink-600 text-xs">This may take a moment as the AI analyzes your contract</p>
                  </div>
                ) : report ? (
                  <>
                    {/* Executive Summary */}
                    <div>
                      <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-3">
                        Executive Summary
                      </h3>
                      <div className="p-4 bg-ink-900/50 rounded-lg border border-ink-800/50">
                        <p className="text-sm text-ink-300 whitespace-pre-wrap leading-relaxed">
                          {report.executive_summary}
                        </p>
                      </div>
                    </div>

                    {/* Risk Overview */}
                    <div>
                      <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-3">
                        Risk Overview
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
                          const config = riskConfig[level]
                          return (
                            <div key={level} className="card p-3 text-center">
                              <span className={`text-xs font-medium uppercase ${config.color}`}>{level}</span>
                              <p className="text-xl font-mono font-bold text-ink-100 mt-1">
                                {report.risk_overview[level]}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Key Clauses */}
                    <div>
                      <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-3">
                        Key Clauses ({report.key_clauses.length})
                      </h3>
                      <div className="space-y-2">
                        {report.key_clauses.slice(0, 8).map((clause, i) => {
                          const risk = riskConfig[clause.risk_level as RiskLevel] || riskConfig.low
                          return (
                            <div key={i} className="flex items-start gap-3 p-3 bg-ink-900/30 rounded-lg">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${risk.color} ${risk.bg}/10 flex-shrink-0 mt-0.5`}>
                                {clause.risk_level}
                              </span>
                              <div>
                                <span className="text-sm font-medium text-ink-200">{clause.clause_type}</span>
                                <p className="text-xs text-ink-400 mt-0.5 line-clamp-2">{clause.summary}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-3">
                        Recommendations
                      </h3>
                      <div className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
                            <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-ink-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entities */}
                    {report.entities_summary.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-3">
                          Entities Identified
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {report.entities_summary.map((entity, i) => (
                            <div key={i} className="p-3 bg-ink-900/30 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-ink-400">{entity.type}</span>
                                <span className="text-xs font-mono text-ink-500">{entity.count}</span>
                              </div>
                              <p className="text-sm text-ink-300">{entity.examples.join(', ')}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatPanel documentId={documentId} />
    </div>
  )
}
