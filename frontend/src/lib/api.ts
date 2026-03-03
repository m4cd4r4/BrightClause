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
  page_number: number | null
  chunk_index: number | null
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

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSource {
  chunk_id: string
  content: string
  page_number: number | null
  score: number
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
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
  overall_risk: 'critical' | 'high' | 'medium' | 'low'
  clause_breakdown: Record<string, { total: number; risk_levels: Record<string, number> }>
  high_risk_highlights: Array<{
    clause_type: string
    risk_level: string
    summary: string
    risk_factors: string[]
  }>
}

export interface ReportData {
  executive_summary: string
  document_info: {
    filename: string
    page_count: number | null
    status: string
    total_clauses: number
    total_entities: number
  }
  risk_overview: {
    critical: number
    high: number
    medium: number
    low: number
  }
  key_clauses: Array<{
    clause_type: string
    risk_level: string
    summary: string
    risk_factors: string[]
    page_number: number | null
  }>
  entities_summary: Array<{
    type: string
    count: number
    examples: string[]
  }>
  recommendations: string[]
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      let detail = ''
      try {
        const body = await response.json()
        detail = body.error || body.detail || body.message || ''
      } catch { /* ignore parse errors */ }
      throw new Error(detail || `Request failed (${response.status})`)
    }

    return response.json()
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export interface TimelineEvent {
  id: string
  date: string
  parsed_date: string | null
  label: string
  type: 'effective' | 'expiration' | 'renewal' | 'payment' | 'notice' | 'execution' | 'other'
  context: string | null
  importance: 'high' | 'medium' | 'low'
  page_number: number | null
}

export interface ObligationItem {
  id: string
  description: string
  responsible_party: string | null
  due_date: string | null
  obligation_type: string
  status: string
  clause_id: string | null
  created_at: string
}

export interface DealItem {
  id: string
  name: string
  description: string | null
  created_at: string
  document_count: number
  documents: Array<{ id: string; filename: string; status: string }>
}

export interface DealDetail {
  id: string
  name: string
  description: string | null
  created_at: string
  document_count: number
  risk_summary: Record<string, number>
  documents: Array<{
    id: string
    filename: string
    status: string
    file_size: number | null
    page_count: number | null
    clause_count: number
  }>
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
      if (!response.ok) {
        if (response.status === 429) throw new Error('429: Upload rate limit exceeded')
        if (response.status === 503) throw new Error('503: Server busy processing documents')
        throw new Error(`Upload failed (${response.status})`)
      }
      return response.json() as Promise<Document>
    },
    rename: (id: string, filename: string) =>
      fetchAPI<Document>(`/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ filename }),
      }),
    delete: (id: string) => fetch(`${API_URL}/documents/${id}`, { method: 'DELETE' }),
    chunks: (id: string) => fetchAPI<{ chunks: Array<{ id: string; content: string; page_number: number }> }>(
      `/documents/${id}/chunks`
    ),
    downloadUrl: (id: string) =>
      fetchAPI<{ download_url: string; filename: string }>(`/documents/${id}/download-url`),
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
    extract: (documentId: string, claudeApiKey?: string) => fetchAPI<{ status: string; message: string }>(
      `/analysis/${documentId}/extract`,
      {
        method: 'POST',
        ...(claudeApiKey ? {
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ claude_api_key: claudeApiKey }),
        } : {}),
      }
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
    explainClause: (documentId: string, clauseId: string, claudeApiKey?: string) =>
      fetchAPI<{ explanation: string; clause_type: string }>(
        `/analysis/${documentId}/clauses/${clauseId}/explain`,
        {
          method: 'POST',
          body: claudeApiKey ? JSON.stringify({ claude_api_key: claudeApiKey }) : undefined,
        }
      ),
    report: (documentId: string) =>
      fetchAPI<ReportData>(`/analysis/${documentId}/report`, { method: 'POST' }),
  },

  // Chat
  chat: {
    ask: (documentId: string, question: string, history: ChatMessage[] = []) =>
      fetchAPI<ChatResponse>(`/chat/${documentId}`, {
        method: 'POST',
        body: JSON.stringify({ question, history }),
      }),
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
    timeline: (documentId: string) =>
      fetchAPI<{ document_id: string; events: TimelineEvent[]; total: number }>(
        `/graph/timeline/${documentId}`
      ),
    crossReference: (minDocuments = 2) =>
      fetchAPI<{
        entities: Array<{
          normalized_name: string
          entity_type: string
          document_count: number
          documents: Array<{
            document_id: string
            filename: string
            contexts: string[]
          }>
        }>
        total: number
      }>(`/graph/cross-reference?min_documents=${minDocuments}`),
  },

  // Obligations
  obligations: {
    extractForDocument: (documentId: string, claudeApiKey?: string) =>
      fetchAPI<{ document_id: string; obligations_found: number; message: string }>(
        `/analysis/${documentId}/obligations/extract`,
        {
          method: 'POST',
          body: claudeApiKey ? JSON.stringify({ claude_api_key: claudeApiKey }) : undefined,
        },
      ),
    forDocument: (documentId: string) =>
      fetchAPI<{
        document_id: string
        filename: string
        obligations: ObligationItem[]
        total: number
      }>(`/analysis/${documentId}/obligations`),
    all: (opts?: { status?: string; obligation_type?: string; limit?: number }) => {
      const params = new URLSearchParams()
      if (opts?.status) params.set('status', opts.status)
      if (opts?.obligation_type) params.set('obligation_type', opts.obligation_type)
      if (opts?.limit) params.set('limit', opts.limit.toString())
      return fetchAPI<{
        obligations: (ObligationItem & { document_id: string; filename: string })[]
        total: number
      }>(`/analysis/obligations/all?${params}`)
    },
  },

  // Deals
  deals: {
    list: () =>
      fetchAPI<{
        deals: DealItem[]
        total: number
      }>('/deals'),
    get: (dealId: string) =>
      fetchAPI<DealDetail>(`/deals/${dealId}`),
    create: (name: string, description?: string) =>
      fetchAPI<{ id: string; name: string }>('/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      }),
    addDocuments: (dealId: string, documentIds: string[]) =>
      fetchAPI<{ deal_id: string; documents_added: number }>(`/deals/${dealId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: documentIds }),
      }),
    removeDocument: (dealId: string, documentId: string) =>
      fetchAPI(`/deals/${dealId}/documents/${documentId}`, { method: 'DELETE' }),
    delete: (dealId: string) =>
      fetchAPI(`/deals/${dealId}`, { method: 'DELETE' }),
  },

  // Activity Feed
  activity: {
    list: (limit = 30, documentId?: string) => {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (documentId) params.set('document_id', documentId)
      return fetchAPI<{
        activities: Array<{
          id: string
          document_id: string | null
          action: string
          details: Record<string, unknown>
          created_at: string
          filename: string | null
        }>
        total: number
      }>(`/activity?${params}`)
    },
  },
}
