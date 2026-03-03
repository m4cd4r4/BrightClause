'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ClipboardCheck, Clock, AlertTriangle, CheckCircle, FileText,
  Filter, Loader2, CreditCard, Truck, Bell, ShieldCheck,
  FileBarChart, ChevronDown, ExternalLink
} from 'lucide-react'
import { api, ObligationItem } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { Navigation } from '@/lib/navigation'

type ObligationWithDoc = ObligationItem & { document_id: string; filename: string }

const typeConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  payment: { icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Payment' },
  delivery: { icon: Truck, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Delivery' },
  notification: { icon: Bell, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Notification' },
  compliance: { icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Compliance' },
  reporting: { icon: FileBarChart, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Reporting' },
  general: { icon: ClipboardCheck, color: 'text-ink-400', bg: 'bg-ink-800/50', label: 'General' },
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Pending' },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Completed' },
  overdue: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Overdue' },
}

export default function ObligationsPage() {
  const router = useRouter()
  const { error: showError } = useToast()
  const [obligations, setObligations] = useState<ObligationWithDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const response = await api.obligations.all({
        status: filterStatus || undefined,
        obligation_type: filterType || undefined,
        limit: 100,
      })
      setObligations(response.obligations)
    } catch (err) {
      console.error('Failed to load obligations:', err)
      showError('Failed to load obligations.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const grouped = obligations.reduce<Record<string, ObligationWithDoc[]>>((acc, ob) => {
    const key = `${ob.document_id}::${ob.filename}`
    if (!acc[key]) acc[key] = []
    acc[key].push(ob)
    return acc
  }, {})

  const statusCounts = {
    all: obligations.length,
    pending: obligations.filter(o => o.status === 'pending').length,
    overdue: obligations.filter(o => o.status === 'overdue').length,
    completed: obligations.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <Navigation />

      <main id="main-content" className="max-w-[1920px] mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink-50">
            Obligation Tracker
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            Deadlines, commitments, and obligations across all contracts
          </p>
        </motion.div>

        {/* Status Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6"
        >
          {[
            { key: '', label: 'All', count: statusCounts.all, color: 'text-ink-200', icon: ClipboardCheck },
            { key: 'pending', label: 'Pending', count: statusCounts.pending, color: 'text-amber-400', icon: Clock },
            { key: 'overdue', label: 'Overdue', count: statusCounts.overdue, color: 'text-red-400', icon: AlertTriangle },
            { key: 'completed', label: 'Completed', count: statusCounts.completed, color: 'text-emerald-400', icon: CheckCircle },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterStatus(item.key)}
              className={`card p-4 text-left transition-all duration-200 ${
                filterStatus === item.key
                  ? 'border-accent/40 bg-accent/5'
                  : 'hover:border-ink-700/70'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
              <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.count}</p>
              <p className="text-[11px] text-ink-500 font-mono uppercase tracking-wide mt-0.5">{item.label}</p>
            </button>
          ))}
        </motion.div>

        {/* Type Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1"
        >
          <Filter className="w-4 h-4 text-ink-500 shrink-0" />
          <button
            type="button"
            onClick={() => setFilterType('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
              filterType === '' ? 'bg-accent/20 text-accent' : 'bg-ink-800/50 text-ink-400 hover:text-ink-200'
            }`}
          >
            All Types
          </button>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                filterType === key ? `${cfg.bg} ${cfg.color}` : 'bg-ink-800/50 text-ink-400 hover:text-ink-200'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
          </div>
        ) : obligations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-12 text-center"
          >
            <ClipboardCheck className="w-14 h-14 text-ink-700 mx-auto" />
            <p className="mt-5 text-ink-500 text-sm">
              {filterStatus || filterType
                ? 'No obligations match your filters.'
                : 'No obligations extracted yet. Analyze a document to extract obligations.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([key, docObligations], gi) => {
              const [docId, filename] = key.split('::')
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: gi * 0.05 }}
                  className="card overflow-hidden"
                >
                  {/* Document Header */}
                  <div className="px-4 sm:px-6 py-4 border-b border-ink-800/50 bg-ink-925 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-medium text-ink-100 text-sm truncate">{filename}</h3>
                        <p className="text-[11px] text-ink-500 font-mono">{docObligations.length} obligations</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/documents/${docId}`)}
                      className="p-2 text-ink-400 hover:text-accent transition-colors"
                      title="View document"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Obligation List */}
                  <div className="divide-y divide-ink-800/30">
                    {docObligations.map((ob, i) => {
                      const cfg = typeConfig[ob.obligation_type] || typeConfig.general
                      const sCfg = statusConfig[ob.status] || statusConfig.pending
                      const Icon = cfg.icon
                      const isExpanded = expandedId === ob.id

                      return (
                        <motion.div
                          key={ob.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="px-4 sm:px-6 py-4 hover:bg-ink-900/30 transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : ob.id)}
                            className="w-full text-left flex items-start gap-3"
                          >
                            <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-ink-100 leading-relaxed">{ob.description}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${sCfg.bg} ${sCfg.color}`}>
                                  {sCfg.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${cfg.bg} ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {ob.due_date && (
                                  <span className="text-[11px] text-ink-400 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {ob.due_date}
                                  </span>
                                )}
                                {ob.responsible_party && (
                                  <span className="text-[11px] text-ink-400">
                                    {ob.responsible_party}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-ink-500 shrink-0 mt-1 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 ml-11 p-3 bg-ink-900/40 border border-ink-800/50 rounded-lg text-xs text-ink-400 space-y-1.5">
                                  {ob.responsible_party && (
                                    <p><span className="text-ink-500">Responsible:</span> {ob.responsible_party}</p>
                                  )}
                                  {ob.due_date && (
                                    <p><span className="text-ink-500">Due:</span> {ob.due_date}</p>
                                  )}
                                  <p><span className="text-ink-500">Type:</span> {ob.obligation_type}</p>
                                  <p><span className="text-ink-500">Extracted:</span> {new Date(ob.created_at).toLocaleDateString()}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
