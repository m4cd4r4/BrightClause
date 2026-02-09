// All API calls go through the Next.js proxy at /api/*, which forwards
// to the backend server-side (no mixed-content, backend IP hidden, API key stays server-side).
const API_URL = '/api'

export interface Document {
  id: string
  filename: string
  file_size: number | null
  file_type: string | null
  page_count: number | null
  status: string
  chunk_count: number
  metadata: Record<string, unknown>
}

export interface SearchResult {
  chunk_id: string
  document_id: string
  document_name: string
  content: string
  page_number: number | null
  semantic_score: number
  keyword_score: number
  combined_score: number
}

export interface Clause {
  id: string
  document_id: string
  clause_type: string
  content: string
  summary: string | null
  risk_level: string | null
  confidence: number | null
  risk_factors: string[]
}

export interface Entity {
  id: string
  document_id: string
  entity_type: string
  name: string
  normalized_name: string | null
  value: string | null
  context: string | null
}

export interface GraphData {
  document_id: string
  nodes: Array<{
    id: string
    label: string
    type: string
    value: string | null
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: string
    label: string
  }>
  stats: {
    total_entities: number
    total_relationships: number
    entity_types: Record<string, number>
  }
}

export interface AnalysisSummary {
  document_id: string
  status: string
  clauses_extracted: number
  risk_summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
  overall_risk: string
  clause_breakdown: Record<string, { total: number; risk_levels: Record<string, number> }>
  high_risk_highlights: Array<{
    clause_type: string
    risk_level: string
    summary: string
    risk_factors: string[]
  }>
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Health
  health: () => fetchAPI<{ status: string }>('/health'),

  // Documents
  documents: {
    list: (params?: { skip?: number; limit?: number; status?: string }) => {
      const query = new URLSearchParams()
      if (params?.skip) query.set('skip', params.skip.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      if (params?.status) query.set('status', params.status)
      return fetchAPI<{ documents: Document[]; total: number }>(`/documents?${query}`)
    },
    get: (id: string) => fetchAPI<Document>(`/documents/${id}`),
    upload: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch(`${API_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) throw new Error('Upload failed')
      return response.json() as Promise<Document>
    },
    delete: (id: string) => fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' }),
    chunks: (id: string) => fetchAPI<{ chunks: Array<{ id: string; content: string; page_number: number }> }>(
      `/documents/${id}/chunks`
    ),
  },

  // Search
  search: {
    query: (q: string, options?: { limit?: number; mode?: string; document_id?: string }) => {
      const params = new URLSearchParams({ q })
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.mode) params.set('mode', options.mode)
      if (options?.document_id) params.set('document_id', options.document_id)
      return fetchAPI<{ query: string; results: SearchResult[]; total: number }>(`/search?${params}`)
    },
    stats: () => fetchAPI<{
      documents_indexed: number
      chunks_with_embeddings: number
      clauses_extracted: number
    }>('/search/stats'),
  },

  // Analysis
  analysis: {
    extract: (documentId: string) => fetchAPI<{ status: string; message: string }>(
      `/analysis/${documentId}/extract`,
      { method: 'POST' }
    ),
    summary: (documentId: string) => fetchAPI<AnalysisSummary>(`/analysis/${documentId}/summary`),
    clauses: (documentId: string, options?: { clause_type?: string; risk_level?: string }) => {
      const params = new URLSearchParams()
      if (options?.clause_type) params.set('clause_type', options.clause_type)
      if (options?.risk_level) params.set('risk_level', options.risk_level)
      return fetchAPI<Clause[]>(`/analysis/${documentId}/clauses?${params}`)
    },
    clauseTypes: () => fetchAPI<{ clause_types: string[]; descriptions: Record<string, string> }>(
      '/analysis/clause-types'
    ),
  },

  // Knowledge Graph
  graph: {
    extract: (documentId: string) => fetchAPI<{ status: string; message: string }>(
      `/graph/${documentId}/extract`,
      { method: 'POST' }
    ),
    get: (documentId: string) => fetchAPI<GraphData>(`/graph/${documentId}`),
    entities: (documentId: string, entityType?: string) => {
      const params = entityType ? `?entity_type=${entityType}` : ''
      return fetchAPI<Entity[]>(`/graph/${documentId}/entities${params}`)
    },
    stats: () => fetchAPI<{
      documents_with_entities: number
      entity_counts: Record<string, number>
      total_entities: number
    }>('/graph/stats'),
    types: () => fetchAPI<{
      entity_types: string[]
      relationship_types: string[]
      entity_descriptions: Record<string, string>
    }>('/graph/types'),
  },
}
