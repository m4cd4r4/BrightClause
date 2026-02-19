'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Shield, LayoutDashboard, BarChart3, GitCompareArrows, Search, Menu, X, Sun, Moon, ClipboardCheck, Briefcase } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows },
  { href: '/obligations', label: 'Obligations', icon: ClipboardCheck },
  { href: '/deals', label: 'Deals', icon: Briefcase },
  { href: '/search', label: 'Search', icon: Search },
]

export function Navigation({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="border-b border-ink-800/50 bg-ink-950/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent via-accent to-accent-dark flex items-center justify-center shadow-lg shadow-accent/20">
              <Shield className="w-5 h-5 text-ink-950" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-bold tracking-tight text-ink-50">BrightClause</span>
              <p className="text-[10px] text-ink-500 tracking-wide uppercase font-mono">M&A Due Diligence</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                      ? 'bg-accent/15 text-accent border border-accent/20'
                      : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/50 border border-transparent'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side actions (passed as children) + mobile toggle */}
          <div className="flex items-center gap-3">
            {children}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-ink-400 hover:text-ink-200 hover:bg-ink-800/50 rounded-lg transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-ink-400 hover:text-ink-200 hover:bg-ink-800/50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-ink-800/50 flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-accent/15 text-accent'
                      : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800/50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}
      </div>
    </header>
  )
}
