'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Briefcase, Plus, FileText, ChevronRight, Loader2, X,
  AlertTriangle, ClipboardCheck, GitCompareArrows
} from 'lucide-react'
import { api, DealItem } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { V3Shell } from '@/components/v3/shell'
import { PageHeader } from '@/components/v3/primitives'

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
    <V3Shell>
      <PageHeader
        crumb="Workspace"
        title="Deals"
        subtitle="Group related contracts into deals for aggregate analysis"
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="v3-btn v3-btn-primary"
          >
            <Plus size={14} />
            New Deal
          </button>
        }
      />

      {/* Create Deal Modal */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', padding: 16 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false) }}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="v3-card"
            style={{ padding: 24, width: '100%', maxWidth: 448, background: 'var(--v3-popover)', boxShadow: 'var(--v3-shadow-md)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>Create New Deal</h2>
              <button onClick={() => setShowCreate(false)} style={{ display: 'flex', padding: 4, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--v3-text-muted)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Deal name (e.g., Acme Corp Acquisition)"
                style={{
                  width: '100%', height: 38, padding: '0 12px',
                  background: 'var(--v3-card)', border: '1px solid var(--v3-border)',
                  borderRadius: 'var(--v3-radius-md)', fontSize: 13,
                  color: 'var(--v3-text-primary)', outline: 'none', fontFamily: 'inherit',
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                style={{
                  width: '100%', minHeight: 80, padding: '8px 12px', resize: 'none',
                  background: 'var(--v3-card)', border: '1px solid var(--v3-border)',
                  borderRadius: 'var(--v3-radius-md)', fontSize: 13,
                  color: 'var(--v3-text-primary)', outline: 'none', fontFamily: 'inherit',
                }}
                rows={3}
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="v3-btn v3-btn-primary"
                style={{ width: '100%', height: 38, justifyContent: 'center', opacity: creating || !newName.trim() ? 0.5 : 1 }}
              >
                {creating && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                Create Deal
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Deals Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="v3-card" style={{ padding: 24 }}>
              <div style={{ height: 24, width: 160, background: 'var(--v3-card-hover)', borderRadius: 4, marginBottom: 12 }} />
              <div style={{ height: 16, width: '100%', background: 'var(--v3-card-hover)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 16, width: 96, background: 'var(--v3-card-hover)', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      ) : deals.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="v3-card" style={{ padding: 56 }}>
          <div style={{ maxWidth: 448, margin: '0 auto', textAlign: 'center' }}>
            <Briefcase size={40} color="var(--v3-text-disabled)" style={{ margin: '0 auto', display: 'block' }} />
            <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 16, color: 'var(--v3-text-primary)' }}>Organize by Deal</h2>
            <p style={{ color: 'var(--v3-text-muted)', marginTop: 8, fontSize: 13, lineHeight: 1.6 }}>
              Group related contracts into a single deal - an acquisition, partnership, or vendor relationship.
              Each deal gives you aggregate risk scores, obligation tracking, and clause comparison
              across all its documents.
            </p>
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }} aria-hidden="true">
              {[
                { label: 'Aggregate risk', icon: AlertTriangle },
                { label: 'Track obligations', icon: ClipboardCheck },
                { label: 'Compare clauses', icon: GitCompareArrows },
              ].map(({ label, icon: Icon }) => (
                <div key={label} style={{ padding: 10, borderRadius: 'var(--v3-radius-md)', border: '1px solid var(--v3-border)' }}>
                  <Icon size={16} color="var(--v3-text-muted)" style={{ margin: '0 auto 4px', display: 'block' }} />
                  <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', textTransform: 'uppercase', margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="v3-btn v3-btn-primary"
              style={{ marginTop: 32 }}
            >
              Create Your First Deal
            </button>
          </div>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          {deals.map((deal, i) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
            >
              <button
                type="button"
                onClick={() => router.push(`/deals/${deal.id}`)}
                className="v3-card v3-card-hover"
                style={{ padding: 24, width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', padding: 10, borderRadius: 'var(--v3-radius-md)', background: 'rgba(212,168,45,0.1)', color: 'var(--v3-accent)' }}>
                    <Briefcase size={20} />
                  </div>
                  <ChevronRight size={16} color="var(--v3-text-muted)" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--v3-text-primary)', marginTop: 0, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.name}</h3>
                {deal.description && (
                  <p style={{ fontSize: 12, color: 'var(--v3-text-muted)', marginTop: 0, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{deal.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <FileText size={14} color="var(--v3-text-muted)" />
                  <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>
                    {deal.document_count} document{deal.document_count !== 1 ? 's' : ''}
                  </span>
                </div>
                {deal.documents.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {deal.documents.slice(0, 3).map((doc) => (
                      <span key={doc.id} style={{ fontSize: 11, color: 'var(--v3-text-secondary)', background: 'var(--v3-panel)', border: '1px solid var(--v3-border)', padding: '2px 8px', borderRadius: 'var(--v3-radius-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                        {doc.filename}
                      </span>
                    ))}
                    {deal.document_count > 3 && (
                      <span style={{ fontSize: 11, color: 'var(--v3-text-muted)', padding: '2px 4px' }}>+{deal.document_count - 3} more</span>
                    )}
                  </div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </V3Shell>
  )
}
