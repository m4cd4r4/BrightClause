'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { type DragEventHandler, ReactNode, useEffect, useState } from 'react'
import {
  LayoutGrid, BarChart3, Search, ClipboardCheck, Briefcase, GitBranch, Settings, Command, Menu,
} from 'lucide-react'

const WORKSPACE = [
  { href: '/dashboard', label: 'Portfolio', icon: LayoutGrid },
  { href: '/deals', label: 'Workspaces', icon: Briefcase },
] as const

const INSIGHTS = [
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/obligations', label: 'Obligations', icon: ClipboardCheck },
  { href: '/search', label: 'Search', icon: Search },
] as const

export function V3Shell({ children, onDragOver, onDragLeave, onDrop }: {
  children: ReactNode
  onDragOver?: DragEventHandler
  onDragLeave?: DragEventHandler
  onDrop?: DragEventHandler
}) {
  const path = usePathname() || ''
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false)
        setMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Close the mobile drawer on navigation.
  useEffect(() => { setMobileNavOpen(false) }, [path])

  // Lock body scroll while the mobile drawer is open (same pattern as ScreenshotShowcase cinema mode).
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileNavOpen])

  return (
    <div className="v3" style={{ minHeight: '100vh', display: 'flex' }} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <aside className="v3-side" id="v3-sidenav" data-open={mobileNavOpen}>
        <Link
          href="/"
          onClick={() => setMobileNavOpen(false)}
          aria-label="BrightClause home"
          style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--v3-border)', textDecoration: 'none', color: 'inherit' }}
        >
          <Image src="/logo-minimal.png" alt="BrightClause" width={28} height={28} style={{ objectFit: 'contain' }} priority />
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>BrightClause</div>
        </Link>

        <div className="v3-side-group">Workspace</div>
        {WORKSPACE.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileNavOpen(false)} className="v3-side-link" data-active={path === href || path.startsWith(href + '/')}>
            <Icon size={16} /> {label}
          </Link>
        ))}

        <div className="v3-side-group">Insights</div>
        {INSIGHTS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileNavOpen(false)} className="v3-side-link" data-active={path === href || path.startsWith(href + '/')}>
            <Icon size={16} /> {label}
          </Link>
        ))}

        <div style={{ flex: 1 }} />
        <Link href="#" onClick={() => setMobileNavOpen(false)} className="v3-side-link"><Settings size={16} /> Settings</Link>
        <div className="v3-mono" style={{ padding: '12px 16px', fontSize: 10, color: 'var(--v3-text-muted)', borderTop: '1px solid var(--v3-border)' }}>
          v3.preview · 2026-05-16
        </div>
      </aside>
      {mobileNavOpen && (
        <div className="v3-scrim" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header className="v3-top">
          <button
            className="v3-side-toggle"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="v3-sidenav"
          >
            <Menu size={18} />
          </button>
          <button className="v3-search-trigger" onClick={() => setPaletteOpen(true)}>
            <Search size={14} />
            <span>Search documents, clauses, entities…</span>
            <kbd>⌘K</kbd>
          </button>
          <div style={{ flex: 1 }} />
          <button className="v3-btn v3-btn-ghost"><Command size={14} /></button>
        </header>

        <main className="v3-main" style={{ flex: 1, maxWidth: 1440, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>

      {paletteOpen && (
        <div
          onClick={() => setPaletteOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', justifyContent: 'center', paddingTop: '15vh' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 640, background: 'var(--v3-popover)', border: '1px solid var(--v3-border)', borderRadius: 'var(--v3-radius-lg)', boxShadow: 'var(--v3-shadow-md)', overflow: 'hidden', animation: 'v3-palette-in 200ms ease-out' }}
          >
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--v3-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={16} color="var(--v3-text-muted)" />
              <input
                autoFocus
                placeholder="Type a command or search…"
                style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--v3-text-primary)', fontSize: 14, fontFamily: 'inherit' }}
              />
              <kbd style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: 'var(--v3-card)', border: '1px solid var(--v3-border)', fontFamily: 'var(--font-geist-mono), monospace', color: 'var(--v3-text-muted)' }}>esc</kbd>
            </div>
            <div style={{ padding: 8 }}>
              <div className="v3-mono" style={{ padding: '6px 10px', fontSize: 10, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Navigate</div>
              {[...WORKSPACE, ...INSIGHTS].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setPaletteOpen(false)} className="v3-side-link" style={{ margin: 0, padding: '8px 12px' }}>
                  <Icon size={14} /> {label}
                  <span className="v3-mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--v3-text-muted)' }}>{href}</span>
                </Link>
              ))}
              <div className="v3-mono" style={{ padding: '10px 10px 6px', fontSize: 10, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</div>
              <Link href="/dashboard" onClick={() => setPaletteOpen(false)} className="v3-side-link" style={{ margin: 0, padding: '8px 12px' }}>
                Upload a contract
                <span className="v3-mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--v3-text-muted)' }}>U</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
