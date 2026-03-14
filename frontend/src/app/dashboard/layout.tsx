import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contract Dashboard',
  description: 'View and manage your uploaded contracts. Track processing status, analyze clauses, and assess risk levels across your document portfolio.',
  alternates: { canonical: 'https://brightclause.com/dashboard' },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children
}
