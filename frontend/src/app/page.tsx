'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield, ArrowRight, FileText, Search, Zap, Network,
  Database, Brain, Eye, BarChart3, Lock, Layers,
  CheckCircle, ChevronRight, Github, ExternalLink
} from 'lucide-react'

const features = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: '4-Tier OCR Pipeline',
    description: 'PyMuPDF, Tesseract, PaddleOCR, and Vision LLM fallback ensures text extraction from any PDF quality.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI Clause Extraction',
    description: '16+ clause types automatically identified and classified: termination, indemnification, IP, non-compete, and more.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Risk Assessment',
    description: 'Each clause scored Critical / High / Medium / Low with specific risk factors and AI-generated summaries.',
  },
  {
    icon: <Search className="w-6 h-6" />,
    title: 'Hybrid Vector Search',
    description: 'Semantic + keyword search powered by pgvector embeddings. Find relevant clauses using natural language.',
  },
  {
    icon: <Network className="w-6 h-6" />,
    title: 'Knowledge Graph',
    description: 'Entity extraction and relationship mapping. Visualize parties, dates, amounts, and obligations as an interactive graph.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Export & Reporting',
    description: 'Export full analysis as PDF, Excel, Word, CSV, or JSON for integration with your due diligence workflow.',
  },
]

