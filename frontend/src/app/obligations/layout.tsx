import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Obligation Tracker',
  description: 'Track contract obligations by status and type. Monitor pending, overdue, and completed obligations across your portfolio.',
  alternates: { canonical: 'https://brightclause.com/obligations' },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children
}
