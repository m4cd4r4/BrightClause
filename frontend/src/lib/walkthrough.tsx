'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

interface WalkthroughStep {
  target: string
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    target: '[data-tour="stats"]',
    title: 'Portfolio Overview',
    description: 'Real-time statistics showing your indexed documents, text chunks with vector embeddings, extracted clauses, and documents ready for review.',
    position: 'bottom',
  },
  {
    target: '[data-tour="search"]',
    title: 'Semantic Search',
    description: 'Search across all contracts using natural language. Our hybrid search combines AI semantic understanding with keyword matching for precise results.',
    position: 'bottom',
  },
  {
    target: '[data-tour="upload"]',
    title: 'Upload Contracts',
    description: 'Upload PDF contracts for automated processing. Documents are parsed, chunked, embedded, and analyzed by our AI pipeline.',
    position: 'bottom',
  },
  {
    target: '[data-tour="documents"]',
    title: 'Contract Portfolio',
    description: 'Click any document to view its AI risk assessment. Each contract is analyzed for clause types, risk levels, and key provisions.',
    position: 'right',
  },
  {
    target: '[data-tour="analysis"]',
    title: 'Risk Assessment Panel',
    description: 'AI-powered analysis shows overall risk, risk distribution, and highlights clauses that need attention. Click "View Full Analysis" for detailed clause-by-clause review.',
    position: 'left',
  },
]

const STORAGE_KEY = 'bc_walkthrough_seen'

export function useWalkthrough() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      const timer = setTimeout(() => setActive(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = useCallback(() => {
    setActive(false)
    localStorage.setItem(STORAGE_KEY, 'true')
  }, [])

  const next = useCallback(() => {
    if (step < WALKTHROUGH_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }, [step, dismiss])

  const prev = useCallback(() => {
    if (step > 0) setStep(s => s - 1)
  }, [step])

  const restart = useCallback(() => {
    setStep(0)
    setActive(true)
  }, [])

  return { active, step, currentStep: WALKTHROUGH_STEPS[step], next, prev, dismiss, restart, totalSteps: WALKTHROUGH_STEPS.length }
}

export function WalkthroughOverlay({
  active,
  step,
  currentStep,
  totalSteps,
  next,
  prev,
  dismiss,
}: {
  active: boolean
  step: number
  currentStep: WalkthroughStep | undefined
  totalSteps: number
  next: () => void
  prev: () => void
  dismiss: () => void
}) {
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!active || !currentStep) return

    const el = document.querySelector(currentStep.target)
    if (!el) {
      // If target not found, skip to next step
      next()
      return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const updatePosition = () => {
      const rect = el.getBoundingClientRect()
      const pos = currentStep.position || 'bottom'
      const style: React.CSSProperties = { position: 'fixed', zIndex: 9999 }

      switch (pos) {
        case 'bottom':
          style.top = rect.bottom + 12
          style.left = Math.max(16, Math.min(rect.left, window.innerWidth - 380))
          break
        case 'top':
          style.bottom = window.innerHeight - rect.top + 12
          style.left = Math.max(16, Math.min(rect.left, window.innerWidth - 380))
          break
        case 'left':
          style.top = rect.top
          style.right = window.innerWidth - rect.left + 12
          break
        case 'right':
          style.top = rect.top
          style.left = rect.right + 12
          break
      }

      setTooltipStyle(style)
    }

    // Small delay to allow scroll to complete
    const timer = setTimeout(updatePosition, 300)
    window.addEventListener('resize', updatePosition)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updatePosition)
    }
  }, [active, step, currentStep, next])

  if (!active || !currentStep) return null

  const isLastStep = step === totalSteps - 1

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[9998]"
        onClick={dismiss}
      />

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={tooltipStyle}
          className="w-[360px] bg-ink-900 border border-ink-700/80 rounded-xl shadow-2xl shadow-black/40 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-ink-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-mono text-ink-500 uppercase tracking-wide">
                Step {step + 1} of {totalSteps}
              </span>
            </div>
            <button
              onClick={dismiss}
              className="p-1 hover:bg-ink-800 rounded-lg transition-colors"
              aria-label="Close walkthrough"
            >
              <X className="w-4 h-4 text-ink-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4">
            <h3 className="font-display text-lg font-semibold text-ink-50 mb-2">
              {currentStep.title}
            </h3>
            <p className="text-sm text-ink-400 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-5">
            <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 py-4 flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-sm text-ink-500 hover:text-ink-300 transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-ink-300 hover:text-ink-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="flex items-center gap-1 px-4 py-1.5 bg-accent text-ink-950 font-medium text-sm rounded-lg
                         hover:bg-accent-light transition-colors"
              >
                {isLastStep ? 'Get Started' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

export function WalkthroughButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-ink-400 hover:text-accent
               bg-ink-900/50 border border-ink-800/50 rounded-lg hover:border-accent/30 transition-all"
      title="Restart guided tour"
    >
      <Sparkles className="w-4 h-4" />
      <span className="hidden sm:inline">Tour</span>
    </button>
  )
}