const techStack = [
  { category: 'Frontend', items: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Canvas API'] },
  { category: 'Backend', items: ['FastAPI', 'SQLAlchemy 2.0', 'Celery', 'Pydantic'] },
  { category: 'AI / ML', items: ['Ollama (llama3.2)', 'pgvector', 'Nomic Embed', 'Tesseract OCR'] },
  { category: 'Infrastructure', items: ['PostgreSQL', 'Redis', 'MinIO (S3)', 'Docker Compose'] },
]

const clauseTypes = [
  'Termination', 'Indemnification', 'Limitation of Liability', 'Confidentiality',
  'Non-Compete', 'Intellectual Property', 'Change of Control', 'Assignment',
  'Governing Law', 'Dispute Resolution', 'Warranty', 'Force Majeure',
  'Payment Terms', 'Insurance', 'Audit Rights', 'Data Privacy',
]

const stats = [
  { value: '16+', label: 'Clause Types' },
  { value: '4-Tier', label: 'OCR Pipeline' },
  { value: '7', label: 'Entity Types' },
  { value: '3', label: 'Search Modes' },
]

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-ink-800/50 bg-ink-950/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/20">
              <Shield className="w-5 h-5 text-ink-950" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight">ContractClarity</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/m4cd4r4/ContractClarity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink-200 transition-colors"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Source Code</span>
            </a>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-ink-950 font-semibold rounded-xl
                       hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20 transition-all text-sm"
            >
              Live Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[100px]"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[80px]"
            style={{ transform: `translateY(${-scrollY * 0.05}px)` }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              AI-Powered{' '}
              <span className="text-accent">Contract Analysis</span>{' '}
              for M&A Due Diligence
            </h1>

            <p className="text-lg sm:text-xl text-ink-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              Upload contracts. Extract clauses. Assess risk. Visualize entity relationships.
              End-to-end AI pipeline from PDF ingestion to interactive knowledge graph.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 px-8 py-4 bg-accent text-ink-950 rounded-xl font-semibold text-lg
                         hover:bg-accent-light hover:shadow-xl hover:shadow-accent/20 transition-all hover:scale-[1.02]"
              >
                Explore the Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/m4cd4r4/ContractClarity"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 bg-ink-900 border border-ink-700 rounded-xl font-semibold text-lg
                         text-ink-200 hover:bg-ink-800 hover:border-ink-600 transition-all"
              >
                <Github className="w-5 h-5" />
                View Source
              </a>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-5 bg-ink-900/40 border border-ink-800/50 rounded-xl">
                <p className="text-3xl font-bold font-mono text-accent">{stat.value}</p>
                <p className="text-xs text-ink-500 font-mono uppercase tracking-wide mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-24 border-t border-ink-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              End-to-end pipeline from PDF upload to risk assessment in five stages
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'Upload', desc: 'PDF stored in MinIO (S3)', icon: <FileText className="w-5 h-5" /> },
              { step: '02', title: 'Extract', desc: '4-tier OCR pipeline', icon: <Layers className="w-5 h-5" /> },
              { step: '03', title: 'Chunk & Embed', desc: 'pgvector embeddings', icon: <Database className="w-5 h-5" /> },
              { step: '04', title: 'Analyze', desc: 'LLM clause extraction', icon: <Brain className="w-5 h-5" /> },
              { step: '05', title: 'Visualize', desc: 'Risk + knowledge graph', icon: <Eye className="w-5 h-5" /> },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 bg-ink-900/40 border border-ink-800/50 rounded-xl text-center group hover:border-accent/30 transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 transition-colors">
                  {item.icon}
                </div>
                <div className="text-[10px] font-mono text-accent uppercase tracking-widest mb-2">{item.step}</div>
                <h3 className="font-display text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-ink-500">{item.desc}</p>
                {i < 4 && (
                  <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-700" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 border-t border-ink-800/50">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-6 bg-ink-900/30 border border-ink-800/50 rounded-xl hover:border-accent/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Clause Types */}
      <section className="py-24 border-t border-ink-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">16+ Clause Types</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              AI identifies and classifies clause types common in M&A contracts
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

      {/* Tech Stack */}
      <section className="py-24 border-t border-ink-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Tech Stack</h2>
            <p className="text-ink-400 max-w-xl mx-auto">
              Modern, production-grade architecture with full Docker deployment
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((group, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-ink-900/30 border border-ink-800/50 rounded-xl"
              >
                <h3 className="text-xs font-mono text-accent uppercase tracking-widest mb-4">{group.category}</h3>
                <ul className="space-y-2">
                  {group.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-ink-300">
                      <CheckCircle className="w-3.5 h-3.5 text-accent/60 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Architecture */}
      <section className="py-24 border-t border-ink-800/50">
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
                  { icon: <Lock className="w-5 h-5" />, title: 'API Key Authentication', desc: 'Server-side proxy hides backend IP and API credentials from the client' },
                  { icon: <Database className="w-5 h-5" />, title: 'Async Task Processing', desc: 'Celery workers handle OCR, embedding, and analysis without blocking the API' },
                  { icon: <Layers className="w-5 h-5" />, title: 'Docker Compose Deployment', desc: '6 containerized services: API, Worker, PostgreSQL, Redis, MinIO, Ollama' },
                  { icon: <Search className="w-5 h-5" />, title: 'Vector Search', desc: 'pgvector extension enables semantic similarity search across all document chunks' },
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

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-6 bg-ink-900/40 border border-ink-800/50 rounded-xl font-mono text-sm"
            >
              <div className="text-ink-500 mb-4"># Architecture</div>
              <pre className="text-ink-300 leading-relaxed overflow-x-auto whitespace-pre">{`┌─────────────────────────────────────┐
│          Next.js Frontend           │
│    (Vercel / TypeScript / React)    │
└──────────────┬──────────────────────┘
               │  API Proxy (server-side)
┌──────────────▼──────────────────────┐
│          FastAPI Backend            │
│    (Python / SQLAlchemy / Auth)     │
├─────────┬───────────┬───────────────┤
│ Celery  │ pgvector  │    MinIO      │
│ Workers │ Embeddings│  (S3 Storage) │
├─────────┼───────────┼───────────────┤
│  Redis  │ PostgreSQL│    Ollama     │
│ (Queue) │   (Data)  │   (LLM AI)   │
└─────────┴───────────┴───────────────┘`}</pre>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-ink-800/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center mx-auto mb-8 shadow-lg shadow-accent/20">
              <Shield className="w-8 h-8 text-ink-950" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              See It in Action
            </h2>
            <p className="text-ink-400 text-lg mb-10 max-w-lg mx-auto">
              14 real contracts pre-loaded with AI analysis. Explore clause extraction, risk assessment, and knowledge graph visualization.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 px-8 py-4 bg-accent text-ink-950 rounded-xl font-semibold text-lg
                         hover:bg-accent-light hover:shadow-xl hover:shadow-accent/20 transition-all hover:scale-[1.02]"
              >
                Explore the Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/m4cd4r4/ContractClarity"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-ink-400 hover:text-ink-200 transition-colors"
              >
                <Github className="w-5 h-5" />
                View on GitHub
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-ink-500 text-sm">
            <Shield className="w-4 h-4 text-accent/50" />
            <span>ContractClarity</span>
            <span className="text-ink-700">·</span>
            <span>Built by Macdara</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-ink-500">
            <a href="https://github.com/m4cd4r4/ContractClarity" target="_blank" rel="noopener noreferrer" className="hover:text-ink-300 transition-colors">
              GitHub
            </a>
            <Link href="/dashboard" className="hover:text-ink-300 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
