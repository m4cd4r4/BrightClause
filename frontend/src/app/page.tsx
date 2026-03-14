'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield, ArrowRight, FileText, Search, Zap, Network,
  Database, Brain, Eye, BarChart3, Lock, Layers,
  CheckCircle, ChevronRight, ExternalLink,
  MessageCircle, Lightbulb, ClipboardCheck, Calendar,
  Briefcase, Sun, Activity, Play, Server
} from 'lucide-react'
import { HeroVisual } from './hero-visual'

const HeroVideoPlayer = lazy(() =>
  import('@/components/HeroVideoPlayer').then(m => ({ default: m.HeroVideoPlayer }))
)

const ScreenshotShowcase = lazy(() =>
  import('@/components/ScreenshotShowcase').then(m => ({ default: m.ScreenshotShowcase }))
)

const features: { Icon: React.ElementType; title: string; description: string }[] = [
  {
    Icon: MessageCircle,
    title: 'Chat with Your Contract',
    description: 'Ask questions in plain English. RAG-powered Q&A retrieves relevant clauses and generates contextual answers with source citations.',
  },
  {
    Icon: Zap,
    title: 'AI Clause Extraction',
    description: '16+ clause types automatically identified and classified: termination, indemnification, IP, non-compete, and more.',
  },
  {
    Icon: Shield,
    title: 'Risk Assessment',
    description: 'Each clause scored Critical / High / Medium / Low with specific risk factors and AI-generated summaries.',
  },
  {
    Icon: Lightbulb,
    title: 'Plain-English Translator',
    description: 'One click to translate any legal clause into simple language anyone can understand. No law degree required.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Obligation Tracker',
    description: 'AI extracts obligations, responsible parties, and deadlines from clauses. Track status as pending, completed, or overdue.',
  },
  {
    Icon: BarChart3,
    title: 'Executive Reports',
    description: 'AI-generated executive summaries with risk overview, key clauses, and actionable recommendations. Export as PDF.',
  },
  {
    Icon: Calendar,
    title: 'Timeline Extraction',
    description: 'Automatically extracts key dates — effective, expiration, renewal, payment — and displays them on an interactive timeline.',
  },
  {
    Icon: Briefcase,
    title: 'Deal Grouping',
    description: 'Group related contracts into deals for aggregate risk analysis, batch uploads, and portfolio-level insights.',
  },
  {
    Icon: Network,
    title: 'Knowledge Graph',
    description: 'Entity extraction and relationship mapping. Visualize parties, dates, amounts, and obligations as an interactive graph.',
  },
  {
    Icon: Search,
    title: 'Hybrid Vector Search',
    description: 'Semantic + keyword search powered by pgvector embeddings. Find relevant clauses using natural language.',
  },
  {
    Icon: FileText,
    title: 'PDF Viewer & Export',
    description: 'In-app PDF viewing with clause navigation. Export analysis as PDF, Excel, Word, CSV, or JSON.',
  },
  {
    Icon: Sun,
    title: 'Dark & Light Mode',
    description: 'Full theme toggle with persistent preferences. Professional interface that adapts to your working environment.',
  },
]

const clauseTypes = [
  'Termination', 'Indemnification', 'Limitation of Liability', 'Confidentiality',
  'Non-Compete', 'Intellectual Property', 'Change of Control', 'Assignment',
  'Governing Law', 'Dispute Resolution', 'Warranty', 'Force Majeure',
  'Payment Terms', 'Insurance', 'Audit Rights', 'Data Privacy',
]

const trustSignals = [
  {
    Icon: Lock,
    title: 'Your Data Stays Yours',
    description: 'Contracts are processed server-side and never shared with third parties. Encrypted at rest and in transit.',
    statTarget: 0,
    statSuffix: '',
    statPrefix: '',
    statLabel: 'zero data sharing',
    statDisplay: 'Zero',
  },
  {
    Icon: Shield,
    title: 'AI You Can Verify',
    description: 'Every extracted clause includes a confidence score and source reference so your team can verify before acting.',
    statTarget: 16,
    statSuffix: '+',
    statPrefix: '',
    statLabel: 'clause types',
  },
  {
    Icon: Zap,
    title: 'Seconds, Not Hours',
    description: 'Upload a contract and get clause extraction, risk scores, and actionable insights in seconds — not days of manual review.',
    statTarget: 2,
    statPrefix: '< ',
    statSuffix: 's',
    statLabel: 'per document',
  },
  {
    Icon: Eye,
    title: 'Complete Audit Trail',
    description: 'Every upload, analysis, and export is logged with timestamps and full traceability for compliance and governance.',
    statTarget: 100,
    statSuffix: '%',
    statLabel: 'coverage',
  },
]

