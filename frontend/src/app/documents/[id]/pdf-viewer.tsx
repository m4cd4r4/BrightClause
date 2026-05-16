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

const riskColorFor = (level: string | null | undefined) =>
  level === 'critical' ? 'var(--v3-risk-critical)'
  : level === 'high' ? 'var(--v3-risk-high)'
  : level === 'medium' ? 'var(--v3-risk-medium)'
  : 'var(--v3-risk-low)'

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
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 16 }}>
      {/* Clause Navigator */}
      <div className="v3-card" style={{ width: 256, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
          <h3 className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)', margin: 0 }}>
            Clauses by Page
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sortedPages.length === 0 ? (
            <p style={{ padding: 16, fontSize: 12, color: 'var(--v3-text-muted)' }}>No clauses with page numbers.</p>
          ) : (
            sortedPages.map((page) => (
              <div key={page}>
                <div className="v3-mono" style={{ padding: '8px 16px', background: 'var(--v3-panel)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)', position: 'sticky', top: 0 }}>
                  {page === 0 ? 'Unknown Page' : `Page ${page}`}
                </div>
                {clausesByPage[page].map((clause) => {
                  const isActive = activeClauseId === clause.id
                  const riskColor = riskColorFor(clause.risk_level)

                  return (
                    <button
                      key={clause.id}
                      type="button"
                      onClick={() => onClauseClick?.(clause.id)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        background: isActive ? 'rgba(212,168,45,0.1)' : 'transparent',
                        border: 'none',
                        borderLeft: `2px solid ${isActive ? 'var(--v3-accent)' : riskColor}`,
                        cursor: 'pointer', fontSize: 12, color: 'inherit',
                        display: 'block',
                      }}
                    >
                      <p style={{ color: 'var(--v3-text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                        {clause.clause_type.replace(/_/g, ' ')}
                      </p>
                      <p style={{ color: 'var(--v3-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0' }}>
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
      <div className="v3-card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={14} color="var(--v3-accent)" />
            <span className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>PDF Preview</span>
          </div>
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--v3-text-muted)', textDecoration: 'none' }}
            >
              Open in new tab
              <ExternalLink size={12} />
            </a>
          )}
        </div>
        <div style={{ flex: 1, background: 'var(--v3-panel)' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Loader2 size={24} color="var(--v3-accent)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 32px' }}>
              <AlertTriangle size={40} color="var(--v3-text-disabled)" style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: 'var(--v3-text-secondary)' }}>{error}</p>
              <p style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 8 }}>
                The PDF might still be processing or the storage service is unavailable.
              </p>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
              title="Contract PDF"
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
