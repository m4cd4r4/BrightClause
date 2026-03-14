import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search Contracts',
  description: 'Search your contract portfolio using natural language, semantic AI, or keyword matching. Find specific clauses and provisions across all documents.',
  alternates: { canonical: 'https://brightclause.com/search' },
}

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children
}
