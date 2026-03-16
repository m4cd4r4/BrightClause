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
import { Navigation } from '@/lib/navigation'
import { type RiskLevel } from '@/lib/risk'

const riskColors: Record<RiskLevel, string> = {
  critical: 'text-red-400 bg-red-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  low: 'text-emerald-400 bg-emerald-500/10',
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
      <div className="min-h-screen bg-ink-950">
        <Navigation />
        <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
          <div className="skeleton h-8 w-60 rounded mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-ink-950">
        <Navigation />
        <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8 text-center">
          <p className="text-ink-500">Deal not found.</p>
        </main>
      </div>
    )
  }

  const totalClauses = deal.documents.reduce((sum, d) => sum + d.clause_count, 0)
  const totalRisk = Object.values(deal.risk_summary).reduce((sum, v) => sum + v, 0)

  return (
    <div className="min-h-screen bg-ink-950">
      <Navigation />

      <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* Back + Header */}
        <button
          type="button"
          onClick={() => router.push('/deals')}
          className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-300 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          All Deals
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-accent" />
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-50">{deal.name}</h1>
            </div>
            {deal.description && (
              <p className="text-sm text-ink-500 mt-1 ml-9">{deal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {confirmDelete ? (
              <>
                <span className="text-xs text-ink-400">Delete this deal?</span>
                <button
                  type="button"
                  onClick={handleDeleteDeal}
                  disabled={deletingDeal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white font-semibold rounded-lg
                           hover:bg-red-400 transition-colors text-sm disabled:opacity-50"
                >
                  {deletingDeal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 text-ink-400 hover:text-ink-200 text-sm transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-ink-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete deal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={openAddDocs}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-ink-950 font-semibold rounded-lg
                       hover:bg-accent-light transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Documents</span>
            </button>
          </div>
        </motion.div>

        {/* Aggregate Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8"
        >
          <div className="card p-5">
            <p className="text-2xl font-bold font-mono text-ink-50">{deal.document_count}</p>
            <p className="text-[11px] text-ink-500 font-mono uppercase tracking-wide mt-1">Documents</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-bold font-mono text-ink-50">{totalClauses}</p>
            <p className="text-[11px] text-ink-500 font-mono uppercase tracking-wide mt-1">Total Clauses</p>
          </div>
          {(['critical', 'high'] as RiskLevel[]).map((level) => (
            <div key={level} className={`card p-5 ${riskColors[level]}`}>
              <p className="text-2xl font-bold font-mono">{deal.risk_summary[level] || 0}</p>
              <p className="text-[11px] font-mono uppercase tracking-wide mt-1 opacity-70">
                {level} Risk
              </p>
            </div>
          ))}
        </motion.div>

        {/* Risk Distribution */}
        {totalRisk > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5 mb-8"
          >
            <h3 className="text-[11px] font-mono uppercase tracking-wide text-ink-400 mb-3">
              Aggregate Risk Distribution
            </h3>
            <div className="flex h-3 rounded-full overflow-hidden bg-ink-800/50">
              {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => {
                const count = deal.risk_summary[level] || 0
                const pct = totalRisk > 0 ? (count / totalRisk) * 100 : 0
                if (pct === 0) return null
                const bg = level === 'critical' ? 'bg-red-500' :
                           level === 'high' ? 'bg-orange-500' :
                           level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                return <div key={level} className={bg} style={{ width: `${pct}%` }} title={`${level}: ${count}`} />
              })}
            </div>
            <div className="flex items-center gap-4 mt-2">
              {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map((level) => (
                <span key={level} className={`text-[11px] font-mono ${riskColors[level].split(' ')[0]}`}>
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
          className="card overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-ink-800/50 bg-ink-925">
            <h2 className="font-display text-lg font-semibold text-ink-50">Documents in Deal</h2>
          </div>
          {deal.documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-ink-700 mx-auto" />
              <p className="mt-4 text-ink-500 text-sm">No documents in this deal yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-ink-800/30">
              {deal.documents.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-ink-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="mt-0.5">
                      {doc.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : doc.status === 'failed' ? (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-ink-100 font-medium truncate">{doc.filename}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {doc.page_count && (
                          <span className="text-[11px] text-ink-500 font-mono">{doc.page_count} pages</span>
                        )}
                        {doc.clause_count > 0 && (
                          <span className="text-[11px] text-ink-500 font-mono">{doc.clause_count} clauses</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/documents/${doc.id}`)}
                      className="p-2 text-ink-400 hover:text-accent transition-colors"
                      title="View document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      className="p-2 text-ink-400 hover:text-red-400 transition-colors"
                      title="Remove from deal"
                    >
                      <Trash2 className="w-4 h-4" />
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddDocs(false) }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="card p-6 w-full max-w-lg max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-ink-100">Add Documents</h2>
                <button onClick={() => setShowAddDocs(false)} className="p-1 text-ink-500 hover:text-ink-300">
                  <span className="sr-only">Close</span>
                  &times;
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 mb-4">
                {allDocs.filter(d => !deal.documents.some(dd => dd.id === d.id)).map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-800/50 cursor-pointer transition-colors"
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
                      className="rounded border-ink-700 bg-ink-900 text-accent focus:ring-accent/30"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-ink-200 truncate">{doc.filename}</p>
                      <p className="text-[11px] text-ink-500 font-mono">{doc.status}</p>
                    </div>
                  </label>
                ))}
                {allDocs.filter(d => !deal.documents.some(dd => dd.id === d.id)).length === 0 && (
                  <p className="text-sm text-ink-500 text-center py-4">All documents are already in this deal.</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddDocuments}
                disabled={adding || selectedDocs.size === 0}
                className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Add {selectedDocs.size} Document{selectedDocs.size !== 1 ? 's' : ''}
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
