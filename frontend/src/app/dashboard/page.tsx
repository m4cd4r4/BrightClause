'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, PlayCircle, Pencil, Check,
  Upload, Shield, Network, BarChart3,
  FileWarning, Loader2, CheckCircle, Clock, X,
  AlertTriangle,
} from 'lucide-react'
import { api, Document, AnalysisSummary } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { useWalkthrough, WalkthroughOverlay, WalkthroughButton } from '@/lib/walkthrough'
import { type RiskLevel } from '@/lib/risk'
import { V3Shell } from '@/components/v3/shell'
import { KpiCard, RiskPill, PageHeader, Section } from '@/components/v3/primitives'

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function DashboardPage() {
  return <DashboardContent />
}

function DashboardContent() {
  const router = useRouter()
  const { error: showError, success: showSuccess } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<{
    documents_indexed: number
    chunks_with_embeddings: number
    clauses_extracted: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null)
  const [analysisMap, setAnalysisMap] = useState<Map<string, AnalysisSummary>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{
    chunk_id: string
    document_name: string
    content: string
    combined_score: number
  }>>([])
  const [searching, setSearching] = useState(false)
  const [renamingDoc, setRenamingDoc] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const walkthrough = useWalkthrough()

  const loadData = useCallback(async () => {
    try {
      const [docsResponse, statsResponse] = await Promise.all([
        api.documents.list({ limit: 50 }),
        api.search.stats(),
      ])
      setDocuments(docsResponse.documents)
      setStats(statsResponse)

      // Load analyses for all completed documents in parallel
      const completed = docsResponse.documents.filter(d => d.status === 'ready' || d.status === 'analyzed')
      if (completed.length > 0) {
        const results = await Promise.allSettled(
          completed.map(doc => api.analysis.summary(doc.id))
        )
        const map = new Map<string, AnalysisSummary>()
        results.forEach((result, i) => {
          if (result.status === 'fulfilled' && result.value.clauses_extracted > 0) {
            map.set(completed[i].id, result.value)
          }
        })
        setAnalysisMap(map)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      showError('Failed to connect to the server. Please check the API is running.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh when documents are still processing
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'queued')
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(() => {
        loadData()
      }, 5000)
    } else if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [documents, loadData])

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      showError('File is too large. Maximum size is 50MB.')
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showError('Only PDF files are supported.')
      return
    }

    setUploading(true)
    try {
      const doc = await api.documents.upload(file)
      const queuePos = (doc.metadata as Record<string, unknown>)?.queue_position as number | undefined
      const waitSecs = (doc.metadata as Record<string, unknown>)?.estimated_wait_seconds as number | undefined
      const waitStr = waitSecs && waitSecs > 0
        ? waitSecs < 60 ? `~${waitSecs}s` : `~${Math.ceil(waitSecs / 60)} min`
        : '~30s'
      const queueStr = queuePos && queuePos > 1 ? ` · #${queuePos} in queue` : ''
      showSuccess(`"${file.name}" uploaded${queueStr} — results in ${waitStr}`)
      await loadData()
    } catch (err) {
      console.error('Upload failed:', err)
      const msg = err instanceof Error ? err.message : 'Server error'
      if (msg.includes('429') || msg.includes('rate')) {
        showError('Upload limit reached. Please wait a minute before uploading again.')
      } else if (msg.includes('503') || msg.includes('busy')) {
        showError('Server is busy processing documents. Please try again shortly.')
      } else {
        showError(`Upload failed: ${msg}`)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return
    setSearching(true)
    try {
      const response = await api.search.query(searchQuery, { limit: 10 })
      setSearchResults(response.results)
      if (response.results.length === 0) {
        showError('No results found. Try different search terms.')
      }
    } catch (err) {
      console.error('Search failed:', err)
      showError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const loadAnalysis = async (docId: string) => {
    setSelectedDoc(docId)
    if (analysisMap.has(docId)) return
    try {
      const response = await api.analysis.summary(docId)
      if (response.clauses_extracted > 0) {
        setAnalysisMap(prev => new Map(prev).set(docId, response))
      }
    } catch (err) {
      console.error('Failed to load analysis:', err)
    }
  }

  const triggerAnalysis = async (docId: string) => {
    try {
      await api.analysis.extract(docId)
      showSuccess('Analysis started. This may take a few minutes.')
      setTimeout(async () => {
        try {
          const response = await api.analysis.summary(docId)
          if (response.clauses_extracted > 0) {
            setAnalysisMap(prev => new Map(prev).set(docId, response))
          }
          setSelectedDoc(docId)
        } catch { /* ignore */ }
      }, 2000)
    } catch (err) {
      console.error('Failed to trigger analysis:', err)
      showError('Failed to start analysis. Please try again.')
    }
  }

  const selectedAnalysis = selectedDoc ? analysisMap.get(selectedDoc) ?? null : null

  const portfolioRisk = useMemo(() => {
    if (analysisMap.size === 0) return null
    let critical = 0, high = 0, medium = 0, low = 0, totalClauses = 0
    for (const s of Array.from(analysisMap.values())) {
      critical += s.risk_summary.critical || 0
      high += s.risk_summary.high || 0
      medium += s.risk_summary.medium || 0
      low += s.risk_summary.low || 0
      totalClauses += s.clauses_extracted
    }
    const overall: RiskLevel = critical > 0 ? 'critical' : high > 0 ? 'high' : medium > 0 ? 'medium' : 'low'
    const highlights = Array.from(analysisMap.values())
      .flatMap(s => s.high_risk_highlights)
      .filter(h => h.risk_level === 'critical' || h.risk_level === 'high')
      .slice(0, 3)
    return { critical, high, medium, low, totalClauses, overall, highlights, docCount: analysisMap.size }
  }, [analysisMap])

  const startRename = (docId: string, currentName: string) => {
    setRenamingDoc(docId)
    setRenameValue(currentName)
    setTimeout(() => renameInputRef.current?.select(), 50)
  }

  const submitRename = async () => {
    if (!renamingDoc || !renameValue.trim()) {
      setRenamingDoc(null)
      return
    }
    try {
      await api.documents.rename(renamingDoc, renameValue.trim())
      setDocuments(prev => prev.map(d => d.id === renamingDoc ? { ...d, filename: renameValue.trim() } : d))
      showSuccess('Document renamed.')
    } catch {
      showError('Failed to rename document.')
    }
    setRenamingDoc(null)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.pdf'))
    if (files.length === 0) {
      showError('Only PDF files are supported.')
      return
    }
    setUploading(true)
    let uploaded = 0
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        showError(`"${file.name}" is too large (max 50MB). Skipped.`)
        continue
      }
      try {
        await api.documents.upload(file)
        uploaded++
      } catch {
        showError(`Failed to upload "${file.name}".`)
      }
    }
    if (uploaded > 0) {
      const waitStr = uploaded <= 2 ? '~30s' : `~${Math.ceil((uploaded * 30) / 60)} min`
      showSuccess(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded — results in ${waitStr}`)
      await loadData()
    }
    setUploading(false)
  }

  const handleMultiUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    if (files.length === 1) {
      handleUpload(event)
      return
    }
    setUploading(true)
    let uploaded = 0
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        showError(`"${file.name}" is too large (max 50MB). Skipped.`)
        continue
      }
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        showError(`"${file.name}" is not a PDF. Skipped.`)
        continue
      }
      try {
        await api.documents.upload(file)
        uploaded++
      } catch {
        showError(`Failed to upload "${file.name}".`)
      }
    }
    if (uploaded > 0) {
      const waitStr = uploaded <= 2 ? '~30s' : `~${Math.ceil((uploaded * 30) / 60)} min`
      showSuccess(`${uploaded} file${uploaded > 1 ? 's' : ''} uploaded — results in ${waitStr}`)
      await loadData()
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const navigateToDocument = (docId: string) => {
    router.push(`/documents/${docId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} color="var(--v3-risk-low)" />
      case 'processing':
        return <Loader2 size={14} color="var(--v3-risk-medium)" style={{ animation: 'spin 1s linear infinite' }} />
      case 'queued':
        return <Clock size={14} color="#60a5fa" />
      case 'failed':
        return <FileWarning size={14} color="var(--v3-risk-critical)" />
      default:
        return <Clock size={14} color="var(--v3-text-muted)" />
    }
  }

  // KPI spark data derived from stats
  const contractSpark = useMemo(() => {
    const n = stats?.documents_indexed ?? 0
    return [Math.max(0, n - 3), Math.max(0, n - 2), Math.max(0, n - 1), n, n, n, n]
  }, [stats])
  const clauseSpark = useMemo(() => {
    const n = stats?.clauses_extracted ?? 0
    return [0, Math.round(n * 0.3), Math.round(n * 0.55), Math.round(n * 0.7), Math.round(n * 0.85), Math.round(n * 0.95), n]
  }, [stats])
  const readySpark = useMemo(() => {
    const n = documents.filter(d => d.status === 'completed').length
    return [0, 0, Math.max(0, n - 2), Math.max(0, n - 1), n, n, n]
  }, [documents])

  return (
    <V3Shell
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false) }}
      onDrop={handleDrop}
    >
      <h1 className="sr-only">Contract Dashboard</h1>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleMultiUpload}
        style={{ display: 'none' }}
      />

      {/* Page header with upload action */}
      <PageHeader
        crumb="Workspace"
        title="Portfolio"
        subtitle={loading ? 'Loading…' : `${documents.length} contract${documents.length !== 1 ? 's' : ''} · click a row to see risk`}
        actions={
          <>
            <WalkthroughButton onClick={walkthrough.restart} />
            <button
              type="button"
              data-tour="upload"
              aria-label="Upload PDF"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="v3-btn v3-btn-primary"
              style={{ gap: 6 }}
            >
              {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
              Upload PDF
            </button>
          </>
        }
      />

      {/* Drag & Drop Overlay */}
      {dragOver && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            padding: '48px 64px', border: '2px dashed var(--v3-accent)',
            borderRadius: 'var(--v3-radius-lg)', background: 'rgba(212,168,45,0.05)',
            textAlign: 'center',
          }}>
            <Upload size={40} color="var(--v3-accent)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-primary)' }}>Drop PDF files here</p>
            <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', marginTop: 8 }}>Supports multiple files up to 50MB each</p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div
        data-tour="stats"
        className="v3-grid-resp"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 32 }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="v3-card" style={{ height: 104, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 11, width: 80, borderRadius: 4, background: 'var(--v3-border)' }} />
              <div style={{ height: 32, width: 60, borderRadius: 4, background: 'var(--v3-border)', marginTop: 8 }} />
            </div>
          ))
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push('/search')}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block' }}
            >
              <KpiCard
                label="Contracts"
                value={stats?.documents_indexed ?? 0}
                spark={contractSpark}
                intent="default"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                const docWithClauses = documents.find(d => d.status === 'completed')
                if (docWithClauses) router.push(`/documents/${docWithClauses.id}`)
                else router.push('/search')
              }}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block' }}
            >
              <KpiCard
                label="Clauses found"
                value={stats?.clauses_extracted ?? 0}
                spark={clauseSpark}
                intent="default"
              />
            </button>
            <button
              type="button"
              onClick={() => {
                const completed = documents.find(d => d.status === 'completed')
                if (completed) loadAnalysis(completed.id)
              }}
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block' }}
            >
              <KpiCard
                label="Ready to review"
                value={documents.filter(d => d.status === 'completed').length}
                spark={readySpark}
                intent="low"
              />
            </button>
          </>
        )}
      </div>

      {/* Inline search bar */}
      <div
        data-tour="search"
        style={{ display: 'flex', gap: 8, marginBottom: 24 }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
          <label htmlFor="search-input" className="sr-only">Search contracts</label>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search clauses, entities…"
            style={{
              width: '100%', height: 32, paddingLeft: 12, paddingRight: searching ? 36 : 12,
              background: 'var(--v3-card)', border: '1px solid var(--v3-border)',
              borderRadius: 'var(--v3-radius-md)', color: 'var(--v3-text-primary)',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {searching && (
            <Loader2
              size={14}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--v3-accent)', animation: 'spin 1s linear infinite' }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="v3-btn"
        >
          Search
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Section
          title="Search Results"
          hint={`${searchResults.length} matches`}
          actions={
            <button
              type="button"
              onClick={() => setSearchResults([])}
              className="v3-btn v3-btn-ghost"
              aria-label="Clear search results"
              style={{ padding: '0 8px' }}
            >
              <X size={14} />
            </button>
          }
        >
          <div aria-live="polite">
            {searchResults.map((result, i) => (
              <div
                key={result.chunk_id}
                style={{
                  padding: '12px 16px',
                  borderBottom: i < searchResults.length - 1 ? '1px solid var(--v3-border)' : 0,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--v3-accent)' }}>{result.document_name}</span>
                  <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                    {(result.combined_score * 100).toFixed(0)}% relevance
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Main grid: document list + risk panel */}
      <div className="v3-split-resp" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Document list */}
        <div data-tour="documents">
          <Section
            title="Contracts"
            hint={documents.length > 0 ? `${documents.length} total` : undefined}
            actions={
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="v3-btn"
                style={{ fontSize: 12, height: 28, padding: '0 10px' }}
              >
                <Upload size={12} />
                Upload
              </button>
            }
          >
            <div
              style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto', overflowX: 'auto' }}
            >
              {loading ? (
                <div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ padding: '0 16px', height: 40, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--v3-border)' }}>
                      <div style={{ width: 14, height: 14, borderRadius: 999, background: 'var(--v3-border)', flexShrink: 0 }} />
                      <div style={{ flex: 1, height: 11, borderRadius: 4, background: 'var(--v3-border)', maxWidth: `${55 + i * 7}%` }} />
                      <div style={{ width: 40, height: 11, borderRadius: 4, background: 'var(--v3-border)' }} />
                    </div>
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div style={{ padding: '56px 32px', textAlign: 'center' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 16, border: '2px dashed var(--v3-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', position: 'relative',
                  }}>
                    <Upload size={28} color="var(--v3-text-muted)" />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--v3-text-primary)', marginBottom: 8 }}>Add your first contract</p>
                  <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                    Drop any PDF here or use the Upload button. We read every clause, flag risky provisions, and surface what needs your attention — in minutes.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="v3-btn v3-btn-primary"
                  >
                    <Upload size={14} />
                    Choose PDF
                  </button>
                </div>
              ) : (
                <table className="v3-table v3-table-min" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: 28 }} />
                    <col />
                    <col style={{ width: 72 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 80 }} />
                    <col style={{ width: 72 }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 16 }}></th>
                      <th>Filename</th>
                      <th style={{ textAlign: 'right' }}>Pages</th>
                      <th style={{ textAlign: 'right' }}>Sections</th>
                      <th>Risk</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        role="button"
                        tabIndex={0}
                        onMouseEnter={() => setHoveredDoc(doc.id)}
                        onMouseLeave={() => setHoveredDoc(null)}
                        onClick={() => loadAnalysis(doc.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            loadAnalysis(doc.id)
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          background: selectedDoc === doc.id ? 'rgba(212,168,45,0.06)' : undefined,
                          outline: selectedDoc === doc.id ? '1px solid rgba(212,168,45,0.25)' : undefined,
                          outlineOffset: -1,
                        }}
                      >
                        <td style={{ paddingLeft: 16, paddingRight: 4 }}>
                          {getStatusIcon(doc.status)}
                        </td>
                        <td style={{ maxWidth: 0 }}>
                          {renamingDoc === doc.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                              <input
                                ref={renameInputRef}
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') submitRename()
                                  if (e.key === 'Escape') setRenamingDoc(null)
                                }}
                                onBlur={submitRename}
                                style={{
                                  flex: 1, height: 26, padding: '0 8px',
                                  background: 'var(--v3-panel)', border: '1px solid var(--v3-accent)',
                                  borderRadius: 'var(--v3-radius-sm)', color: 'var(--v3-text-primary)',
                                  fontSize: 13, outline: 'none',
                                }}
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); submitRename() }}
                                style={{ padding: 4, color: 'var(--v3-accent)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}
                                aria-label="Save name"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                              <span className="v3-mono" style={{ fontSize: 12, color: 'var(--v3-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {doc.filename}
                              </span>
                              {analysisMap.has(doc.id) && (() => {
                                const a = analysisMap.get(doc.id)!
                                const risk = a.overall_risk as RiskLevel
                                return <RiskPill level={risk} />
                              })()}
                              {(hoveredDoc === doc.id || selectedDoc === doc.id) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startRename(doc.id, doc.filename)
                                  }}
                                  style={{ padding: 4, color: 'var(--v3-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4, flexShrink: 0 }}
                                  aria-label="Rename document"
                                  title="Rename"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="v3-mono" style={{ fontSize: 12, color: 'var(--v3-text-muted)' }}>
                            {doc.status === 'completed' ? (doc.page_count ?? '—') : (
                              doc.status === 'queued' ? <span style={{ color: '#60a5fa' }}>queued</span>
                              : doc.status === 'processing' ? <span style={{ color: 'var(--v3-risk-medium)' }}>…</span>
                              : doc.status === 'failed' ? <span style={{ color: 'var(--v3-risk-critical)' }}>fail</span>
                              : '—'
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="v3-mono" style={{ fontSize: 12, color: 'var(--v3-text-muted)' }}>
                            {doc.chunk_count > 0 ? doc.chunk_count : '—'}
                          </span>
                        </td>
                        <td>
                          {doc.status === 'completed' && (
                            <span style={{ fontSize: 12, color: 'var(--v3-risk-low)' }}>Ready</span>
                          )}
                        </td>
                        <td style={{ paddingRight: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: hoveredDoc === doc.id || selectedDoc === doc.id ? 1 : 0.3, transition: 'opacity 150ms' }}>
                            <a
                              href={`/documents/${doc.id}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                navigateToDocument(doc.id)
                              }}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: 'var(--v3-radius-sm)',
                                background: 'rgba(212,168,45,0.12)', color: 'var(--v3-accent)',
                                border: 'none', cursor: 'pointer', textDecoration: 'none',
                              }}
                              aria-label="View document details"
                              title="View Details"
                            >
                              <Eye size={13} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </div>

        {/* Risk Analysis Panel */}
        <div data-tour="analysis" aria-live="polite">
          {(selectedDoc && selectedAnalysis) || (!selectedDoc && portfolioRisk) ? (
            <div className="v3-card" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Risk Assessment</h2>
                <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 4 }}>
                  {selectedAnalysis ? 'Document analysis' : `Portfolio · ${portfolioRisk?.docCount} contracts`}
                </p>
              </div>

              {(() => {
                const risk = selectedAnalysis ?? portfolioRisk!
                const validRiskLevels: RiskLevel[] = ['critical', 'high', 'medium', 'low']
                const rawRisk = selectedAnalysis ? selectedAnalysis.overall_risk : portfolioRisk!.overall
                const overallRisk: RiskLevel = validRiskLevels.includes(rawRisk as RiskLevel) ? rawRisk as RiskLevel : 'low'
                const clauses = selectedAnalysis ? selectedAnalysis.clauses_extracted : portfolioRisk!.totalClauses
                const riskCounts = selectedAnalysis
                  ? { critical: selectedAnalysis.risk_summary.critical || 0, high: selectedAnalysis.risk_summary.high || 0, medium: selectedAnalysis.risk_summary.medium || 0, low: selectedAnalysis.risk_summary.low || 0 }
                  : { critical: portfolioRisk!.critical, high: portfolioRisk!.high, medium: portfolioRisk!.medium, low: portfolioRisk!.low }
                const highlights = selectedAnalysis ? selectedAnalysis.high_risk_highlights : portfolioRisk!.highlights
                return (
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Overall Risk */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <RiskPill level={overallRisk} size="md" />
                      <div>
                        <div className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{clauses} clauses analyzed</div>
                      </div>
                    </div>

                    {/* Risk Distribution */}
                    <div>
                      <div className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk breakdown</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                        {([
                          { level: 'critical' as RiskLevel, color: 'var(--v3-risk-critical)' },
                          { level: 'high' as RiskLevel, color: 'var(--v3-risk-high)' },
                          { level: 'medium' as RiskLevel, color: 'var(--v3-risk-medium)' },
                          { level: 'low' as RiskLevel, color: 'var(--v3-risk-low)' },
                        ]).map(({ level, color }) => (
                          <div key={level} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1 }}>{riskCounts[level]}</div>
                            <div className="v3-mono" style={{ fontSize: 10, color: 'var(--v3-text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{level}</div>
                          </div>
                        ))}
                      </div>
                      {clauses > 0 && (
                        <div style={{ display: 'flex', height: 4, borderRadius: 999, overflow: 'hidden' }}>
                          {([
                            { count: riskCounts.critical, color: 'var(--v3-risk-critical)' },
                            { count: riskCounts.high, color: 'var(--v3-risk-high)' },
                            { count: riskCounts.medium, color: 'var(--v3-risk-medium)' },
                            { count: riskCounts.low, color: 'var(--v3-risk-low)' },
                          ] as { count: number; color: string }[]).filter(s => s.count > 0).map((s, i) => (
                            <div
                              key={s.color}
                              style={{ flex: s.count, background: s.color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* High Risk Highlights */}
                    {highlights.length > 0 && (
                      <div>
                        <div className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Attention required</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {highlights.slice(0, 3).map((highlight, i) => (
                            <div
                              key={i}
                              style={{
                                padding: 12, borderRadius: 'var(--v3-radius-sm)',
                                border: `1px solid ${highlight.risk_level === 'critical' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
                                background: highlight.risk_level === 'critical' ? 'rgba(239,68,68,0.06)' : 'rgba(249,115,22,0.06)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <AlertTriangle size={13} color={highlight.risk_level === 'critical' ? 'var(--v3-risk-critical)' : 'var(--v3-risk-high)'} />
                                <span className="v3-mono" style={{ fontSize: 10, fontWeight: 500, color: 'var(--v3-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                  {(highlight.clause_type ?? '').replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: 'var(--v3-text-muted)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {highlight.summary}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--v3-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedDoc && (
                        <>
                          <button
                            type="button"
                            onClick={() => navigateToDocument(selectedDoc)}
                            className="v3-btn v3-btn-primary"
                            style={{ width: '100%', justifyContent: 'center', height: 36 }}
                          >
                            <Eye size={14} />
                            View Full Analysis
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/documents/${selectedDoc}/graph`)}
                            className="v3-btn"
                            style={{ width: '100%', justifyContent: 'center', height: 36 }}
                          >
                            <Network size={14} />
                            Knowledge Graph
                          </button>
                        </>
                      )}
                      {!selectedDoc && (
                        <button
                          type="button"
                          onClick={() => router.push('/analytics')}
                          className="v3-btn v3-btn-primary"
                          style={{ width: '100%', justifyContent: 'center', height: 36 }}
                        >
                          <BarChart3 size={14} />
                          Portfolio Analytics
                        </button>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          ) : selectedDoc ? (
            <div className="v3-card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Risk Assessment</h2>
                <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 4 }}>Not yet analyzed</p>
              </div>
              <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
                <div style={{ padding: 16, borderRadius: 999, background: 'var(--v3-panel)', border: '1px solid var(--v3-border)' }}>
                  <Shield size={32} color="var(--v3-text-muted)" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--v3-text-primary)', marginBottom: 6 }}>Analyze this contract</p>
                  <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    We'll read every clause, identify the risky ones, and flag anything that needs your attention.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerAnalysis(selectedDoc)}
                  className="v3-btn v3-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', height: 36 }}
                >
                  <PlayCircle size={14} />
                  Run Analysis
                </button>
              </div>
            </div>
          ) : (
            <div className="v3-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, minHeight: 200 }}>
              <Shield size={28} color="var(--v3-text-disabled)" />
              <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', margin: 0 }}>Select a contract to see its risk breakdown</p>
            </div>
          )}
        </div>
      </div>

      <WalkthroughOverlay
        active={walkthrough.active}
        step={walkthrough.step}
        currentStep={walkthrough.currentStep}
        totalSteps={walkthrough.totalSteps}
        next={walkthrough.next}
        prev={walkthrough.prev}
        dismiss={walkthrough.dismiss}
      />
    </V3Shell>
  )
}
