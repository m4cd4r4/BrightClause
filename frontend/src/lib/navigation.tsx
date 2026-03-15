'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { LayoutDashboard, BarChart3, GitCompareArrows, Sun, Moon, ClipboardCheck, Briefcase } from 'lucide-react'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}
import { useTheme } from '@/lib/theme'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/compare', label: 'Compare', icon: GitCompareArrows },
  { href: '/obligations', label: 'Obligations', icon: ClipboardCheck },
  { href: '/deals', label: 'Deals', icon: Briefcase },
]

export function Navigation({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      {/* Top header */}
      <header className="border-b border-ink-800/50 bg-ink-950/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <Image
                src="/logo-minimal.png"
                alt="BrightClause"
                width={40}
                height={40}
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg"
              />
              <div className="hidden sm:block">
                <span className="font-display text-xl font-bold tracking-tight text-ink-50">BrightClause</span>
                <p className="text-[10px] text-ink-500 tracking-wide">Contract Intelligence</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${active
                        ? 'bg-accent/15 text-accent border border-accent/20'
                        : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800/50 border border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              {children}
              <a
                href="https://github.com/m4cd4r4/BrightClause"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-ink-400 hover:text-ink-100 hover:bg-ink-800/50 rounded-lg transition-colors"
                aria-label="View source on GitHub"
                title="View source on GitHub"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-ink-400 hover:text-ink-100 hover:bg-ink-800/50 rounded-lg transition-colors"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-ink-950/95 backdrop-blur-xl border-t border-ink-800/50 safe-area-pb"
      >
        <div className="flex items-stretch">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors
                  ${active ? 'text-accent' : 'text-ink-500 hover:text-ink-200'}`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-accent' : ''}`} aria-hidden="true" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
