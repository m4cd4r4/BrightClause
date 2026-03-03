import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio Analytics',
  description: 'Visualize risk distribution, clause coverage, and document analysis across your entire contract portfolio with interactive heatmaps and charts.',
  alternates: { canonical: 'https://brightclause.com/analytics' },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children
}
