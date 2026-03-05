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
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/logo.png',
    shortcut: '/favicon.png',
  },
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BrightClause',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'BrightClause',
        description: 'AI-powered contract intelligence platform. Upload contracts, extract clauses, assess risk levels, and visualize entity relationships.',
        url: 'https://brightclause.com',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
        featureList: 'AI Clause Extraction, Risk Assessment, Knowledge Graph, Hybrid Vector Search, Obligation Tracking, Executive Reports',
        screenshot: 'https://brightclause.com/assets/screenshot-dashboard.png',
      },
      {
        '@type': 'Organization',
        name: 'BrightClause',
        url: 'https://brightclause.com',
        logo: 'https://brightclause.com/logo-minimal.png',
        sameAs: ['https://github.com/m4cd4r4/BrightClause'],
      },
    ],
  }

  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-ink-950 focus:rounded-lg focus:font-semibold">
          Skip to content
        </a>
        <Providers>
          {children}
        </Providers>
        <div id="toast-root" />
      </body>
    </html>
  )
}
