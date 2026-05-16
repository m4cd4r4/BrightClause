'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, FileText, Loader2,
  Zap, Database, ArrowRight, X, SlidersHorizontal, Sparkles
} from 'lucide-react'
import { api, Document, SearchResult } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { V3Shell } from '@/components/v3/shell'
import { PageHeader } from '@/components/v3/primitives'

type SearchMode = 'hybrid' | 'semantic' | 'keyword'

const searchModes: Record<SearchMode, { label: string; description: string; icon: typeof Sparkles }> = {
  hybrid: {
    label: 'Hybrid',
    description: 'Combines semantic understanding with keyword matching',
    icon: Sparkles,
  },
  semantic: {
    label: 'Semantic',
    description: 'AI-powered search that understands meaning',
    icon: Zap,
  },
  keyword: {
    label: 'Keyword',
    description: 'Traditional exact match search',
    icon: Database,
  },
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid')
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)
  const [resultLimit, setResultLimit] = useState(20)
  const [showFilters, setShowFilters] = useState(false)

  const { error: showError } = useToast()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await api.documents.list({ limit: 100 })
      setDocuments(response.documents.filter(d => d.status === 'completed'))
    } catch (error) {
      console.error('Failed to load documents:', error)
      showError('Failed to load document list.')
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(true)
    try {
      const response = await api.search.query(query, {
        limit: resultLimit,
        mode: searchMode,
        document_id: selectedDocument || undefined,
      })
      setResults(response.results)
    } catch (error) {
      console.error('Search failed:', error)
      showError('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text
    try {
      const escaped = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      const parts = text.split(regex)
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.trim().toLowerCase() ? (
          <mark key={i} style={{ background: 'rgba(212,168,45,0.28)', color: 'var(--v3-accent-hover)', padding: '0 2px', borderRadius: 3 }}>
            {part}
          </mark>
        ) : (
          part
        )
      )
    } catch {
      return text
    }
  }

  const groupedResults = results.reduce((acc, result) => {
    const docName = result.document_name
    if (!acc[docName]) {
      acc[docName] = []
    }
    acc[docName].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <V3Shell>
      <PageHeader
        crumb="Insights"
        title="Search"
        subtitle="Use natural language or keywords to find relevant clauses and provisions"
      />

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Main Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--v3-text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for termination clauses, liability caps, change of control provisions..."
              aria-label="Search contracts"
              style={{
                width: '100%', padding: '16px 44px 16px 46px',
                background: 'var(--v3-card)', border: '1px solid var(--v3-border)',
                borderRadius: 'var(--v3-radius-md)', fontSize: 16,
                color: 'var(--v3-text-primary)', outline: 'none', fontFamily: 'inherit',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: 'var(--v3-radius-sm)',
                  background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--v3-text-muted)',
                }}
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Search Options Row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Search Mode Buttons */}
              {(Object.keys(searchModes) as SearchMode[]).map((mode) => {
                const config = searchModes[mode]
                const Icon = config.icon
                const active = searchMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSearchMode(mode)}
                    className="v3-btn"
                    style={active ? {
                      background: 'rgba(212,168,45,0.16)', color: 'var(--v3-accent)',
                      borderColor: 'rgba(212,168,45,0.35)',
                    } : undefined}
                  >
                    <Icon size={14} />
                    {config.label}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`v3-btn${showFilters ? '' : ' v3-btn-ghost'}`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {(selectedDocument || resultLimit !== 20) && (
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--v3-accent)' }} />
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="v3-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Document Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--v3-text-secondary)', marginBottom: 8 }}>Limit to Document</label>
                    <select
                      value={selectedDocument || ''}
                      onChange={(e) => setSelectedDocument(e.target.value || null)}
                      style={{
                        width: '100%', padding: '8px 12px',
                        background: 'var(--v3-panel)', border: '1px solid var(--v3-border)',
                        borderRadius: 'var(--v3-radius-md)', fontSize: 13,
                        color: 'var(--v3-text-primary)', outline: 'none', fontFamily: 'inherit',
                      }}
                    >
                      <option value="">All Documents</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.filename}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Result Limit */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, color: 'var(--v3-text-secondary)', marginBottom: 8 }}>
                      Results Limit: {resultLimit}
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={resultLimit}
                      onChange={(e) => setResultLimit(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--v3-accent)' }}
                    />
                  </div>

                  {/* Clear Filters */}
                  {(selectedDocument || resultLimit !== 20) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDocument(null)
                        setResultLimit(20)
                      }}
                      style={{ fontSize: 13, color: 'var(--v3-accent)', background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Button */}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="v3-btn v3-btn-primary"
            style={{ width: '100%', height: 48, justifyContent: 'center', fontSize: 14, opacity: !query.trim() || loading ? 0.5 : 1 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Searching...
              </>
            ) : (
              <>
                <Search size={18} />
                Search Contracts
              </>
            )}
          </button>
        </form>

        {/* Mode Description */}
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--v3-text-muted)', marginTop: 16 }}>
          {searchModes[searchMode].description}
        </p>
      </div>

      {/* Results */}
      {hasSearched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginTop: 48 }}
        >
          {results.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>
                  {results.length} Results
                  <span style={{ color: 'var(--v3-text-muted)', fontWeight: 400, marginLeft: 8 }}>
                    across {Object.keys(groupedResults).length} documents
                  </span>
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(groupedResults).map(([docName, docResults], groupIndex) => (
                  <motion.div
                    key={docName}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: groupIndex * 0.08 }}
                    className="v3-card"
                    style={{ overflow: 'hidden' }}
                  >
                    {/* Document Header */}
                    <div style={{ padding: '14px 20px', background: 'var(--v3-panel)', borderBottom: '1px solid var(--v3-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <FileText size={18} color="var(--v3-accent)" />
                        <span style={{ fontWeight: 500, color: 'var(--v3-text-primary)' }}>{docName}</span>
                        <span style={{ fontSize: 13, color: 'var(--v3-text-muted)' }}>
                          {docResults.length} match{docResults.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                      <Link
                        href={`/documents/${docResults[0].document_id}`}
                        style={{ fontSize: 13, color: 'var(--v3-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        View Document
                        <ArrowRight size={16} />
                      </Link>
                    </div>

                    {/* Results */}
                    <div>
                      {docResults.map((result, i) => (
                        <motion.div
                          key={result.chunk_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: groupIndex * 0.1 + i * 0.03 }}
                          style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid var(--v3-border)' : '0' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                {highlightMatch(result.content, query)}
                              </p>
                              {result.page_number && (
                                <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 8, marginBottom: 0 }}>Page {result.page_number}</p>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                              <div className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                                <span>Combined: {(result.combined_score * 100).toFixed(0)}%</span>
                              </div>
                              <div className="v3-mono" style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                                <span style={{ color: '#60a5fa' }}>
                                  Semantic: {(result.semantic_score * 100).toFixed(0)}%
                                </span>
                                <span style={{ color: '#34d399' }}>
                                  Keyword: {(result.keyword_score * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '64px 16px' }}
            >
              <Search size={48} color="var(--v3-text-disabled)" style={{ margin: '0 auto', display: 'block' }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 16, color: 'var(--v3-text-primary)' }}>No Results Found</h3>
              <p style={{ color: 'var(--v3-text-muted)', marginTop: 8, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', fontSize: 13, lineHeight: 1.6 }}>
                Nothing matched &ldquo;{query}&rdquo; in <span className="v3-mono" style={{ color: 'var(--v3-text-secondary)' }}>{searchModes[searchMode].label}</span> mode.
                {selectedDocument && ' Results are also filtered to a single document.'}
              </p>
              <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {(Object.keys(searchModes) as SearchMode[])
                  .filter(m => m !== searchMode)
                  .map(mode => {
                    const Icon = searchModes[mode].icon
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { setSearchMode(mode); handleSearch() }}
                        className="v3-btn"
                      >
                        <Icon size={14} />
                        Try {searchModes[mode].label}
                      </button>
                    )
                  })}
                {selectedDocument && (
                  <button
                    type="button"
                    onClick={() => { setSelectedDocument(null); handleSearch() }}
                    className="v3-btn"
                  >
                    <X size={14} />
                    Search all documents
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Search Tips (shown before first search) */}
      {!hasSearched && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: 64, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto' }}
        >
          <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--v3-text-secondary)', marginBottom: 16, textAlign: 'center' }}>Example Searches</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            {[
              'termination for convenience',
              'limitation of liability cap',
              'change of control provisions',
              'confidentiality obligations',
              'indemnification requirements',
              'governing law jurisdiction',
              'assignment restrictions',
              'material adverse change',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setQuery(example)}
                className="v3-card v3-card-hover"
                style={{
                  padding: '12px 16px', fontSize: 13, color: 'var(--v3-text-secondary)',
                  textAlign: 'left', cursor: 'pointer',
                }}
              >
                &ldquo;{example}&rdquo;
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </V3Shell>
  )
}
