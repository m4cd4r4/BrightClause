'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Briefcase, FileText, AlertTriangle, CheckCircle,
  Loader2, Plus, Trash2, Eye, ChevronLeft
} from 'lucide-react'
import { api, DealDetail, Document } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { type RiskLevel } from '@/lib/risk'
import { V3Shell } from '@/components/v3/shell'
import { PageHeader, KpiCard } from '@/components/v3/primitives'

const riskVar: Record<RiskLevel, string> = {
  critical: 'var(--v3-risk-critical)',
  high: 'var(--v3-risk-high)',
  medium: 'var(--v3-risk-medium)',
  low: 'var(--v3-risk-low)',
}

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.id as string
  const { error: showError, success: showSuccess } = useToast()
  const [deal, setDeal] = useState<DealDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [allDocs, setAllDocs] = useState<Document[]>([])
  const [showAddDocs, setShowAddDocs] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingDeal, setDeletingDeal] = useState(false)

  const loadDeal = useCallback(async () => {
    try {
      const response = await api.deals.get(dealId)
      setDeal(response)
    } catch {
      showError('Failed to load deal.')
    } finally {
      setLoading(false)
    }
  }, [dealId, showError])

  useEffect(() => {
    loadDeal()
  }, [loadDeal])

  const openAddDocs = async () => {
    try {
      const response = await api.documents.list({ limit: 100 })
      setAllDocs(response.documents)
      setSelectedDocs(new Set())
      setShowAddDocs(true)
    } catch {
      showError('Failed to load documents.')
    }
  }

  const handleAddDocuments = async () => {
    if (selectedDocs.size === 0) return
    setAdding(true)
    try {
      const result = await api.deals.addDocuments(dealId, Array.from(selectedDocs))
      showSuccess(`${result.documents_added} document(s) added to deal.`)
      setShowAddDocs(false)
      await loadDeal()
    } catch {
      showError('Failed to add documents.')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteDeal = async () => {
    setDeletingDeal(true)
    try {
      await api.deals.delete(dealId)
      showSuccess('Deal deleted.')
      router.push('/deals')
    } catch {
      showError('Failed to delete deal.')
      setDeletingDeal(false)
      setConfirmDelete(false)
    }
  }

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await api.deals.removeDocument(dealId, documentId)
      showSuccess('Document removed from deal.')
      await loadDeal()
    } catch {
      showError('Failed to remove document.')
    }
  }

  if (loading) {
    return (
      <V3Shell>
        <div style={{ height: 32, width: 240, background: 'var(--v3-card-hover)', borderRadius: 4, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 104, background: 'var(--v3-card-hover)', borderRadius: 'var(--v3-radius-md)' }} />
          ))}
        </div>
      </V3Shell>
    )
  }

  if (!deal) {
    return (
      <V3Shell>
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <p style={{ color: 'var(--v3-text-muted)' }}>Deal not found.</p>
        </div>
      </V3Shell>
    )
  }

  const totalClauses = deal.documents.reduce((sum, d) => sum + d.clause_count, 0)
  const totalRisk = Object.values(deal.risk_summary).reduce((sum, v) => sum + v, 0)

  return (
    <V3Shell>
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/deals')}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--v3-text-muted)', background: 'transparent', border: 0, cursor: 'pointer', padding: 0, marginBottom: 8 }}
      >
        <ChevronLeft size={16} />
        All Deals
      </button>

      <PageHeader
        crumb="Workspace · Deals"
        title={deal.name}
        subtitle={deal.description || undefined}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {confirmDelete ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--v3-text-secondary)' }}>Delete this deal?</span>
                <button
                  type="button"
                  onClick={handleDeleteDeal}
                  disabled={deletingDeal}
                  className="v3-btn"
                  style={{ background: 'var(--v3-risk-critical)', borderColor: 'var(--v3-risk-critical)', color: '#fff', fontWeight: 600, opacity: deletingDeal ? 0.5 : 1 }}
                >
                  {deletingDeal ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="v3-btn v3-btn-ghost"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="v3-btn v3-btn-ghost"
                title="Delete deal"
                style={{ color: 'var(--v3-text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={openAddDocs}
              className="v3-btn v3-btn-primary"
            >
              <Plus size={14} />
              Add Documents
            </button>
          </div>
        }
      />

      {/* Aggregate Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 32 }}
      >
        <KpiCard label="Documents" value={deal.document_count} animateOnMount={false} />
        <KpiCard label="Total Clauses" value={totalClauses} animateOnMount={false} />
        <KpiCard label="Critical Risk" value={deal.risk_summary.critical || 0} intent="critical" animateOnMount={false} />
        <KpiCard label="High Risk" value={deal.risk_summary.high || 0} intent="high" animateOnMount={false} />
      </motion.div>

      {/* Risk Distribution */}
      {totalRisk > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="v3-card"
          style={{ padding: 20, marginBottom: 32 }}
        >
          <h3 className="v3-mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)', marginTop: 0, marginBottom: 12 }}>
            Aggregate Risk Distribution
          </h3>
          <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', background: 'var(--v3-panel)' }}>
            {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => {
              const count = deal.risk_summary[level] || 0
              const pct = totalRisk > 0 ? (count / totalRisk) * 100 : 0
              if (pct === 0) return null
              return <div key={level} style={{ width: `${pct}%`, background: riskVar[level] }} title={`${level}: ${count}`} />
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => (
              <span key={level} className="v3-mono" style={{ fontSize: 11, color: riskVar[level] }}>
                {level}: {deal.risk_summary[level] || 0}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Documents Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="v3-card"
        style={{ overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Documents in Deal</h2>
        </div>
        {deal.documents.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <FileText size={48} color="var(--v3-text-disabled)" style={{ margin: '0 auto', display: 'block' }} />
            <p style={{ marginTop: 16, color: 'var(--v3-text-muted)', fontSize: 13 }}>No documents in this deal yet.</p>
          </div>
        ) : (
          <div>
            {deal.documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderTop: i > 0 ? '1px solid var(--v3-border)' : '0' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{ marginTop: 2 }}>
                    {doc.status === 'completed' ? (
                      <CheckCircle size={16} color="var(--v3-risk-low)" />
                    ) : doc.status === 'failed' ? (
                      <AlertTriangle size={16} color="var(--v3-risk-critical)" />
                    ) : (
                      <Loader2 size={16} color="var(--v3-risk-medium)" style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--v3-text-primary)', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
                      {doc.page_count && (
                        <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{doc.page_count} pages</span>
                      )}
                      {doc.clause_count > 0 && (
                        <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{doc.clause_count} clauses</span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => router.push(`/documents/${doc.id}`)}
                    className="v3-btn v3-btn-ghost"
                    title="View document"
                    style={{ color: 'var(--v3-text-secondary)' }}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(doc.id)}
                    className="v3-btn v3-btn-ghost"
                    title="Remove from deal"
                    style={{ color: 'var(--v3-text-muted)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Documents Modal */}
      {showAddDocs && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddDocs(false) }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="v3-card"
            style={{ padding: 24, width: '100%', maxWidth: 512, maxHeight: '70vh', display: 'flex', flexDirection: 'column', background: 'var(--v3-popover)', boxShadow: 'var(--v3-shadow-md)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Add Documents</h2>
              <button onClick={() => setShowAddDocs(false)} style={{ display: 'flex', padding: 4, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--v3-text-muted)', fontSize: 18, lineHeight: 1 }}>
                <span className="sr-only">Close</span>
                &times;
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {allDocs.filter(d => !deal.documents.some(dd => dd.id === d.id)).map((doc) => (
                <label
                  key={doc.id}
                  className="v3-card-hover"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--v3-radius-md)', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={(e) => {
                      const next = new Set(selectedDocs)
                      if (e.target.checked) next.add(doc.id)
                      else next.delete(doc.id)
                      setSelectedDocs(next)
                    }}
                    style={{ accentColor: 'var(--v3-accent)' }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--v3-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.filename}</p>
                    <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', margin: 0 }}>{doc.status}</p>
                  </div>
                </label>
              ))}
              {allDocs.filter(d => !deal.documents.some(dd => dd.id === d.id)).length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', textAlign: 'center', padding: '16px 0' }}>All documents are already in this deal.</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddDocuments}
              disabled={adding || selectedDocs.size === 0}
              className="v3-btn v3-btn-primary"
              style={{ width: '100%', height: 38, justifyContent: 'center', opacity: adding || selectedDocs.size === 0 ? 0.5 : 1 }}
            >
              {adding && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Add {selectedDocs.size} Document{selectedDocs.size !== 1 ? 's' : ''}
            </button>
          </motion.div>
        </motion.div>
      )}
    </V3Shell>
  )
}
