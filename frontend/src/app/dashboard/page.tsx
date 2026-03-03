'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileText, Search, Upload, AlertTriangle, CheckCircle,
  Clock, Database, Zap, ChevronRight, X, Loader2,
  FileWarning, Shield, Network, TrendingUp, BarChart3,
  Eye, PlayCircle, Pencil, Check, Activity,
  MessageCircle, FileBarChart, Trash2, RotateCcw
} from 'lucide-react'
import { api, Document, AnalysisSummary } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { useWalkthrough, WalkthroughOverlay, WalkthroughButton } from '@/lib/walkthrough'
import { Navigation } from '@/lib/navigation'
import { type RiskLevel } from '@/lib/risk'

const riskColors: Record<RiskLevel, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const riskGlow: Record<RiskLevel, string> = {
  critical: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  high: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
  medium: 'shadow-[0_0_10px_rgba(245,158,11,0.15)]',
  low: 'shadow-none',
}

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
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null)
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
  const [activities, setActivities] = useState<Array<{
    id: string
    document_id: string | null
    action: string
    details: Record<string, unknown>
    created_at: string
    filename: string | null
  }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const walkthrough = useWalkthrough()

  const loadData = useCallback(async () => {
    try {
      const [docsResponse, statsResponse, activityResponse] = await Promise.all([
        api.documents.list({ limit: 50 }),
        api.search.stats(),
        api.activity.list(15).catch(() => ({ activities: [], total: 0 })),
      ])
      setDocuments(docsResponse.documents)
      setStats(statsResponse)
      setActivities(activityResponse.activities)
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
    if (!searchQuery.trim()) return
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
    try {
      const response = await api.analysis.summary(docId)
      setAnalysis(response)
    } catch (err) {
      console.error('Failed to load analysis:', err)
      setAnalysis(null)
    }
  }

  const triggerAnalysis = async (docId: string) => {
    try {
      await api.analysis.extract(docId)
      showSuccess('Analysis started. This may take a few minutes.')
      setTimeout(() => loadAnalysis(docId), 2000)
    } catch (err) {
      console.error('Failed to trigger analysis:', err)
      showError('Failed to start analysis. Please try again.')
    }
  }

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
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
      case 'failed':
        return <FileWarning className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-ink-500" />
    }
  }

  return (
    <div
      className="min-h-screen bg-ink-950"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false) }}
      onDrop={handleDrop}
    >
      <Navigation>
        {/* Search */}
        <div className="relative" data-tour="search">
          <label htmlFor="search-input" className="sr-only">Search contracts</label>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search..."
            className="w-28 sm:w-40 lg:w-64 pl-8 sm:pl-10 pr-4 py-2 bg-ink-900/60 border border-ink-700/50 rounded-lg
                     text-sm text-ink-100 placeholder:text-ink-500
                     focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/10
                     transition-all duration-200"
          />
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent animate-spin" />
          )}
        </div>

        <WalkthroughButton onClick={walkthrough.restart} />

        <button
          type="button"
          data-tour="upload"
          aria-label="Upload PDF"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-ink-950 font-semibold rounded-lg
                   hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20
                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={handleMultiUpload}
          className="hidden"
        />
      </Navigation>

      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {dragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-none"
          >
            <div className="p-12 border-2 border-dashed border-accent/50 rounded-2xl bg-accent/5 text-center">
              <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
              <p className="text-xl font-display font-semibold text-ink-100">Drop PDF files here</p>
              <p className="text-sm text-ink-500 mt-2">Supports multiple files up to 50MB each</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        <h1 className="sr-only">Contract Dashboard</h1>
        {/* Stats Row - Data Dense */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8"
          data-tour="stats"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="skeleton w-4 h-4 rounded" />
                </div>
                <div className="mt-2 space-y-2">
                  <div className="skeleton h-8 w-16 rounded" />
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                icon={<FileText className="w-5 h-5" />}
                value={stats?.documents_indexed ?? 0}
                label="Documents Indexed"
                sublabel="Ready for analysis"
                delay={0}
                onClick={() => router.push('/search')}
              />
              <StatCard
                icon={<Database className="w-5 h-5" />}
                value={stats?.chunks_with_embeddings ?? 0}
                label="Text Chunks"
                sublabel="Vector embeddings"
                delay={0.05}
                onClick={() => router.push('/search')}
              />
              <StatCard
                icon={<Zap className="w-5 h-5" />}
                value={stats?.clauses_extracted ?? 0}
                label="Clauses Extracted"
                sublabel="AI-powered analysis"
                delay={0.1}
                onClick={() => {
                  const docWithClauses = documents.find(d => d.status === 'completed')
                  if (docWithClauses) {
                    router.push(`/documents/${docWithClauses.id}`)
                  } else {
                    router.push('/search')
                  }
                }}
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                value={documents.filter(d => d.status === 'completed').length}
                label="Ready for Review"
                sublabel="Completed processing"
                delay={0.15}
                onClick={() => {
                  const completed = documents.find(d => d.status === 'completed')
                  if (completed) {
                    loadAnalysis(completed.id)
                  }
                }}
              />
            </>
          )}
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="card p-6 border-accent/20">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink-50">Search Results</h2>
                    <p className="text-xs text-ink-500 mt-0.5 font-mono">{searchResults.length} matches found</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchResults([])}
                    className="p-2 hover:bg-ink-800 rounded-lg transition-colors"
                    aria-label="Clear search results"
                  >
                    <X className="w-4 h-4 text-ink-400" />
                  </button>
                </div>
                <div className="space-y-3">
                  {searchResults.map((result, i) => (
                    <motion.div
                      key={result.chunk_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-4 bg-ink-900/40 border border-ink-800/50 rounded-lg hover:border-accent/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-accent">{result.document_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-ink-500 font-mono uppercase">Relevance</span>
                          <span className="text-xs text-ink-300 font-mono bg-ink-800/50 px-2 py-0.5 rounded">
                            {(result.combined_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-ink-300 leading-relaxed line-clamp-2">{result.content}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document List - Enhanced */}
          <div className="lg:col-span-2" data-tour="documents">
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-ink-800/50 bg-ink-925">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-lg sm:text-xl font-semibold text-ink-50">Contract Portfolio</h2>
                    <p className="text-[11px] text-ink-400 mt-1 font-mono">
                      {documents.length} documents · Click to analyze
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/search')}
                    className="text-xs text-ink-400 hover:text-accent transition-colors flex items-center gap-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    Advanced View
                  </button>
                </div>
              </div>
              <div className="divide-y divide-ink-800/30 max-h-[calc(100vh-320px)] overflow-y-auto">
                {loading ? (
                  <div className="divide-y divide-ink-800/30">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="px-6 py-5 flex items-start gap-4" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="skeleton w-4 h-4 rounded-full mt-0.5 shrink-0" />
                        <div className="flex-1 space-y-2.5">
                          <div className="skeleton h-4 rounded" style={{ width: `${65 + Math.random() * 30}%` }} />
                          <div className="flex items-center gap-3">
                            <div className="skeleton h-3 w-16 rounded" />
                            <div className="skeleton h-3 w-20 rounded" />
                            <div className="skeleton h-3 w-12 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-10 sm:p-16">
                    <div className="max-w-sm mx-auto text-center">
                      {/* Decorative upload zone */}
                      <div
                        className="relative mx-auto w-24 h-24 rounded-2xl border-2 border-dashed border-ink-700/60 bg-ink-900/30
                                   flex items-center justify-center mb-6 group-hover:border-accent/40 transition-colors"
                      >
                        <Upload className="w-8 h-8 text-ink-600" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-accent" />
                        </div>
                      </div>

                      <h3 className="text-ink-200 font-semibold text-base">Upload your first contract</h3>
                      <p className="mt-2 text-ink-500 text-sm leading-relaxed">
                        Drop a PDF here or click below. BrightClause will extract clauses, score risks, and build a searchable index automatically.
                      </p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6 btn-primary inline-flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choose PDF
                      </button>

                      {/* What happens next */}
                      <div className="mt-8 pt-6 border-t border-ink-800/40">
                        <p className="text-[10px] text-ink-600 font-mono uppercase tracking-wider mb-3">What happens next</p>
                        <div className="flex items-center justify-center gap-3 text-[11px] text-ink-400">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-amber-500/70" />
                            Extract
                          </span>
                          <ChevronRight className="w-3 h-3 text-ink-700" />
                          <span className="flex items-center gap-1.5">
                            <Shield className="w-3 h-3 text-orange-500/70" />
                            Score
                          </span>
                          <ChevronRight className="w-3 h-3 text-ink-700" />
                          <span className="flex items-center gap-1.5">
                            <Search className="w-3 h-3 text-emerald-500/70" />
                            Index
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  documents.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      role="button"
                      tabIndex={0}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onMouseEnter={() => setHoveredDoc(doc.id)}
                      onMouseLeave={() => setHoveredDoc(null)}
                      onClick={() => loadAnalysis(doc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          loadAnalysis(doc.id)
                        }
                      }}
                      className={`px-6 py-5 cursor-pointer transition-all duration-200 relative group
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50
                                ${selectedDoc === doc.id
                                  ? 'bg-ink-900/60 border-l-2 border-accent'
                                  : 'hover:bg-ink-900/30 border-l-2 border-transparent'
                                }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="mt-0.5">
                            {getStatusIcon(doc.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            {renamingDoc === doc.id ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  ref={renameInputRef}
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') submitRename()
                                    if (e.key === 'Escape') setRenamingDoc(null)
                                  }}
                                  onBlur={submitRename}
                                  className="flex-1 px-2 py-1 bg-ink-900 border border-accent/40 rounded text-[15px] text-ink-100
                                           focus:outline-none focus:ring-1 focus:ring-accent/30"
                                />
                                <button
                                  type="button"
                                  onMouseDown={(e) => { e.preventDefault(); submitRename() }}
                                  className="p-1 text-accent hover:bg-accent/10 rounded transition-colors"
                                  aria-label="Save name"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group/name">
                                <h3 className="font-medium text-ink-100 text-[15px] leading-snug truncate">
                                  {doc.filename}
                                </h3>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    startRename(doc.id, doc.filename)
                                  }}
                                  className="p-1 text-ink-600 hover:text-accent opacity-0 group-hover/name:opacity-100 transition-all rounded"
                                  aria-label="Rename document"
                                  title="Rename"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`text-[11px] font-mono uppercase tracking-wide ${
                                doc.status === 'completed' ? 'text-ink-500'
                                : doc.status === 'queued' ? 'text-blue-400'
                                : doc.status === 'processing' ? 'text-amber-400'
                                : 'text-ink-500'
                              }`}>
                                {doc.status === 'completed'
                                  ? doc.page_count ? `${doc.page_count} pages` : 'Unknown pages'
                                  : doc.status === 'queued' ? 'Queued · ~30s'
                                  : doc.status === 'processing' ? 'Processing...'
                                  : doc.status === 'failed' ? 'Failed'
                                  : doc.status
                                }
                              </span>
                              {doc.chunk_count > 0 && (
                                <>
                                  <span className="text-ink-700">·</span>
                                  <span className="text-[11px] text-ink-400 font-mono uppercase tracking-wide">
                                    {doc.chunk_count} chunks
                                  </span>
                                </>
                              )}
                              {doc.status === 'completed' && (
                                <>
                                  <span className="text-ink-700">·</span>
                                  <span className="text-[11px] text-emerald-500 font-mono uppercase tracking-wide">
                                    Ready
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons - Show on hover */}
                        <div className={`flex items-center gap-2 transition-opacity duration-200 ${
                          hoveredDoc === doc.id || selectedDoc === doc.id ? 'opacity-100' : 'opacity-0'
                        }`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigateToDocument(doc.id)
                            }}
                            className="p-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors"
                            aria-label="View document details"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-ink-600 group-hover:text-accent transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Risk Analysis Panel - Enhanced & Data Dense */}
          <div className="lg:col-span-1" data-tour="analysis">
            <AnimatePresence mode="wait">
              {selectedDoc && analysis ? (
                <motion.div
                  key={selectedDoc}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="card overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                    <h2 className="font-display text-xl font-semibold text-ink-50">Risk Assessment</h2>
                    <p className="text-[11px] text-ink-400 mt-1 font-mono uppercase tracking-wide">
                      AI-Powered Analysis
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Overall Risk - Prominent */}
                    <div className={`p-5 rounded-xl border-2 ${riskGlow[analysis.overall_risk as RiskLevel]}
                                  ${riskColors[analysis.overall_risk as RiskLevel]}`}>
                      <div className="text-center">
                        <div className="text-[11px] text-ink-400 font-mono uppercase tracking-wide mb-2">
                          Overall Risk Level
                        </div>
                        <div className={`text-3xl font-bold uppercase tracking-tight ${
                          analysis.overall_risk === 'critical' ? 'text-red-400' :
                          analysis.overall_risk === 'high' ? 'text-orange-400' :
                          analysis.overall_risk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {analysis.overall_risk}
                        </div>
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <div className="text-[10px] text-ink-500 font-mono uppercase">
                            {analysis.clauses_extracted} Clauses Analyzed
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Distribution - Data Dense Grid */}
                    <div>
                      <h3 className="text-[11px] font-mono uppercase tracking-wide text-ink-400 mb-3">
                        Risk Distribution
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => {
                          const count = analysis.risk_summary[level] || 0
                          return (
                            <div
                              key={level}
                              className={`p-4 rounded-lg border ${riskColors[level]} text-center`}
                            >
                              <div className={`text-2xl font-bold font-mono ${
                                level === 'critical' ? 'text-red-400' :
                                level === 'high' ? 'text-orange-400' :
                                level === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {count}
                              </div>
                              <div className="text-[10px] uppercase font-mono tracking-wide text-ink-500 mt-1">
                                {level}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* High Risk Highlights */}
                    {analysis.high_risk_highlights.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-mono uppercase tracking-wide text-ink-400 mb-3">
                          Attention Required
                        </h3>
                        <div className="space-y-3">
                          {analysis.high_risk_highlights.slice(0, 3).map((highlight, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={`p-4 rounded-lg border text-sm ${
                                highlight.risk_level === 'critical'
                                  ? 'border-red-500/30 bg-red-500/5'
                                  : 'border-orange-500/30 bg-orange-500/5'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className={`w-4 h-4 ${
                                  highlight.risk_level === 'critical' ? 'text-red-400' : 'text-orange-400'
                                }`} />
                                <span className="font-semibold text-ink-100 text-xs uppercase tracking-wide">
                                  {highlight.clause_type.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-ink-400 text-xs leading-relaxed line-clamp-3">
                                {highlight.summary}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions - Prominent CTAs */}
                    <div className="pt-4 border-t border-ink-800/50 space-y-3">
                      <button
                        type="button"
                        onClick={() => navigateToDocument(selectedDoc)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-ink-950
                                 font-semibold rounded-xl hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20
                                 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Analysis
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/documents/${selectedDoc}/graph`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ink-800 text-ink-200
                                 font-medium rounded-xl hover:bg-ink-700 transition-colors"
                      >
                        <Network className="w-4 h-4" />
                        Knowledge Graph
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : selectedDoc ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                    <div className="skeleton h-6 w-40 rounded mb-2" />
                    <div className="skeleton h-3 w-28 rounded" />
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="skeleton h-28 w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton h-20 rounded-lg" />
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="skeleton h-3 w-28 rounded" />
                      <div className="skeleton h-20 rounded-lg" />
                      <div className="skeleton h-20 rounded-lg" />
                    </div>
                    <div className="pt-4 border-t border-ink-800/50">
                      <button
                        type="button"
                        onClick={() => triggerAnalysis(selectedDoc)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-ink-800 text-ink-200
                                 font-medium rounded-xl hover:bg-ink-700 transition-colors text-sm"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Run Analysis
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-ink-800/50 bg-ink-925">
                    <h2 className="font-display text-xl font-semibold text-ink-50">Risk Assessment</h2>
                    <p className="text-[11px] text-ink-400 mt-1 font-mono uppercase tracking-wide">
                      Select a document
                    </p>
                  </div>
                  <div className="p-6">
                    {/* Preview of what the panel shows */}
                    <div className="p-5 rounded-xl border border-ink-800/30 bg-ink-900/20 mb-5">
                      <div className="text-center">
                        <div className="text-[11px] text-ink-600 font-mono uppercase tracking-wide mb-2">
                          Overall Risk Level
                        </div>
                        <div className="text-2xl font-bold text-ink-700 tracking-tight">
                          — — —
                        </div>
                        <div className="mt-3 pt-3 border-t border-ink-800/30">
                          <div className="text-[10px] text-ink-600 font-mono uppercase">
                            No document selected
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ghost risk grid */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {['Critical', 'High', 'Medium', 'Low'].map((level) => (
                        <div key={level} className="p-3 rounded-lg border border-ink-800/20 bg-ink-900/10 text-center">
                          <div className="text-lg font-bold font-mono text-ink-800">0</div>
                          <div className="text-[10px] uppercase font-mono tracking-wide text-ink-700 mt-0.5">{level}</div>
                        </div>
                      ))}
                    </div>

                    {/* Guidance */}
                    <div className="text-center py-4">
                      <Shield className="w-10 h-10 text-ink-800 mx-auto mb-3" />
                      <p className="text-sm text-ink-500">
                        Click a contract from the portfolio to see its risk breakdown, flagged clauses, and recommended actions.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Activity Feed */}
        {activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 sm:mt-8"
          >
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-ink-800/50 bg-ink-925">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <h2 className="font-display text-lg font-semibold text-ink-50">Recent Activity</h2>
                  <span className="text-[11px] text-ink-400 font-mono ml-auto">{activities.length} events</span>
                </div>
              </div>
              <div className="divide-y divide-ink-800/30 max-h-[400px] overflow-y-auto">
                {activities.map((act, i) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="px-4 sm:px-6 py-3 flex items-start gap-3 hover:bg-ink-900/30 transition-colors"
                  >
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      act.action === 'uploaded' ? 'bg-emerald-500/10 text-emerald-400' :
                      act.action === 'deleted' ? 'bg-red-500/10 text-red-400' :
                      act.action === 'chat_question' ? 'bg-blue-500/10 text-blue-400' :
                      act.action === 'extraction_started' ? 'bg-amber-500/10 text-amber-400' :
                      act.action === 'report_generated' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-ink-800/50 text-ink-400'
                    }`}>
                      {act.action === 'uploaded' && <Upload className="w-3.5 h-3.5" />}
                      {act.action === 'deleted' && <Trash2 className="w-3.5 h-3.5" />}
                      {act.action === 'chat_question' && <MessageCircle className="w-3.5 h-3.5" />}
                      {act.action === 'extraction_started' && <Zap className="w-3.5 h-3.5" />}
                      {act.action === 'report_generated' && <FileBarChart className="w-3.5 h-3.5" />}
                      {!['uploaded', 'deleted', 'chat_question', 'extraction_started', 'report_generated'].includes(act.action) && (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-200">
                        <span className="font-medium text-ink-100 capitalize">{act.action.replace(/_/g, ' ')}</span>
                        {act.filename && (
                          <>
                            {' — '}
                            {act.document_id ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/documents/${act.document_id}`)}
                                className="text-accent hover:text-accent-light transition-colors"
                              >
                                {act.filename}
                              </button>
                            ) : (
                              <span className="text-ink-400">{act.filename}</span>
                            )}
                          </>
                        )}
                        {act.action === 'chat_question' && typeof act.details?.question === 'string' && (
                          <span className="text-ink-400 ml-1 italic">
                            &quot;{act.details.question.slice(0, 80)}{act.details.question.length > 80 ? '...' : ''}&quot;
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-ink-400 font-mono mt-0.5">
                        {formatRelativeTime(act.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <WalkthroughOverlay
        active={walkthrough.active}
        step={walkthrough.step}
        currentStep={walkthrough.currentStep}
        totalSteps={walkthrough.totalSteps}
        next={walkthrough.next}
        prev={walkthrough.prev}
        dismiss={walkthrough.dismiss}
      />
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  sublabel,
  delay,
  onClick,
}: {
  icon: React.ReactNode
  value: number
  label: string
  sublabel: string
  delay: number
  onClick?: () => void
}) {
  const Wrapper = onClick ? motion.button : motion.div
  return (
    <Wrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className={`card p-6 hover:border-accent/20 transition-all duration-300 group text-left
                ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
          {icon}
        </div>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-ink-600 group-hover:text-accent transition-colors" />
        )}
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold font-mono text-ink-50 tracking-tight">
          {value.toLocaleString()}
        </p>
        <p className="text-sm font-semibold text-ink-300 mt-1">{label}</p>
        <p className="text-[10px] text-ink-500 mt-1 font-mono uppercase tracking-wide">{sublabel}</p>
      </div>
    </Wrapper>
  )
}
