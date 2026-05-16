'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, AlertTriangle, ChevronDown, Loader2 } from 'lucide-react'
import { api, TimelineEvent } from '@/lib/api'

const typeConfig: Record<string, { color: string; label: string }> = {
  effective: { color: 'var(--v3-risk-low)', label: 'Effective' },
  expiration: { color: 'var(--v3-risk-critical)', label: 'Expiration' },
  renewal: { color: 'var(--v3-risk-medium)', label: 'Renewal' },
  payment: { color: '#60a5fa', label: 'Payment' },
  notice: { color: '#a78bfa', label: 'Notice' },
  execution: { color: '#22d3ee', label: 'Execution' },
  other: { color: 'var(--v3-text-secondary)', label: 'Other' },
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0' }}>
        <Loader2 size={18} color="var(--v3-text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Calendar size={28} color="var(--v3-text-disabled)" style={{ margin: '0 auto' }} />
        <p style={{ fontSize: 13, color: 'var(--v3-text-muted)', marginTop: 10 }}>No timeline events found.</p>
        <p style={{ fontSize: 11, color: 'var(--v3-text-disabled)', marginTop: 2 }}>Run entity extraction to detect dates.</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Clock size={14} color="var(--v3-accent)" />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>
          Contract Timeline
        </h3>
        <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{events.length} events</span>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginLeft: 'auto' }}>
          {Object.entries(typeConfig)
            .filter(([type]) => events.some(e => e.type === type))
            .map(([type, config]) => (
              <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--v3-text-muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: config.color }} />
                {config.label}
              </span>
            ))}
        </div>
      </div>

      {/* Horizontal strip */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
        {events.map((event, i) => {
          const config = typeConfig[event.type] || typeConfig.other
          const isExpanded = expandedEvent === event.id

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ flexShrink: 0, width: isExpanded ? 320 : 220 }}
            >
              <button
                onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: 12,
                  borderRadius: 'var(--v3-radius-md)', background: 'var(--v3-panel)',
                  border: '1px solid var(--v3-border)', cursor: 'pointer', color: 'inherit',
                  borderTop: `2px solid ${config.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: config.color }}>
                        {config.label}
                      </span>
                      {event.importance === 'high' && (
                        <AlertTriangle size={12} color="var(--v3-risk-medium)" />
                      )}
                      {event.page_number != null && (
                        <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-disabled)' }}>p.{event.page_number}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--v3-text-primary)', marginTop: 4, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.label}
                    </p>
                    <p className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 4 }}>
                      {event.date}
                    </p>
                  </div>
                  {event.context && (
                    <ChevronDown
                      size={14}
                      color="var(--v3-text-muted)"
                      style={{ flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : undefined, transition: 'transform 150ms' }}
                    />
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && event.context && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ fontSize: 11, color: 'var(--v3-text-secondary)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--v3-border)', lineHeight: 1.6 }}>
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
