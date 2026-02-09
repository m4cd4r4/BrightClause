'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DocumentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Document page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink-50 mb-2">Error loading document</h2>
        <p className="text-ink-400 mb-8">
          The document could not be loaded. It may have been deleted or the server may be unavailable.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-ink-950 font-semibold rounded-xl hover:bg-accent-light transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-ink-800 text-ink-200 rounded-xl hover:bg-ink-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