function useCountUp(target: number, inView: boolean, duration = 1.2) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setValue(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])
  return value
}

function TrustCard({ signal, index }: { signal: typeof trustSignals[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const count = useCountUp(signal.statTarget, isInView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="p-6 bg-ink-900/30 border border-ink-800/40 rounded-xl group hover:border-accent/30 transition-all"
    >
      <motion.div
        className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors"
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 }}
      >
        <signal.Icon className="w-5 h-5" />
      </motion.div>
      <div className="mb-3">
        <span className="font-display text-2xl font-bold text-accent tabular-nums">
          {signal.statPrefix ?? ''}{signal.statDisplay ?? count}{signal.statSuffix}
        </span>
        <span className="text-xs text-ink-500 ml-2 font-mono uppercase tracking-wider">
          {signal.statLabel}
        </span>
      </div>
      <h3 className="font-display text-base font-semibold text-ink-100 mb-2">{signal.title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{signal.description}</p>
    </motion.div>
  )
}

export default function LandingPage() {
  const [showHeroVideo, setShowHeroVideo] = useState(false)
  const [heroVideoDismissed, setHeroVideoDismissed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowHeroVideo(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main id="main-content" className="min-h-screen light-editorial">
      {/* Navigation */}
      <nav aria-label="Landing navigation" className="fixed top-0 left-0 right-0 z-50 border-b border-ink-800/40 bg-ink-950/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-minimal.png" alt="BrightClause" width={36} height={36} className="object-contain" />
            <span className="font-display text-xl font-bold tracking-tight text-ink-100">BrightClause</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-[#1a1a2e] font-semibold rounded-xl
                       hover:brightness-110 hover:shadow-lg hover:shadow-accent/20 transition-all text-sm"
            >
              Try It Live
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-ink-50">
              Read Every Clause.{' '}
              <span className="block mt-1">Miss Nothing.</span>
            </h1>

            <p className="text-lg sm:text-xl text-ink-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              Upload contracts and chat with them in plain English. AI extracts clauses,
              scores risk, tracks obligations, and generates executive reports.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 px-8 py-4 bg-accent text-[#1a1a2e] rounded-xl font-semibold text-lg
                         hover:brightness-110 hover:shadow-xl hover:shadow-accent/20 transition-all hover:scale-[1.02]"
              >
                Try It Live
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {heroVideoDismissed && (
                <button
                  onClick={() => { setHeroVideoDismissed(false); setShowHeroVideo(true) }}
                  className="group flex items-center gap-3 px-8 py-4 bg-ink-900 border border-ink-700 rounded-xl font-semibold text-lg
                           text-ink-200 hover:bg-ink-800 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                    <Play className="w-4 h-4 text-accent ml-0.5" />
                  </div>
                  Watch Demo
                </button>
              )}
            </div>
          </motion.div>

          {/* Hero visual / video dissolve — dark frame for product preview */}
          <div className="relative mt-16 max-w-5xl mx-auto grid theme-dark-frame" style={{ gridTemplate: '1fr / 1fr' }}>
            <div style={{ gridArea: '1 / 1' }}>
              <HeroVisual />
            </div>

            <AnimatePresence>
              {showHeroVideo && !heroVideoDismissed && (
                <motion.div
                  key="video"
                  style={{ gridArea: '1 / 1' }}
                  className="z-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Suspense fallback={null}>
                    <HeroVideoPlayer
                      onDismiss={() => { setHeroVideoDismissed(true); setShowHeroVideo(false) }}
                    />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Screenshot Showcase (lazy — below fold) */}
      <Suspense fallback={<div className="py-24" />}>
        <ScreenshotShowcase />
      </Suspense>

      {/* How It Works */}
      <section className="py-20 border-t border-ink-800/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              End-to-end pipeline from PDF upload to actionable insights in six stages
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden lg:block absolute top-[2.25rem] left-[calc(8.333%+2rem)] right-[calc(8.333%+2rem)] h-px">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
                className="h-full origin-left bg-gradient-to-r from-accent/40 via-accent/20 to-accent/40"
              />
              {[0, 0.8, 1.6].map((dotDelay, di) => (
                <motion.div
                  key={di}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent"
                  style={{ boxShadow: '0 0 6px rgba(201,162,39,0.6)' }}
                  initial={{ left: '0%', opacity: 0 }}
                  whileInView={{ left: ['0%', '100%'], opacity: [0, 0.8, 0.8, 0.8, 0] }}
                  viewport={{ once: false }}
                  transition={{ delay: 1.2 + dotDelay, duration: 2.5, ease: 'linear', repeat: Infinity, repeatDelay: 2 + dotDelay * 0.3 }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-10">
              {[
                { title: 'Upload', desc: 'PDF ingestion & storage', Icon: FileText },
                { title: 'Extract', desc: '4-tier OCR pipeline', Icon: Layers },
                { title: 'Embed', desc: 'Vector embeddings', Icon: Database },
                { title: 'Analyze', desc: 'Clauses, risk, entities', Icon: Brain },
                { title: 'Chat', desc: 'RAG-powered Q&A', Icon: MessageCircle },
                { title: 'Act', desc: 'Reports & obligations', Icon: Eye },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-5">
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-accent/40"
                      initial={{ scale: 1, opacity: 0 }}
                      whileInView={{ scale: [1, 1.35], opacity: [0, 0.4, 0] }}
                      viewport={{ once: true }}
                      transition={{ delay: 1.4 + i * 0.4, duration: 0.6, ease: 'easeOut' }}
                    />
                    <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-ink-900 border border-ink-700/80 flex items-center justify-center text-accent
                                    group-hover:border-accent/50 group-hover:bg-accent/10 group-hover:shadow-lg group-hover:shadow-accent/10 transition-all duration-300">
                      <item.Icon className="w-6 h-6" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ink-950 border border-accent/40 flex items-center justify-center">
                      <span className="text-[9px] font-mono text-accent font-bold leading-none">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  </div>
                  <h3 className="font-display text-sm font-semibold text-ink-100 mb-1">{item.title}</h3>
                  <p className="text-xs text-ink-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features — Bento Layout */}
      <section className="py-28 border-t border-ink-800/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Key Features</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              Enterprise-grade contract analysis capabilities built from scratch
            </p>
          </motion.div>

          {/* Hero feature + 2 supporting features in bento layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-5">
            {/* Primary feature — large card spanning 3 cols */}
            {(() => {
              const primary = features[0]
              const PrimaryIcon = primary.Icon
              return (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="md:col-span-3 relative p-8 lg:p-10 bg-ink-900/50 border border-ink-700/60 rounded-2xl group overflow-hidden hover:border-accent/40 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                      <PrimaryIcon className="w-7 h-7" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-3 text-ink-50">{primary.title}</h3>
                    <p className="text-ink-400 leading-relaxed text-base max-w-md">{primary.description}</p>
                  </div>
                </motion.div>
              )
            })()}

            {/* Two supporting features stacked */}
            <div className="md:col-span-2 flex flex-col gap-5">
              {features.slice(1, 3).map((feature, i) => {
                const FeatureIcon = feature.Icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i + 1) * 0.1 }}
                    className="flex-1 relative p-6 bg-ink-900/50 border border-ink-700/60 rounded-2xl group overflow-hidden hover:border-accent/40 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                        <FeatureIcon className="w-5 h-5" />
                      </div>
                      <h3 className="font-display text-lg font-semibold mb-2 text-ink-50">{feature.title}</h3>
                      <p className="text-ink-400 leading-relaxed text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Remaining 9 features — compact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.slice(3).map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 p-5 bg-ink-900/20 border border-ink-800/40 rounded-xl hover:border-accent/20 hover:bg-ink-900/40 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                  <feature.Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-semibold text-ink-100 mb-1">{feature.title}</h3>
                  <p className="text-xs text-ink-500 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clause Types — light break section */}
      <section className="py-16 border-t border-ink-800/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">16+ Clause Types</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              AI identifies and classifies clause types across commercial contracts
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
          >
            {clauseTypes.map((type, i) => (
              <motion.span
                key={type}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="px-4 py-2 bg-ink-900/50 border border-ink-800/50 rounded-lg text-sm text-ink-300
                         hover:border-accent/30 hover:text-accent transition-all cursor-default"
              >
                {type}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Built for Trust — replaces raw Tech Stack */}
      <section className="py-24 border-t border-ink-800/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Built for Trust</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              Security and accuracy your legal team can rely on
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {trustSignals.map((signal, i) => (
              <TrustCard key={i} signal={signal} index={i} />
            ))}
          </div>

        </div>
      </section>

      {/* Architecture — dramatic section */}
      <section className="py-28 border-t border-ink-800/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                Production-Grade Architecture
              </h2>
              <div className="space-y-4">
                {[
                  { icon: <MessageCircle className="w-5 h-5" />, title: 'Ask Questions in Plain English', desc: 'AI chat grounded in your actual contract text — every answer cites specific clauses and page numbers' },
                  { icon: <Database className="w-5 h-5" />, title: 'Non-Blocking Analysis', desc: 'Upload multiple contracts and keep working — extraction, embedding, and risk scoring happen in the background' },
                  { icon: <Activity className="w-5 h-5" />, title: 'Full Audit Trail', desc: 'Every upload, analysis, and export logged with timestamps for compliance and governance requirements' },
                  { icon: <Lock className="w-5 h-5" />, title: 'Secure by Design', desc: 'Server-side processing with encrypted data at rest and in transit. Your contracts are never exposed to the client' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink-100 mb-1">{item.title}</h3>
                      <p className="text-sm text-ink-500">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Architecture diagram — dark frame for contrast */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-ink-800/50 overflow-hidden theme-dark-frame relative"
            >
              {([
                {
                  label: 'Presentation',
                  bar: 'bg-blue-400',
                  items: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
                },
                {
                  label: 'API Gateway',
                  bar: 'bg-amber-500',
                  items: ['FastAPI', '8 Routers', 'Server Proxy', 'Pydantic'],
                },
                {
                  label: 'Processing',
                  bar: 'bg-purple-400',
                  items: ['Celery Workers', 'RAG Pipeline', 'Tesseract OCR', 'Clause Extraction'],
                },
                {
                  label: 'Storage',
                  bar: 'bg-emerald-400',
                  items: ['PostgreSQL 16', 'pgvector', 'Redis 7', 'MinIO S3'],
                },
                {
                  label: 'AI',
                  bar: 'bg-orange-400',
                  items: ['Ollama', 'llama3.2', 'Nomic Embeddings', 'Vector Search'],
                },
              ] as const).map((tier, i, arr) => (
                <div key={tier.label}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center bg-ink-900/50 hover:bg-ink-900/70 transition-colors"
                  >
                    <div className={`w-0.5 self-stretch ${tier.bar} opacity-70`} />
                    <div className="flex-1 px-5 py-3 flex items-center gap-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.12em] w-[5.5rem] shrink-0 text-ink-500">
                        {tier.label}
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {tier.items.map((item, j) => (
                          <span
                            key={item}
                            className={`px-2.5 py-0.5 rounded text-xs border ${
                              j === 0
                                ? 'bg-ink-800 border-ink-600/60 text-ink-200'
                                : 'bg-ink-900/60 border-ink-800/60 text-ink-500'
                            }`}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <div className="flex items-center px-[1.15rem] py-0.5 bg-ink-950/60">
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="ml-[5.75rem]">
                        <motion.path
                          d="M5 0v8M1 5l4 5 4-5"
                          stroke="#c9a227"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: 0.25 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.15 + 0.3, duration: 0.4, ease: 'easeOut' }}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              <motion.div
                className="absolute left-[calc(1.15rem+5.75rem+5px)] w-1.5 h-1.5 rounded-full bg-accent pointer-events-none z-10"
                style={{ boxShadow: '0 0 6px rgba(201,162,39,0.5)' }}
                initial={{ top: 0, opacity: 0 }}
                whileInView={{ top: ['0%', '20%', '40%', '60%', '80%', '100%'], opacity: [0, 0.7, 0.7, 0.7, 0.7, 0] }}
                viewport={{ once: false }}
                transition={{ delay: 1.2, duration: 3, ease: 'linear', repeat: Infinity, repeatDelay: 1.5 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-ink-800/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mx-auto mb-8 w-fit">
              <Image src="/logo-minimal.png" alt="BrightClause" width={64} height={64} className="object-contain" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Upload Your First Contract
            </h2>
            <p className="text-ink-400 text-lg mb-10 max-w-lg mx-auto">
              See clause extraction, risk scoring, obligation tracking, and knowledge graph visualization in action.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 px-8 py-4 bg-accent text-[#1a1a2e] rounded-xl font-semibold text-lg
                         hover:brightness-110 hover:shadow-xl hover:shadow-accent/20 transition-all hover:scale-[1.02]"
              >
                Try It Live
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800/30 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ink-500 text-sm">
            <Image src="/logo-minimal.png" alt="BrightClause" width={20} height={20} className="object-contain" />
            <span>BrightClause</span>
            <span className="text-ink-700">&middot;</span>
            <span>Built by Macdara</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-500">
            <Link href="/dashboard" className="hover:text-ink-300 transition-colors">Dashboard</Link>
            <Link href="/analytics" className="hover:text-ink-300 transition-colors">Analytics</Link>
            <Link href="/search" className="hover:text-ink-300 transition-colors">Search</Link>
            <Link href="/compare" className="hover:text-ink-300 transition-colors">Compare</Link>
            <Link href="/obligations" className="hover:text-ink-300 transition-colors">Obligations</Link>
            <Link href="/deals" className="hover:text-ink-300 transition-colors">Deals</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}
