import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deal Management',
  description: 'Organize contracts into deals, track document status, and monitor aggregate risk across deal portfolios.',
  alternates: { canonical: 'https://brightclause.com/deals' },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children
}
