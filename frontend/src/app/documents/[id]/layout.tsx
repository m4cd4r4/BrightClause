import type { Metadata } from 'next'

const BACKEND_URL = process.env.BACKEND_URL || 'http://45.77.233.102:8002'
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || ''

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params

  try {
    const headers: Record<string, string> = {}
    if (BACKEND_API_KEY) headers['X-API-Key'] = BACKEND_API_KEY

    const res = await fetch(`${BACKEND_URL}/documents/${id}`, {
      headers,
      next: { revalidate: 60 },
    })

    if (res.ok) {
      const doc = await res.json()
      const filename = doc.filename || 'Document'
      const name = filename.replace(/\.pdf$/i, '')

      return {
        title: `${name} — Analysis`,
        description: `AI-powered clause extraction, risk assessment, and entity analysis for ${filename}.`,
        robots: { index: false, follow: false },
      }
    }
  } catch {
    // Fall through to default
  }

  return {
    title: 'Document Analysis',
    description: 'AI-powered contract clause extraction, risk assessment, and entity relationship analysis.',
    robots: { index: false, follow: false },
  }
}

export default function DocumentLayout({ children }: { children: React.ReactNode }) {
  return children
}
