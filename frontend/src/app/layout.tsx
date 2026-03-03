import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'https://brightclause.com'),
  title: {
    default: 'BrightClause | AI-Powered Contract Intelligence',
    template: '%s | BrightClause',
  },
  description: 'Upload contracts, extract clauses, assess risk levels, and visualize entity relationships with AI-powered analysis. Supporting 16 clause types, 4-tier OCR, and knowledge graph visualization.',
  openGraph: {
    title: 'BrightClause | AI Contract Intelligence',
    description: 'AI-powered contract analysis and enhanced due diligence. Extract clauses, assess risk, visualize entity relationships.',
    type: 'website',
    siteName: 'BrightClause',
    url: 'https://brightclause.com',
    images: [{ url: '/assets/screenshot-dashboard.png', width: 1200, height: 630, alt: 'BrightClause AI Contract Intelligence Dashboard' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrightClause | AI Contract Intelligence',
    description: 'AI-powered contract analysis and enhanced due diligence.',
    images: ['/assets/screenshot-dashboard.png'],
  },
  alternates: { canonical: 'https://brightclause.com' },
  robots: { index: true, follow: true },
  other: { 'theme-color': '#0a0a1a' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        <div id="toast-root" />
      </body>
    </html>
  )
}
