'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Lock, ArrowRight } from 'lucide-react'

const STORAGE_KEY = 'brightclause_admin_access'
const PASSWORD = 'brightclause2026'

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setAuthorized(true)
    }
    setChecking(false)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true')
      setAuthorized(true)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1500)
    }
  }, [input])

  if (checking) return null

  if (authorized) return <>{children}</>

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/20">
            <Shield className="w-8 h-8 text-ink-950" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-100 mb-2">
            BrightClause
          </h1>
          <p className="text-ink-500 text-sm">Enter access code to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-600" />
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Access code"
              autoFocus
              className={`w-full pl-11 pr-4 py-3.5 bg-ink-900/60 border rounded-xl text-ink-100 placeholder-ink-600
                font-mono text-sm outline-none transition-all
                ${error
                  ? 'border-red-500/60 bg-red-500/5 animate-[shake_0.3s_ease-in-out]'
                  : 'border-ink-800/60 focus:border-accent/50 focus:ring-1 focus:ring-accent/20'
                }`}
            />
          </div>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-accent text-ink-950 font-semibold
              rounded-xl hover:bg-accent-light hover:shadow-lg hover:shadow-accent/20 transition-all text-sm"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <p className="text-center text-red-400 text-sm mt-4">Incorrect access code</p>
        )}
      </div>
    </div>
  )
}
