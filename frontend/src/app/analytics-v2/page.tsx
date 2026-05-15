'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { api, Document, AnalysisSummary } from '@/lib/api'
import { V3Shell } from '@/components/v3/shell'
import { KpiCard, RiskPill, PageHeader, Section, HeatmapCell, EntityChip, RiskLevel } from '@/components/v3/primitives'
import { formatClauseType } from '@/lib/risk'

interface DocAnalysis {
  doc: Document
  summary: AnalysisSummary | null
}

export default function AnalyticsV2() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [analyses, setAnalyses] = useState<Map<string, AnalysisSummary>>(new Map())
  const [crossRefs, setCrossRefs] = useState<Array<{
    normalized_name: string
    entity_type: string
    document_count: number
    documents: Array<{ document_id: string; filename: string; contexts: string[] }>
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const r = await api.documents.list({ limit: 100 })
        const completed = r.documents.filter((d) => d.status === 'completed')
        setDocuments(completed)
        const map = new Map<string, AnalysisSummary>()
        const results = await Promise.allSettled(completed.map((d) => api.analysis.summary(d.id)))
        results.forEach((res, i) => {
          if (res.status === 'fulfilled' && res.value.clauses_extracted > 0) {
            map.set(completed[i].id, res.value)
          }
        })
        setAnalyses(map)
        try {
          const xref = await api.graph.crossReference(2)
          setCrossRefs(xref.entities)
        } catch {}
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const docAnalyses: DocAnalysis[] = useMemo(
    () =>
      documents
        .map((doc) => ({ doc, summary: analyses.get(doc.id) || null }))
        .filter((d) => d.summary !== null),
    [documents, analyses]
  )

  const stats = useMemo(() => {
    let critical = 0, high = 0, medium = 0, low = 0, totalClauses = 0
    const clauseTypeFreq: Record<string, { total: number; risks: Record<string, number> }> = {}
    for (const { summary } of docAnalyses) {
      if (!summary) continue
      totalClauses += summary.clauses_extracted
      critical += summary.risk_summary.critical || 0
      high += summary.risk_summary.high || 0
      medium += summary.risk_summary.medium || 0
      low += summary.risk_summary.low || 0
      for (const [t, b] of Object.entries(summary.clause_breakdown)) {
        if (!clauseTypeFreq[t]) clauseTypeFreq[t] = { total: 0, risks: {} }
        clauseTypeFreq[t].total += b.total
        for (const [r, c] of Object.entries(b.risk_levels)) {
          clauseTypeFreq[t].risks[r] = (clauseTypeFreq[t].risks[r] || 0) + c
        }
      }
    }
    const totalRisk = critical + high + medium + low
    const healthScore = totalRisk > 0
      ? Math.round(((low * 100 + medium * 60 + high * 25 + critical * 0) / (totalRisk * 100)) * 100)
      : 100
    return { totalDocs: docAnalyses.length, totalClauses, critical, high, medium, low, healthScore, clauseTypeFreq }
  }, [docAnalyses])

  const allClauseTypes = useMemo(
    () => Object.entries(stats.clauseTypeFreq).sort((a, b) => b[1].total - a[1].total).map(([t]) => t),
    [stats.clauseTypeFreq]
  )

  const highlights = useMemo(() => {
    const out: Array<{ docName: string; docId: string; clause_type: string; risk_level: string; summary: string }> = []
    for (const { doc, summary } of docAnalyses) {
      if (!summary) continue
      for (const h of summary.high_risk_highlights) {
        out.push({ docName: doc.filename, docId: doc.id, ...h })
      }
    }
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return out.sort((a, b) => (order[a.risk_level] ?? 4) - (order[b.risk_level] ?? 4))
  }, [docAnalyses])

  const distribution = useMemo(
    () => allClauseTypes.slice(0, 8).map((t) => ({ name: formatClauseType(t), count: stats.clauseTypeFreq[t].total })),
    [allClauseTypes, stats.clauseTypeFreq]
  )

  const cellLevel = (risks: Record<string, number> | undefined): RiskLevel | null => {
    if (!risks) return null
    if ((risks.critical ?? 0) > 0) return 'critical'
    if ((risks.high ?? 0) > 0) return 'high'
    if ((risks.medium ?? 0) > 0) return 'medium'
    if ((risks.low ?? 0) > 0) return 'low'
    return null
  }

  return (
    <V3Shell>
      <PageHeader
        crumb="Insights"
        title="Analytics"
        subtitle={loading ? 'Loading portfolio…' : `Risk distribution across ${stats.totalDocs} analyzed contracts`}
        actions={
          <button className="v3-btn">Export</button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard label="Health score" value={stats.healthScore} delta={{ value: 3, period: '30d' }} spark={[40, 48, 55, 52, 60, 63, stats.healthScore]} intent={stats.healthScore >= 70 ? 'low' : stats.healthScore >= 40 ? 'medium' : 'critical'} />
        <KpiCard label="Critical risks" value={stats.critical} spark={[0, 1, 2, 2, 3, 3, stats.critical]} intent="critical" />
        <KpiCard label="High risks" value={stats.high} spark={[1, 1, 2, 2, 2, 2, stats.high]} intent="high" />
        <KpiCard label="Total clauses" value={stats.totalClauses} spark={[5, 8, 12, 16, 18, 20, stats.totalClauses]} />
      </div>

      <Section title="Risk heatmap" hint="clause type × document">
        <div style={{ padding: 16, overflowX: 'auto' }}>
          <table className="v3-table" style={{ background: 'transparent', borderCollapse: 'separate', borderSpacing: 2 }}>
            <thead>
              <tr>
                <th style={{ background: 'transparent', borderBottom: 0, padding: '4px 8px' }}>Document</th>
                {allClauseTypes.slice(0, 14).map((t) => (
                  <th key={t} style={{ background: 'transparent', borderBottom: 0, padding: '4px 2px', textAlign: 'center', maxWidth: 80 }}>
                    <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: 10, color: 'var(--v3-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {formatClauseType(t)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docAnalyses.map(({ doc, summary }, rowIdx) => (
                <tr key={doc.id}>
                  <td className="v3-mono" style={{ padding: '6px 10px', borderBottom: 0, fontSize: 12, color: 'var(--v3-text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link href={`/documents/${doc.id}`} style={{ color: 'inherit' }}>{doc.filename}</Link>
                  </td>
                  {allClauseTypes.slice(0, 14).map((t, colIdx) => {
                    const cell = summary?.clause_breakdown?.[t]
                    return (
                      <td key={t} style={{ padding: 0, borderBottom: 0 }}>
                        <HeatmapCell
                          count={cell?.total ?? 0}
                          level={cellLevel(cell?.risk_levels)}
                          delay={colIdx * 30 + rowIdx * 60}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <Section title="Clause distribution" hint="across portfolio">
          <div style={{ padding: 16, height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={distribution} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#a1a1aa' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: '#1d1d22', border: '1px solid #27272a', borderRadius: 8, fontSize: 12, color: '#fafafa' }} />
                <Bar dataKey="count" radius={[4, 4, 4, 4]} fill="#d4a82d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Portfolio risk" hint="four-tier breakdown">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {([
              ['critical', stats.critical, 'var(--v3-risk-critical)'],
              ['high', stats.high, 'var(--v3-risk-high)'],
              ['medium', stats.medium, 'var(--v3-risk-medium)'],
              ['low', stats.low, 'var(--v3-risk-low)'],
            ] as const).map(([level, count, color]) => (
              <div key={level} style={{ padding: 12, border: '1px solid var(--v3-border)', borderRadius: 8, background: 'var(--v3-panel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
                  <span className="v3-mono" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v3-text-muted)' }}>{level}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--v3-text-muted)', marginTop: 2 }}>
                  {stats.totalClauses > 0 ? Math.round((count / stats.totalClauses) * 100) : 0}% of clauses
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Top risk findings" hint={`${highlights.length} flagged across portfolio`}>
        <div>
          {highlights.slice(0, 6).map((h, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: i < 5 ? '1px solid var(--v3-border)' : '0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <RiskPill level={h.risk_level as RiskLevel} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: 'var(--v3-text-primary)' }}>{h.summary}</div>
                <div style={{ marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-muted)' }}>{formatClauseType(h.clause_type)}</span>
                  <Link href={`/documents/${h.docId}`} className="v3-mono" style={{ fontSize: 11, color: 'var(--v3-text-secondary)', textDecoration: 'none' }}>
                    {h.docName} ↗
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {highlights.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--v3-text-muted)', fontSize: 13 }}>No high-risk findings.</div>
          )}
        </div>
      </Section>

      {crossRefs.length > 0 && (
        <Section title="Cross-document entities" hint="resolved across portfolio">
          <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {crossRefs.slice(0, 24).map((e) => (
              <EntityChip key={e.normalized_name + e.entity_type} type={e.entity_type.toLowerCase()} name={e.normalized_name} count={e.document_count} />
            ))}
          </div>
        </Section>
      )}
    </V3Shell>
  )
}
