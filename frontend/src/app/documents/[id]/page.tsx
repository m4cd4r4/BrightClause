'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  FileText, AlertTriangle,
  Loader2, ChevronDown, ChevronRight, Network,
  Download, Zap, FileSpreadsheet, FileType, FileJson, Lightbulb,
  FileBarChart, X, CheckCircle, ClipboardCheck, BookOpen, Key
} from 'lucide-react'
import { api, Document, Clause, AnalysisSummary, Entity, ReportData } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { exportToExcel, exportToWord, exportToPDF, exportToCSV, exportToJSON, exportReport } from '@/lib/export-lazy'
import { type RiskLevel } from '@/lib/risk'
import { V3Shell } from '@/components/v3/shell'
import { PageHeader, Section, RiskPill } from '@/components/v3/primitives'
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

const v3RiskColor = (level: string | null | undefined): string =>
  level === 'critical' ? 'var(--v3-risk-critical)'
  : level === 'high' ? 'var(--v3-risk-high)'
  : level === 'medium' ? 'var(--v3-risk-medium)'
  : level === 'low' ? 'var(--v3-risk-low)'
  : 'var(--v3-text-secondary)'

// Mirrors v1's `riskConfig[level] || riskConfig.low` fallback for clause/report pills
const toRiskLevel = (level: string | null | undefined): RiskLevel =>
  level === 'critical' || level === 'high' || level === 'medium' || level === 'low' ? level : 'low'

