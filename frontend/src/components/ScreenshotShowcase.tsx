'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const SCREENS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    src: '/assets/screenshot-dashboard.png',
    desc: 'Your entire contract portfolio at a glance — documents indexed, clauses extracted, and recent activity in one view.',
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

  const next = useCallback(() => {
    setActive(i => (i + 1) % SCREENS.length)
    setProgress(0)
  }, [])

  // Auto-advance with smooth progress bar
  useEffect(() => {
    if (paused) return
    const interval = 50 // tick every 50ms
    const step = (interval / AUTOPLAY_MS) * 100
    const ticker = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          next()
          return 0
        }
        return p + step
      })
    }, interval)
    return () => clearInterval(ticker)
  }, [paused, next])

  return (
    <section className="py-24 border-t border-ink-800/50">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-ink-400 max-w-xl mx-auto">
            Real contract data. No mocks. Click any tab to explore.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Tab navigation */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {SCREENS.map((screen, i) => (
              <button
                key={screen.id}
                onClick={() => { setActive(i); setProgress(0) }}
                className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 overflow-hidden
                  ${active === i
                    ? 'bg-accent/15 text-accent border border-accent/40'
                    : 'text-ink-500 hover:text-ink-300 border border-transparent hover:border-ink-700/50'
                  }`}
              >
                {screen.label}
                {/* Progress fill on active tab */}
                {active === i && (
                  <span
                    className="absolute inset-0 bg-accent/10 origin-left rounded-lg pointer-events-none"
                    style={{ transform: `scaleX(${progress / 100})` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Browser chrome + screenshot */}
          <div className="rounded-2xl overflow-hidden border border-ink-700/40 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(201,162,39,0.04)]"
            style={{ backgroundColor: '#080d18' }}>
            {/* Chrome bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800/50 bg-ink-900/70">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-ink-800/50 rounded-md text-[10px] text-ink-500 font-mono">
                  brightclause.com/{SCREENS[active].id === 'dashboard' ? '' : SCREENS[active].id}
                </div>
              </div>
              <div className="w-14" />
            </div>

            {/* Screenshot */}
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
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
            <div className="px-5 py-3 border-t border-ink-800/40 bg-ink-900/60">
              <AnimatePresence mode="wait">
                <motion.p
                  key={active}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-xs text-ink-400 leading-relaxed"
                >
                  <span className="text-accent font-semibold mr-2">{SCREENS[active].label}.</span>
                  {SCREENS[active].desc}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
