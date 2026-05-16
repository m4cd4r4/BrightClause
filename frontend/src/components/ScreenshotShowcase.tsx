'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Maximize2, Minimize2 } from 'lucide-react'

const SCREENS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    src: '/assets/screenshot-dashboard.png',
    desc: 'Your entire contract portfolio at a glance - documents indexed, clauses extracted, and recent activity in one view.',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    src: '/assets/screenshot-analytics.png',
    desc: 'Portfolio-wide risk heatmap. Every clause type scored Critical / High / Medium / Low across all contracts simultaneously.',
  },
  {
    id: 'obligations',
    label: 'Obligations',
    src: '/assets/screenshot-obligations.png',
    desc: 'AI extracts every obligation, responsible party, and deadline. Track status as pending, overdue, or completed.',
  },
  {
    id: 'compare',
    label: 'Compare',
    src: '/assets/screenshot-compare.png',
    desc: 'Side-by-side clause comparison across multiple contracts. Instantly spot coverage gaps and risk discrepancies.',
  },
  {
    id: 'search',
    label: 'Search',
    src: '/assets/screenshot-search.png',
    desc: 'Hybrid semantic + keyword search across your entire portfolio. Find relevant clauses in seconds using plain English.',
  },
] as const

const AUTOPLAY_MS = 5000

export function ScreenshotShowcase() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const next = useCallback(() => {
    setActive(i => (i + 1) % SCREENS.length)
    setProgress(0)
  }, [])

  // Auto-advance with smooth progress bar
  useEffect(() => {
    if (paused) return
    const interval = 100
    const step = (interval / AUTOPLAY_MS) * 100
    const ticker = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { next(); return 0 }
        return p + step
      })
    }, interval)
    return () => clearInterval(ticker)
  }, [paused, next])

  // Keyboard navigation: Escape to close, arrows to navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) setIsExpanded(false)
      if (e.key === 'ArrowRight') { setActive(i => (i + 1) % SCREENS.length); setProgress(0) }
      if (e.key === 'ArrowLeft') { setActive(i => (i - 1 + SCREENS.length) % SCREENS.length); setProgress(0) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isExpanded])

  // Lock body scroll in cinema mode
  useEffect(() => {
    document.body.style.overflow = isExpanded ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isExpanded])

  const tabNav = (
    <div className="flex items-center gap-2 flex-wrap">
      {SCREENS.map((screen, i) => (
        <button
          key={screen.id}
          onClick={() => { setActive(i); setProgress(0) }}
          className="relative px-4 py-1.5 text-sm font-medium transition-all duration-200 overflow-hidden"
          style={{
            borderRadius: 'var(--v3-radius-md)',
            border: '1px solid',
            borderColor: active === i ? 'rgba(212, 168, 45, 0.4)' : 'transparent',
            background: active === i ? 'rgba(212, 168, 45, 0.15)' : 'transparent',
            color: active === i ? 'var(--v3-accent)' : 'var(--v3-text-muted)',
          }}
        >
          {screen.label}
          {active === i && (
            <span
              className="absolute inset-0 origin-left pointer-events-none"
              style={{ transform: `scaleX(${progress / 100})`, background: 'rgba(212, 168, 45, 0.1)', borderRadius: 'var(--v3-radius-md)' }}
            />
          )}
        </button>
      ))}
    </div>
  )

  const showcaseCard = (
    <div
      className="overflow-hidden v3-card"
      style={{ borderRadius: 'var(--v3-radius-lg)', boxShadow: 'var(--v3-shadow-md)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Chrome bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--v3-border-hover)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--v3-border-hover)' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--v3-border-hover)' }} />
        </div>
        <div className="flex-1 flex justify-center">
          <div
            className="px-4 py-1 text-[11px] v3-mono"
            style={{ background: 'var(--v3-card)', borderRadius: 'var(--v3-radius-sm)', color: 'var(--v3-text-muted)' }}
          >
            brightclause.com/{SCREENS[active].id === 'dashboard' ? '' : SCREENS[active].id}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(v => !v)}
          className="p-1.5 transition-colors rounded"
          style={{ color: 'var(--v3-text-muted)' }}
          aria-label={isExpanded ? 'Collapse' : 'Expand to cinema mode'}
          title={isExpanded ? 'Collapse (Esc)' : 'Cinema mode'}
        >
          {isExpanded
            ? <Minimize2 className="w-3.5 h-3.5" />
            : <Maximize2 className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Screenshot — click to expand */}
      <div
        className={`relative w-full ${!isExpanded ? 'cursor-pointer' : ''}`}
        style={{ aspectRatio: '16/9' }}
        onClick={() => { if (!isExpanded) setIsExpanded(true) }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={SCREENS[active].src}
              alt={`BrightClause ${SCREENS[active].label}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1200px) 100vw, 1152px"
              priority={active === 0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Caption bar */}
      <div
        className="px-5 py-3"
        style={{ borderTop: '1px solid var(--v3-border)', background: 'var(--v3-panel)' }}
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={active}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-xs leading-relaxed"
            style={{ color: 'var(--v3-text-secondary)' }}
          >
            <span style={{ color: 'var(--v3-accent)', fontWeight: 600, marginRight: 8 }}>{SCREENS[active].label}.</span>
            {SCREENS[active].desc}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <section style={{ padding: '96px 0', borderTop: '1px solid var(--v3-border)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
          style={{ marginBottom: 48 }}
        >
          <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 16, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
            See It In Action
          </h2>
          <p style={{ color: 'var(--v3-text-secondary)', maxWidth: 576, margin: '0 auto' }}>
            Real contract data. No mocks. Click any tab to explore.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {tabNav}
          {/* Keep in DOM to preserve layout height; hidden while cinema is open */}
          <div className="mt-4" style={{ visibility: isExpanded ? 'hidden' : 'visible' }}>
            {showcaseCard}
          </div>
        </motion.div>
      </div>

      {/* Cinema mode overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop — click anywhere on it to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.85)' }}
              onClick={() => setIsExpanded(false)}
            />
            {/* Cinema content — pointer-events-none on wrapper so backdrop click works in padding */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
              <div
                className="flex flex-col gap-3 w-full pointer-events-auto"
                style={{ maxWidth: 'calc((88vh - 80px) * 16 / 9)', maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
              >
                {tabNav}
                {showcaseCard}
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