function ByokForm({ onSubmit, initialKey, onCancel }: {
  onSubmit: (key: string) => void
  initialKey: string
  onCancel: () => void
}) {
  const [key, setKey] = useState(initialKey)
  const isValidKey = key.trim().startsWith('sk-ant-') && key.trim().length >= 20
  const showValidationHint = key.trim().length > 0 && !isValidKey
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (isValidKey) onSubmit(key) }}>
      <input
        type="password"
        autoFocus
        placeholder="sk-ant-api03-..."
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="v3-mono"
        style={{
          width: '100%', height: 38, padding: '0 12px',
          background: 'var(--v3-card)', color: 'var(--v3-text-primary)',
          border: `1px solid ${showValidationHint ? 'rgba(239,68,68,0.5)' : 'var(--v3-border)'}`,
          borderRadius: 'var(--v3-radius-md)', fontSize: 13, outline: 'none', marginBottom: 4,
        }}
      />
      {showValidationHint && (
        <p style={{ fontSize: 11, color: 'var(--v3-risk-critical)', marginBottom: 12 }}>Key must start with &quot;sk-ant-&quot;</p>
      )}
      {!showValidationHint && <div style={{ marginBottom: 12 }} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={!isValidKey} className="v3-btn v3-btn-primary" style={{ flex: 1, justifyContent: 'center', height: 38, opacity: !isValidKey ? 0.4 : 1 }}>
          <Zap size={14} /> Extract Clauses
        </button>
        <button type="button" onClick={onCancel} className="v3-btn" style={{ height: 38 }}>
          Cancel
        </button>
      </div>
      <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 12, textAlign: 'center' }}>
        Get your key at <span style={{ color: 'var(--v3-text-secondary)' }}>console.anthropic.com</span>
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
  const [byokApiKey, setByokApiKey] = useState('')
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const { error: showError, success: showSuccess } = useToast()

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
    }
  }, [])

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return
    const handleClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    window.document.addEventListener('mousedown', handleClick)
    return () => window.document.removeEventListener('mousedown', handleClick)
  }, [showExportMenu])

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
      // Poll for completion with timeout and error feedback
      pollIntervalRef.current = setInterval(async () => {
        const analysisRes = await api.analysis.summary(documentId).catch(() => null)
        if (analysisRes && analysisRes.status === 'completed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
          setAnalysis(analysisRes)
          const clausesRes = await api.analysis.clauses(documentId)
          setClauses(clausesRes)
          setExtracting(false)
          showSuccess('Clause extraction complete')
        } else if (analysisRes && analysisRes.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
          if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current)
          setExtracting(false)
          showError('Extraction failed. Please try again.')
        }
      }, 3000)
      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        setExtracting(false)
        showError('Extraction timed out after 5 minutes. The server may be overloaded — try again later.')
      }, 300000)
    } catch (error) {
      console.error('Extraction failed:', error)
      setExtracting(false)
    }
  }

  const handleByokSubmit = (key: string) => {
    if (key.trim()) {
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
      <V3Shell>
        <div className="v3-grid-resp" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="v3-card" style={{ height: 112, gridColumn: 'span 2' }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="v3-card" style={{ height: 112 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
          <div className="v3-card" style={{ height: 320 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="v3-card" style={{ height: 80 }} />
            ))}
          </div>
        </div>
      </V3Shell>
    )
  }

  if (!document) {
    return (
      <V3Shell>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <FileText size={56} color="var(--v3-text-disabled)" style={{ margin: '0 auto' }} />
            <h2 style={{ marginTop: 16, fontSize: 20, fontWeight: 600, color: 'var(--v3-text-primary)' }}>Document Not Found</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--v3-text-muted)' }}>The requested document could not be found.</p>
            <Link href="/dashboard" className="v3-btn v3-btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </V3Shell>
    )
  }

  const overallRiskLevel: RiskLevel | 'neutral' = (['critical', 'high', 'medium', 'low'] as const).includes(
    analysis?.overall_risk as RiskLevel
  ) ? (analysis!.overall_risk as RiskLevel) : 'neutral'

  return (
    <V3Shell>
      {/* BYOK Modal */}
      <AnimatePresence>
        {showByokModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: 16 }}
            onMouseDown={(e) => e.target === e.currentTarget && setShowByokModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: 'var(--v3-popover)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-lg)', boxShadow: 'var(--v3-shadow-md)', padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--v3-radius-md)', background: 'rgba(212,168,45,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={20} color="var(--v3-accent)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>AI Extraction Key</h3>
                    <p style={{ fontSize: 12, color: 'var(--v3-text-muted)', margin: 0 }}>Powered by Anthropic Claude</p>
                  </div>
                </div>
                <button onClick={() => setShowByokModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--v3-text-muted)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
                Enter your <span style={{ color: 'var(--v3-accent)', fontWeight: 500 }}>Anthropic API key</span> to run AI clause extraction on this document. Your key is stored in session only and never saved to our servers.
              </p>
              <ByokForm onSubmit={handleByokSubmit} initialKey={byokApiKey} onCancel={() => setShowByokModal(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        crumb="Workspace · Document"
        title={document.filename}
        subtitle={[
          document.page_count ? `${document.page_count}p` : null,
          analysis ? `${analysis.clauses_extracted} clauses` : null,
        ].filter(Boolean).join(' · ') || undefined}
        actions={
          <div ref={exportMenuRef} style={{ display: 'flex', gap: 8, position: 'relative', flexWrap: 'wrap' }}>
            <Link href={`/documents/${documentId}/graph`} className="v3-btn">
              <Network size={14} />
              <span>Graph</span>
            </Link>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'pdf' ? 'analysis' : 'pdf')}
              className={`v3-btn${viewMode === 'pdf' ? ' v3-btn-primary' : ''}`}
            >
              <BookOpen size={14} />
              <span>PDF</span>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={generatingReport || !analysis}
              className="v3-btn"
              style={{ opacity: generatingReport || !analysis ? 0.5 : 1 }}
            >
              {generatingReport ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileBarChart size={14} />}
              <span>{generatingReport ? 'Generating...' : 'Report'}</span>
            </button>

            <button
              onClick={handleExtractObligations}
              disabled={extractingObligations || !analysis}
              className="v3-btn"
              style={{ opacity: extractingObligations || !analysis ? 0.5 : 1 }}
            >
              {extractingObligations ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ClipboardCheck size={14} />}
              <span>{extractingObligations ? 'Extracting...' : 'Obligations'}</span>
            </button>

            {/* Export Dropdown */}
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting !== null}
              className="v3-btn"
              style={{ opacity: exporting !== null ? 0.5 : 1 }}
            >
              {exporting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
              <span>{exporting ? 'Exporting...' : 'Export'}</span>
              <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 200, background: 'var(--v3-popover)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-md)', boxShadow: 'var(--v3-shadow-md)', overflow: 'hidden', zIndex: 50 }}
                >
                  {([
                    { fmt: 'pdf', icon: <FileText size={14} color="var(--v3-risk-critical)" />, label: 'PDF Report', border: false },
                    { fmt: 'excel', icon: <FileSpreadsheet size={14} color="var(--v3-risk-low)" />, label: 'Excel (.xlsx)', border: false },
                    { fmt: 'word', icon: <FileType size={14} color="#60a5fa" />, label: 'Word (.docx)', border: true },
                    { fmt: 'csv', icon: <FileSpreadsheet size={14} color="var(--v3-text-muted)" />, label: 'CSV (Clauses)', border: false },
                    { fmt: 'json', icon: <FileJson size={14} color="var(--v3-risk-medium)" />, label: 'JSON (Full Data)', border: false },
                  ] as const).map(({ fmt, icon, label, border }) => (
                    <button
                      key={fmt}
                      onClick={() => handleExport(fmt)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', textAlign: 'left', background: 'transparent',
                        border: 'none', borderTop: border ? '1px solid var(--v3-border)' : 'none',
                        color: 'var(--v3-text-primary)', cursor: 'pointer', fontSize: 13,
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />

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
              className="v3-grid-resp"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}
            >
              {/* Overall Risk */}
              <div className="v3-card" style={{ gridColumn: 'span 2', padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)', margin: 0 }}>Overall Risk Assessment</p>
                  <div style={{ marginTop: 12 }}>
                    <RiskPill level={overallRiskLevel} size="md">{analysis.overall_risk}</RiskPill>
                  </div>
                </div>
                <div style={{ width: 12, height: 12, borderRadius: 999, background: v3RiskColor(analysis.overall_risk) }} />
              </div>

              {/* Risk Distribution */}
              {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => (
                <button
                  key={level}
                  className="v3-card v3-card-hover"
                  style={{
                    padding: 16, height: 104, textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    border: selectedRiskLevel === level ? `1px solid ${v3RiskColor(level)}` : '1px solid var(--v3-border)',
                    outline: selectedRiskLevel === level ? `2px solid var(--v3-accent)` : 'none', outlineOffset: -2,
                  }}
                  onClick={() => setSelectedRiskLevel(selectedRiskLevel === level ? null : level)}
                  aria-pressed={selectedRiskLevel === level}
                  aria-label={`Filter by ${level} risk: ${analysis.risk_summary[level] || 0} clauses`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="v3-mono" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: v3RiskColor(level) }}>
                      {level}
                    </span>
                    {(level === 'critical' || level === 'high') && analysis.risk_summary[level] > 0 && (
                      <AlertTriangle size={14} color={v3RiskColor(level)} />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 28, fontWeight: 600, color: 'var(--v3-text-primary)', lineHeight: 1, margin: 0 }}>
                      {analysis.risk_summary[level] || 0}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 4 }}>clauses</p>
                  </div>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="v3-card"
              style={{ padding: 40, marginBottom: 24, textAlign: 'center' }}
            >
              <Zap size={48} color="rgba(212,168,45,0.5)" style={{ margin: '0 auto' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 16, color: 'var(--v3-text-primary)' }}>
                {analysis ? 'No Clauses Found' : 'Analysis Not Yet Run'}
              </h3>
              <p style={{ color: 'var(--v3-text-muted)', marginTop: 8, fontSize: 14 }}>
                {analysis
                  ? 'The AI extraction found no clauses in this document. Try re-running the extraction.'
                  : 'Extract clauses and assess risk levels for this document.'}
              </p>
              <button
                onClick={() => triggerExtraction()}
                disabled={extracting}
                className="v3-btn v3-btn-primary"
                style={{ marginTop: 24, display: 'inline-flex' }}
              >
                {extracting ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    {analysis ? 'Re-run Clause Extraction' : 'Run Clause Extraction'}
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Clauses Section */}
          {clauses.length > 0 && (
            <>
              {/* Timeline — horizontal strip under the action bar */}
              <Section title="Contract Timeline" hint="dates and milestones">
                <div style={{ padding: 16 }}>
                  <Timeline documentId={documentId} />
                </div>
              </Section>

              <div className="v3-split-resp" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
                {/* Clause Type Sidebar */}
                <div>
                  <div className="v3-card" style={{ position: 'sticky', top: 24, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Clause Types</h3>
                    </div>
                    <div style={{ padding: 8 }}>
                      <button
                        onClick={() => setSelectedClauseType(null)}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 'var(--v3-radius-sm)',
                          textAlign: 'left', fontSize: 13, cursor: 'pointer', border: 'none',
                          background: !selectedClauseType ? 'rgba(212,168,45,0.12)' : 'transparent',
                          color: !selectedClauseType ? 'var(--v3-accent)' : 'var(--v3-text-secondary)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>All Clauses</span>
                          <span className="v3-mono" style={{ fontSize: 11 }}>{clauses.length}</span>
                        </span>
                      </button>
                      {Object.entries(clauseTypeCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <button
                            key={type}
                            onClick={() => setSelectedClauseType(selectedClauseType === type ? null : type)}
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 'var(--v3-radius-sm)',
                              textAlign: 'left', fontSize: 13, cursor: 'pointer', border: 'none',
                              background: selectedClauseType === type ? 'rgba(212,168,45,0.12)' : 'transparent',
                              color: selectedClauseType === type ? 'var(--v3-accent)' : 'var(--v3-text-secondary)',
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{clauseTypeLabels[type] || type.replace(/_/g, ' ')}</span>
                              <span className="v3-mono" style={{ fontSize: 11 }}>{count}</span>
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Clauses List */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>
                      Extracted Clauses
                      {(selectedClauseType || selectedRiskLevel) && (
                        <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 400, color: 'var(--v3-text-muted)' }}>
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
                        style={{ fontSize: 13, color: 'var(--v3-accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <AnimatePresence mode="popLayout">
                      {filteredClauses.map((clause, index) => {
                        const isExpanded = expandedClauses.has(clause.id)
                        const riskColor = v3RiskColor(toRiskLevel(clause.risk_level))

                        return (
                          <motion.div
                            key={clause.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.02 }}
                            className="v3-card"
                            style={{ overflow: 'hidden', borderLeft: `3px solid ${riskColor}` }}
                          >
                            <button
                              onClick={() => toggleClause(clause.id)}
                              style={{ width: '100%', padding: '16px 20px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                  {isExpanded ? (
                                    <ChevronDown size={16} color="var(--v3-text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                                  ) : (
                                    <ChevronRight size={16} color="var(--v3-text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                                  )}
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 500, color: 'var(--v3-text-primary)' }}>
                                        {clauseTypeLabels[clause.clause_type] || (clause.clause_type ?? '').replace(/_/g, ' ')}
                                      </span>
                                      <RiskPill level={toRiskLevel(clause.risk_level)}>{clause.risk_level}</RiskPill>
                                      {clause.page_number != null && (
                                        <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                                          p.{clause.page_number}
                                        </span>
                                      )}
                                    </div>
                                    {clause.summary && (
                                      <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clause.summary}</p>
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
                                  style={{ borderTop: '1px solid var(--v3-border)', overflow: 'hidden' }}
                                >
                                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {/* Full Summary */}
                                    {clause.summary && (
                                      <div>
                                        <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                          Summary
                                        </h4>
                                        <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)' }}>{clause.summary}</p>
                                      </div>
                                    )}

                                    {/* Risk Factors */}
                                    {clause.risk_factors && clause.risk_factors.length > 0 && (
                                      <div>
                                        <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                                          Risk Factors
                                        </h4>
                                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: 0, padding: 0, listStyle: 'none' }}>
                                          {clause.risk_factors.map((factor, i) => (
                                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--v3-text-muted)' }}>
                                              <AlertTriangle size={12} color={riskColor} style={{ marginTop: 3, flexShrink: 0 }} />
                                              {factor}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Original Content */}
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                          Original Text
                                        </h4>
                                        {clause.page_number != null && (
                                          <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                                            Page {clause.page_number}
                                            {clause.chunk_index != null && ` · Chunk ${clause.chunk_index + 1}`}
                                          </span>
                                        )}
                                      </div>
                                      <div style={{ padding: 16, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-md)', border: '1px solid var(--v3-border)' }}>
                                        <p className="v3-mono" style={{ fontSize: 13, color: 'var(--v3-text-secondary)', whiteSpace: 'pre-wrap', margin: 0 }}>
                                          {clause.content}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Plain English Explanation */}
                                    {explanations[clause.id] ? (
                                      <div>
                                        <h4 className="v3-mono" style={{ fontSize: 11, fontWeight: 500, color: 'var(--v3-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                          <Lightbulb size={12} />
                                          Plain English Explanation
                                        </h4>
                                        <div style={{ padding: 16, background: 'rgba(212,168,45,0.05)', borderRadius: 'var(--v3-radius-md)', border: '1px solid rgba(212,168,45,0.2)' }}>
                                          <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                                            {explanations[clause.id]}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => handleExplain(clause.id)}
                                        disabled={explaining === clause.id}
                                        className="v3-btn"
                                        style={{ alignSelf: 'flex-start', color: 'var(--v3-accent)', background: 'rgba(212,168,45,0.1)', borderColor: 'rgba(212,168,45,0.2)', opacity: explaining === clause.id ? 0.5 : 1 }}
                                      >
                                        {explaining === clause.id ? (
                                          <>
                                            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                            Explaining...
                                          </>
                                        ) : (
                                          <>
                                            <Lightbulb size={14} />
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
                    <div className="v3-card" style={{ padding: 48, textAlign: 'center' }}>
                      <FileText size={48} color="var(--v3-text-disabled)" style={{ margin: '0 auto' }} />
                      <p style={{ marginTop: 16, color: 'var(--v3-text-muted)' }}>No clauses match the selected filters.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Report Modal */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 16 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setShowReport(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'var(--v3-popover)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-lg)', boxShadow: 'var(--v3-shadow-md)', width: '100%', maxWidth: 768, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--v3-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileBarChart size={20} color="var(--v3-accent)" />
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Executive Summary Report</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {report && (
                    <button
                      onClick={handleDownloadReport}
                      className="v3-btn"
                      style={{ color: 'var(--v3-accent)', background: 'rgba(212,168,45,0.1)', borderColor: 'rgba(212,168,45,0.2)', height: 30 }}
                    >
                      <Download size={14} />
                      Download PDF
                    </button>
                  )}
                  <button onClick={() => setShowReport(false)} style={{ padding: 6, background: 'transparent', border: 'none', color: 'var(--v3-text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {generatingReport && !report ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 16 }}>
                    <Loader2 size={32} color="var(--v3-accent)" style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--v3-text-secondary)', fontSize: 13 }}>Generating executive summary...</p>
                    <p style={{ color: 'var(--v3-text-muted)', fontSize: 12 }}>This may take a moment as the AI analyzes your contract</p>
                  </div>
                ) : report ? (
                  <>
                    {/* Executive Summary */}
                    <div>
                      <h3 className="v3-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--v3-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Executive Summary
                      </h3>
                      <div style={{ padding: 16, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-md)', border: '1px solid var(--v3-border)' }}>
                        <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>
                          {report.executive_summary}
                        </p>
                      </div>
                    </div>

                    {/* Risk Overview */}
                    <div>
                      <h3 className="v3-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--v3-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Risk Overview
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {(['critical', 'high', 'medium', 'low'] as const).map((level) => (
                          <div key={level} className="v3-card" style={{ padding: 12, textAlign: 'center' }}>
                            <span className="v3-mono" style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: v3RiskColor(level) }}>{level}</span>
                            <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--v3-text-primary)', marginTop: 4 }}>
                              {report.risk_overview[level]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Clauses */}
                    <div>
                      <h3 className="v3-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--v3-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Key Clauses ({report.key_clauses.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {report.key_clauses.slice(0, 8).map((clause, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-md)' }}>
                            <div style={{ flexShrink: 0, marginTop: 2 }}>
                              <RiskPill level={toRiskLevel(clause.risk_level)}>{clause.risk_level}</RiskPill>
                            </div>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--v3-text-primary)' }}>{clauseTypeLabels[clause.clause_type] || (clause.clause_type ?? '').replace(/_/g, ' ')}</span>
                              <p style={{ fontSize: 12, color: 'var(--v3-text-muted)', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{clause.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="v3-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--v3-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Recommendations
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {report.recommendations.map((rec, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, background: 'rgba(212,168,45,0.05)', borderRadius: 'var(--v3-radius-md)', border: '1px solid rgba(212,168,45,0.1)' }}>
                            <CheckCircle size={16} color="var(--v3-accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', margin: 0 }}>{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Entities */}
                    {report.entities_summary.length > 0 && (
                      <div>
                        <h3 className="v3-mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--v3-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                          Entities Identified
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                          {report.entities_summary.map((entity, i) => (
                            <div key={i} style={{ padding: 12, background: 'var(--v3-panel)', borderRadius: 'var(--v3-radius-md)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--v3-text-muted)' }}>{entity.type}</span>
                                <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{entity.count}</span>
                              </div>
                              <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', margin: 0 }}>{entity.examples.join(', ')}</p>
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
    </V3Shell>
  )
}
