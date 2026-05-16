'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield, ArrowRight, FileText, Search, Zap, Network,
  Database, Brain, Eye, BarChart3, Lock, Layers,
  MessageCircle, Lightbulb, ClipboardCheck, Calendar,
  Briefcase, Sun, Activity, Play,
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
    description: 'Automatically extracts key dates - effective, expiration, renewal, payment - and displays them on an interactive timeline.',
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
    description: 'Upload a contract and get clause extraction, risk scores, and actionable insights in seconds - not days of manual review.',
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
  const reduce = useReducedMotion()

  return (
    <motion.div
      ref={ref}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: reduce ? 0 : index * 0.1 }}
      className="v3-card v3-card-hover"
      style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 12 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 'var(--v3-radius-md)', flexShrink: 0,
            background: 'rgba(212, 168, 45, 0.1)', color: 'var(--v3-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <signal.Icon style={{ width: 20, height: 20 }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--v3-text-primary)', margin: 0 }}>{signal.title}</h3>
          <span
            className="v3-mono"
            style={{
              display: 'inline-block', marginTop: 6, fontSize: 12, color: 'var(--v3-accent)',
              background: 'rgba(212, 168, 45, 0.1)', padding: '2px 6px', borderRadius: 'var(--v3-radius-sm)',
            }}
          >
            {signal.statPrefix ?? ''}{signal.statDisplay ?? count}{signal.statSuffix} {signal.statLabel}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'var(--v3-text-secondary)', lineHeight: 1.6, margin: 0 }}>{signal.description}</p>
    </motion.div>
  )
}

const sectionStyle: React.CSSProperties = {
  borderTop: '1px solid var(--v3-border)',
}

