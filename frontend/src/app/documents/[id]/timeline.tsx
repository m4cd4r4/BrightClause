'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, AlertTriangle, ChevronDown, Loader2 } from 'lucide-react'
import { api, TimelineEvent } from '@/lib/api'

const typeConfig: Record<string, { color: string; bg: string; label: string }> = {
  effective: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Effective' },
  expiration: { color: 'text-red-400', bg: 'bg-red-400', label: 'Expiration' },
  renewal: { color: 'text-amber-400', bg: 'bg-amber-400', label: 'Renewal' },
  payment: { color: 'text-blue-400', bg: 'bg-blue-400', label: 'Payment' },
  notice: { color: 'text-purple-400', bg: 'bg-purple-400', label: 'Notice' },
  execution: { color: 'text-cyan-400', bg: 'bg-cyan-400', label: 'Execution' },
  other: { color: 'text-ink-400', bg: 'bg-ink-400', label: 'Other' },
}

export function Timeline({ documentId }: { documentId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  useEffect(() => {
    api.graph.timeline(documentId)
      .then(data => setEvents(data.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [documentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-ink-500 animate-spin" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-8 h-8 text-ink-700 mx-auto" />
        <p className="text-ink-500 text-sm mt-3">No timeline events found.</p>
        <p className="text-ink-600 text-xs mt-1">Run entity extraction to detect dates.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-accent" />
        <h3 className="font-display text-sm font-semibold text-ink-200">
          Contract Timeline
        </h3>
        <span className="text-xs text-ink-500 font-mono">{events.length} events</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(typeConfig)
          .filter(([type]) => events.some(e => e.type === type))
          .map(([type, config]) => (
            <span key={type} className="flex items-center gap-1.5 text-[11px] text-ink-400">
              <span className={`w-2 h-2 rounded-full ${config.bg}`} />
              {config.label}
            </span>
          ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-ink-800" />

        {events.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.other
          const isExpanded = expandedEvent === event.id

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative mb-3"
            >
              {/* Dot */}
              <div className={`absolute left-[-18px] top-2.5 w-3 h-3 rounded-full border-2 border-ink-950 ${config.bg}`} />

              {/* Event card */}
              <button
                onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                className="w-full text-left p-3 rounded-lg bg-ink-900/30 hover:bg-ink-900/50 transition-colors border border-ink-800/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      {event.importance === 'high' && (
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                      )}
                      {event.page_number != null && (
                        <span className="text-[11px] text-ink-600 font-mono">p.{event.page_number}</span>
                      )}
                    </div>
                    <p className="text-sm text-ink-200 mt-0.5 font-medium truncate">
                      {event.label}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5 font-mono">
                      {event.date}
                    </p>
                  </div>
                  {event.context && (
                    <ChevronDown className={`w-3.5 h-3.5 text-ink-600 flex-shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`} />
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && event.context && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <p className="text-xs text-ink-400 mt-2 pt-2 border-t border-ink-800/30 leading-relaxed">
                        {event.context}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
