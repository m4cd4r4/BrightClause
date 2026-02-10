'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Briefcase, Plus, FileText, ChevronRight, Loader2, X
} from 'lucide-react'
import { api, DealItem } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Navigation } from '@/lib/navigation'

export default function DealsPage() {
  const router = useRouter()
  const { error: showError, success: showSuccess } = useToast()
  const [deals, setDeals] = useState<DealItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const loadDeals = useCallback(async () => {
    try {
      const response = await api.deals.list()
      setDeals(response.deals)
    } catch {
      showError('Failed to load deals.')
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    loadDeals()
  }, [loadDeals])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await api.deals.create(newName.trim(), newDesc.trim() || undefined)
      showSuccess(`Deal "${newName.trim()}" created.`)
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
      await loadDeals()
    } catch {
      showError('Failed to create deal.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navigation />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-50">Deals</h1>
            <p className="text-sm text-ink-500 mt-1">Group related contracts into deals for aggregate analysis</p>
          </motion.div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-ink-950 font-semibold rounded-lg
                     hover:bg-accent-light transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Deal</span>
          </button>
        </div>

        {/* Create Deal Modal */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold text-ink-100">Create New Deal</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-ink-500 hover:text-ink-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Deal name (e.g., Acme Corp Acquisition)"
                  className="input"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="input min-h-[80px] resize-none"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Deal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Deals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-6">
                <div className="skeleton h-6 w-40 rounded mb-3" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center">
            <Briefcase className="w-14 h-14 text-ink-700 mx-auto" />
            <p className="mt-5 text-ink-500 text-sm">No deals yet. Create one to group related contracts.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-6 btn-primary"
            >
              Create Your First Deal
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal, i) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <button
                  type="button"
                  onClick={() => router.push(`/deals/${deal.id}`)}
                  className="card p-6 w-full text-left card-hover group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-600 group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-medium text-ink-100 text-[15px] mb-1 truncate">{deal.name}</h3>
                  {deal.description && (
                    <p className="text-xs text-ink-500 mb-3 line-clamp-2">{deal.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <FileText className="w-3.5 h-3.5 text-ink-500" />
                    <span className="text-[11px] text-ink-500 font-mono">
                      {deal.document_count} document{deal.document_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {deal.documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {deal.documents.slice(0, 3).map((doc) => (
                        <span key={doc.id} className="text-[10px] text-ink-400 bg-ink-800/50 px-2 py-0.5 rounded truncate max-w-[120px]">
                          {doc.filename}
                        </span>
                      ))}
                      {deal.document_count > 3 && (
                        <span className="text-[10px] text-ink-500 px-1">+{deal.document_count - 3} more</span>
                      )}
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
