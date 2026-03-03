import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Document Comparison',
  description: 'Compare clause coverage and risk levels across contracts side-by-side. Identify coverage gaps and risk differences.',
  alternates: { canonical: 'https://brightclause.com/compare' },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children
}