export default function LandingPage() {
  const [showHeroVideo, setShowHeroVideo] = useState(false)
  const [heroVideoDismissed, setHeroVideoDismissed] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const timer = setTimeout(() => setShowHeroVideo(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // One restrained reveal pattern reused across sections; instant when reduced motion is requested.
  const reveal = (delay = 0) => ({
    initial: reduce ? (false as const) : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { delay: reduce ? 0 : delay },
  })

  return (
    <main id="main-content" className="v3" style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <nav
        aria-label="Landing navigation"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--v3-panel)', borderBottom: '1px solid var(--v3-border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/logo-minimal.png" alt="BrightClause" width={32} height={32} style={{ objectFit: 'contain' }} priority />
            <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--v3-text-primary)' }}>BrightClause</span>
          </div>
          <Link
            href="/dashboard"
            className="v3-btn v3-btn-primary"
            style={{ height: 38, padding: '0 18px', fontSize: 14 }}
          >
            Try It Live
            <ArrowRight style={{ width: 16, height: 16 }} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', paddingTop: 128, paddingBottom: 64, overflow: 'hidden' }}>
        <div className="max-w-6xl mx-auto px-6" style={{ position: 'relative' }}>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.6 }}
            style={{ textAlign: 'center', maxWidth: 768, margin: '0 auto' }}
          >
            <h1
              style={{
                fontSize: 'clamp(2.75rem, 6vw, 4.5rem)', fontWeight: 600, letterSpacing: '-0.03em',
                lineHeight: 1.1, marginBottom: 24, color: 'var(--v3-text-primary)',
              }}
            >
              Upload a Contract.{' '}
              <span style={{ display: 'block', marginTop: 4 }}>Know the Risks.</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(1.0625rem, 2vw, 1.25rem)', color: 'var(--v3-text-secondary)',
                lineHeight: 1.6, marginBottom: 40, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto',
              }}
            >
              Upload contracts and chat with them in plain English. AI extracts clauses,
              scores risk, tracks obligations, and generates executive reports.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Link
                href="/dashboard"
                className="v3-btn v3-btn-primary group"
                style={{ height: 52, padding: '0 32px', fontSize: 17 }}
              >
                Try It Live
                <ArrowRight style={{ width: 20, height: 20 }} className="transition-transform group-hover:translate-x-1" />
              </Link>
              {heroVideoDismissed && (
                <button
                  onClick={() => { setHeroVideoDismissed(false); setShowHeroVideo(true) }}
                  className="v3-btn"
                  style={{ height: 52, padding: '0 28px', fontSize: 17 }}
                >
                  <span
                    style={{
                      width: 32, height: 32, borderRadius: 999, background: 'rgba(212, 168, 45, 0.18)',
                      color: 'var(--v3-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Play style={{ width: 16, height: 16, marginLeft: 2 }} />
                  </span>
                  Watch Demo
                </button>
              )}
            </div>
          </motion.div>

          {/* Hero visual / video dissolve - the single signature motion moment */}
          <div
            style={{ position: 'relative', marginTop: 64, maxWidth: 1024, marginLeft: 'auto', marginRight: 'auto', display: 'grid', gridTemplate: '1fr / 1fr' }}
          >
            <div style={{ gridArea: '1 / 1' }}>
              <HeroVisual />
            </div>

            <AnimatePresence>
              {showHeroVideo && !heroVideoDismissed && (
                <motion.div
                  key="video"
                  style={{ gridArea: '1 / 1', zIndex: 10 }}
                  initial={reduce ? false : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: reduce ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] } }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
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

      {/* Screenshot Showcase (lazy - below fold) */}
      <Suspense fallback={<div style={{ padding: '96px 0' }} />}>
        <ScreenshotShowcase />
      </Suspense>

      {/* How It Works */}
      <section style={{ ...sectionStyle, padding: '80px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...reveal()} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 16, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--v3-text-secondary)', maxWidth: 576, margin: '0 auto' }}>
              End-to-end pipeline from PDF upload to actionable insights in six stages
            </p>
          </motion.div>

          <div style={{ position: 'relative' }}>
            <div className="hidden lg:block" style={{ position: 'absolute', top: '2.25rem', left: 'calc(8.333% + 2rem)', right: 'calc(8.333% + 2rem)', height: 1 }}>
              <motion.div
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.2, ease: 'easeInOut' }}
                style={{ height: '100%', transformOrigin: 'left', background: 'var(--v3-border-hover)' }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6" style={{ columnGap: 16, rowGap: 40 }}>
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
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduce ? 0 : i * 0.08 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
                  className="group"
                >
                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <div
                      className="v3-card v3-card-hover"
                      style={{
                        width: '4.5rem', height: '4.5rem', borderRadius: 'var(--v3-radius-lg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--v3-accent)',
                      }}
                    >
                      <item.Icon style={{ width: 24, height: 24 }} />
                    </div>
                    <div
                      className="v3-mono"
                      style={{
                        position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: 999,
                        background: 'var(--v3-canvas)', border: '1px solid var(--v3-border-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: 'var(--v3-accent)', fontWeight: 600,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--v3-text-primary)', marginBottom: 4 }}>{item.title}</h3>
                  <p style={{ fontSize: 12, color: 'var(--v3-text-muted)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Layout */}
      <section style={{ ...sectionStyle, padding: '112px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...reveal()} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 16, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
              Key Features
            </h2>
            <p style={{ color: 'var(--v3-text-secondary)', maxWidth: 576, margin: '0 auto' }}>
              Enterprise-grade contract analysis capabilities built from scratch
            </p>
          </motion.div>

          {/* Hero feature + 2 supporting features in bento layout */}
          <div className="grid grid-cols-1 md:grid-cols-5" style={{ gap: 20, marginBottom: 20 }}>
            {(() => {
              const primary = features[0]
              const PrimaryIcon = primary.Icon
              return (
                <motion.div
                  {...reveal()}
                  className="md:col-span-3 v3-card v3-card-hover"
                  style={{ padding: 40 }}
                >
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 'var(--v3-radius-lg)',
                      background: 'rgba(212, 168, 45, 0.1)', color: 'var(--v3-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
                    }}
                  >
                    <PrimaryIcon style={{ width: 28, height: 28 }} />
                  </div>
                  <h3 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: 'var(--v3-text-primary)' }}>{primary.title}</h3>
                  <p style={{ color: 'var(--v3-text-secondary)', lineHeight: 1.6, fontSize: 16, maxWidth: 448, margin: 0 }}>{primary.description}</p>
                </motion.div>
              )
            })()}

            <div className="md:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {features.slice(1, 3).map((feature, i) => {
                const FeatureIcon = feature.Icon
                return (
                  <motion.div
                    key={i}
                    {...reveal((i + 1) * 0.1)}
                    className="v3-card v3-card-hover"
                    style={{ flex: 1, padding: 24 }}
                  >
                    <div
                      style={{
                        width: 44, height: 44, borderRadius: 'var(--v3-radius-md)',
                        background: 'rgba(212, 168, 45, 0.1)', color: 'var(--v3-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                      }}
                    >
                      <FeatureIcon style={{ width: 20, height: 20 }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--v3-text-primary)' }}>{feature.title}</h3>
                    <p style={{ color: 'var(--v3-text-secondary)', lineHeight: 1.6, fontSize: 14, margin: 0 }}>{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Remaining 9 features - alternating wide/compact rhythm */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 12 }}>
            {features.slice(3).map((feature, i) => {
              const isWide = i % 3 === 0
              return (
                <motion.div
                  key={i}
                  initial={reduce ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduce ? 0 : i * 0.04 }}
                  className={`v3-card v3-card-hover ${isWide ? 'sm:col-span-2' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: isWide ? 'center' : 'flex-start',
                    gap: isWide ? 24 : 16,
                    padding: isWide ? 24 : 20,
                  }}
                >
                  <div
                    style={{
                      width: isWide ? 44 : 36, height: isWide ? 44 : 36,
                      borderRadius: isWide ? 'var(--v3-radius-md)' : 'var(--v3-radius-sm)',
                      background: 'rgba(212, 168, 45, 0.1)', color: 'var(--v3-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <feature.Icon style={{ width: isWide ? 20 : 16, height: isWide ? 20 : 16 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: isWide ? 16 : 14, fontWeight: 600, color: 'var(--v3-text-primary)', marginBottom: 4 }}>{feature.title}</h3>
                    <p style={{ fontSize: isWide ? 14 : 12, color: 'var(--v3-text-muted)', lineHeight: 1.6, margin: 0 }}>{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Clause Types */}
      <section style={{ ...sectionStyle, padding: '64px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...reveal()} style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 16, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
              16+ Clause Types
            </h2>
            <p style={{ color: 'var(--v3-text-secondary)', maxWidth: 576, margin: '0 auto' }}>
              AI identifies and classifies clause types across commercial contracts
            </p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 896, margin: '0 auto' }}
          >
            {clauseTypes.map((type, i) => (
              <motion.span
                key={type}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: reduce ? 0 : i * 0.03 }}
                className="v3-pill-landing"
              >
                {type}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Built for Trust */}
      <section style={{ ...sectionStyle, padding: '96px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...reveal()} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 16, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
              Built for Trust
            </h2>
            <p style={{ color: 'var(--v3-text-secondary)', maxWidth: 576, margin: '0 auto' }}>
              Security and accuracy your legal team can rely on
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 24 }}>
            {trustSignals.map((signal, i) => (
              <TrustCard key={i} signal={signal} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section style={{ ...sectionStyle, padding: '112px 0' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 48, alignItems: 'center' }}>
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 24, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
                Production-Grade Architecture
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { icon: <MessageCircle style={{ width: 20, height: 20 }} />, title: 'Ask Questions in Plain English', desc: 'AI chat grounded in your actual contract text - every answer cites specific clauses and page numbers' },
                  { icon: <Database style={{ width: 20, height: 20 }} />, title: 'Non-Blocking Analysis', desc: 'Upload multiple contracts and keep working - extraction, embedding, and risk scoring happen in the background' },
                  { icon: <Activity style={{ width: 20, height: 20 }} />, title: 'Full Audit Trail', desc: 'Every upload, analysis, and export logged with timestamps for compliance and governance requirements' },
                  { icon: <Lock style={{ width: 20, height: 20 }} />, title: 'Secure by Design', desc: 'Server-side processing with encrypted data at rest and in transit. Your contracts are never exposed to the client' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduce ? 0 : i * 0.1 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}
                  >
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 'var(--v3-radius-md)', flexShrink: 0, marginTop: 2,
                        background: 'rgba(212, 168, 45, 0.1)', color: 'var(--v3-accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 600, color: 'var(--v3-text-primary)', marginBottom: 4 }}>{item.title}</h3>
                      <p style={{ fontSize: 14, color: 'var(--v3-text-muted)', margin: 0 }}>{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Architecture diagram */}
            <motion.div
              initial={reduce ? false : { opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="v3-card"
              style={{ overflow: 'hidden', padding: 0 }}
            >
              {([
                {
                  label: 'Presentation',
                  bar: 'var(--v3-risk-low)',
                  items: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
                },
                {
                  label: 'API Gateway',
                  bar: 'var(--v3-accent)',
                  items: ['FastAPI', '8 Routers', 'Server Proxy', 'Pydantic'],
                },
                {
                  label: 'Processing',
                  bar: 'var(--v3-risk-medium)',
                  items: ['Celery Workers', 'RAG Pipeline', 'Tesseract OCR', 'Clause Extraction'],
                },
                {
                  label: 'Storage',
                  bar: 'var(--v3-risk-low)',
                  items: ['PostgreSQL 16', 'pgvector', 'Redis 7', 'MinIO S3'],
                },
                {
                  label: 'AI',
                  bar: 'var(--v3-risk-high)',
                  items: ['Ollama', 'llama3.2', 'Nomic Embeddings', 'Vector Search'],
                },
              ] as const).map((tier, i, arr) => (
                <div key={tier.label}>
                  <motion.div
                    initial={reduce ? false : { opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduce ? 0 : i * 0.15, duration: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="v3-card-hover"
                    style={{ display: 'flex', alignItems: 'stretch' }}
                  >
                    <div style={{ width: 2, background: tier.bar, opacity: 0.7 }} />
                    <div style={{ flex: 1, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span
                        className="v3-mono"
                        style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', width: '5.5rem', flexShrink: 0, color: 'var(--v3-text-muted)' }}
                      >
                        {tier.label}
                      </span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {tier.items.map((item, j) => (
                          <span
                            key={item}
                            style={{
                              padding: '2px 10px', borderRadius: 'var(--v3-radius-sm)', fontSize: 12,
                              border: '1px solid var(--v3-border)',
                              background: j === 0 ? 'var(--v3-card-hover)' : 'transparent',
                              color: j === 0 ? 'var(--v3-text-secondary)' : 'var(--v3-text-muted)',
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                  {i < arr.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '2px 1.15rem', background: 'var(--v3-panel)' }}>
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: '5.75rem' }}>
                        <motion.path
                          d="M5 0v8M1 5l4 5 4-5"
                          stroke="var(--v3-accent)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                          whileInView={{ pathLength: 1, opacity: 0.35 }}
                          viewport={{ once: true }}
                          transition={{ delay: reduce ? 0 : i * 0.15 + 0.3, duration: reduce ? 0 : 0.4, ease: 'easeOut' }}
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...sectionStyle, padding: '80px 0' }}>
        <div className="max-w-3xl mx-auto px-6" style={{ textAlign: 'center' }}>
          <motion.div {...reveal()}>
            <div style={{ margin: '0 auto 32px', width: 'fit-content' }}>
              <Image src="/logo-minimal.png" alt="BrightClause" width={64} height={64} style={{ objectFit: 'contain' }} />
            </div>
            <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 600, marginBottom: 16, color: 'var(--v3-text-primary)', letterSpacing: '-0.02em' }}>
              Upload Your First Contract
            </h2>
            <p style={{ color: 'var(--v3-text-secondary)', fontSize: 18, marginBottom: 40, maxWidth: 512, marginLeft: 'auto', marginRight: 'auto' }}>
              See clause extraction, risk scoring, obligation tracking, and knowledge graph visualization in action.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <Link
                href="/dashboard"
                className="v3-btn v3-btn-primary group"
                style={{ height: 52, padding: '0 32px', fontSize: 17 }}
              >
                Try It Live
                <ArrowRight style={{ width: 20, height: 20 }} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--v3-border)', padding: '32px 0' }}>
        <div
          className="max-w-6xl mx-auto px-6"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--v3-text-muted)', fontSize: 14 }}>
            <Image src="/logo-minimal.png" alt="BrightClause" width={20} height={20} style={{ objectFit: 'contain' }} />
            <span>BrightClause</span>
            <span style={{ color: 'var(--v3-border-hover)' }}>&middot;</span>
            <span>Built by Macdara</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px 24px', fontSize: 14 }}>
            <Link href="/dashboard" className="v3-foot-link">Dashboard</Link>
            <Link href="/analytics" className="v3-foot-link">Analytics</Link>
            <Link href="/search" className="v3-foot-link">Search</Link>
            <Link href="/compare" className="v3-foot-link">Compare</Link>
            <Link href="/obligations" className="v3-foot-link">Obligations</Link>
            <Link href="/deals" className="v3-foot-link">Deals</Link>
            <a
              href="https://github.com/m4cd4r4/BrightClause"
              target="_blank"
              rel="noopener noreferrer"
              className="v3-foot-link"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
