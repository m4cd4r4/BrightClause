'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileText, ExternalLink, AlertTriangle } from 'lucide-react'
import { api, Clause } from '@/lib/api'

interface PdfViewerProps {
  documentId: string
  clauses: Clause[]
  activeClauseId?: string | null
  onClauseClick?: (clauseId: string) => void
}

export function PdfViewer({ documentId, clauses, activeClauseId, onClauseClick }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadUrl = async () => {
      try {
        const result = await api.documents.downloadUrl(documentId)
        if (!cancelled) {
          setPdfUrl(result.download_url)
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load PDF. The document may not be stored or accessible.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadUrl()
    return () => { cancelled = true }
  }, [documentId])

  // Group clauses by page
  const clausesByPage: Record<number, Clause[]> = {}
  for (const c of clauses) {
    const page = c.page_number ?? 0
    if (!clausesByPage[page]) clausesByPage[page] = []
    clausesByPage[page].push(c)
  }

  const sortedPages = Object.keys(clausesByPage).map(Number).sort((a, b) => a - b)

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Clause Navigator */}
      <div className="w-64 shrink-0 card overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-ink-800/50 bg-ink-925">
          <h3 className="text-[11px] font-mono uppercase tracking-wide text-ink-400">
            Clauses by Page
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sortedPages.length === 0 ? (
            <p className="p-4 text-xs text-ink-500">No clauses with page numbers.</p>
          ) : (
            sortedPages.map((page) => (
              <div key={page}>
                <div className="px-4 py-2 bg-ink-900/30 text-[11px] font-mono uppercase tracking-wide text-ink-500 sticky top-0">
                  {page === 0 ? 'Unknown Page' : `Page ${page}`}
                </div>
                {clausesByPage[page].map((clause) => {
                  const isActive = activeClauseId === clause.id
                  const riskColor =
                    clause.risk_level === 'critical' ? 'border-l-red-500' :
                    clause.risk_level === 'high' ? 'border-l-orange-500' :
                    clause.risk_level === 'medium' ? 'border-l-amber-500' :
                    'border-l-emerald-500'

                  return (
                    <button
                      key={clause.id}
                      type="button"
                      onClick={() => onClauseClick?.(clause.id)}
                      className={`w-full text-left px-4 py-2.5 border-l-2 transition-colors text-xs ${riskColor} ${
                        isActive
                          ? 'bg-accent/10 border-l-accent'
                          : 'hover:bg-ink-800/50'
                      }`}
                    >
                      <p className="text-ink-300 font-medium truncate">
                        {clause.clause_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-ink-500 truncate mt-0.5">
                        {clause.summary || clause.content.slice(0, 60)}
                      </p>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-ink-800/50 bg-ink-925 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-mono uppercase tracking-wide text-ink-400">PDF Preview</span>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-ink-400 hover:text-accent transition-colors"
            >
              Open in new tab
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex-1 bg-ink-900/30">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <AlertTriangle className="w-10 h-10 text-ink-600 mb-3" />
              <p className="text-sm text-ink-400">{error}</p>
              <p className="text-xs text-ink-600 mt-2">
                The PDF might still be processing or the storage service is unavailable.
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Contract PDF"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
