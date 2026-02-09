import type { Document as ContractDocument, AnalysisSummary, Clause, Entity } from './api'

export async function exportToExcel(
  document: ContractDocument,
  analysis: AnalysisSummary | null,
  clauses: Clause[],
  entities: Entity[]
): Promise<void> {
  const { exportToExcel: fn } = await import('./export')
  return fn(document, analysis, clauses, entities)
}

export async function exportToWord(
  document: ContractDocument,
  analysis: AnalysisSummary | null,
  clauses: Clause[],
  entities: Entity[]
): Promise<void> {
  const { exportToWord: fn } = await import('./export')
  return fn(document, analysis, clauses, entities)
}

export async function exportToPDF(
  document: ContractDocument,
  analysis: AnalysisSummary | null,
  clauses: Clause[],
  entities: Entity[]
): Promise<void> {
  const { exportToPDF: fn } = await import('./export')
  return fn(document, analysis, clauses, entities)
}

export async function exportToCSV(
  document: ContractDocument,
  clauses: Clause[]
): Promise<void> {
  const { exportToCSV: fn } = await import('./export')
  return fn(document, clauses)
}

export async function exportToJSON(
  document: ContractDocument,
  analysis: AnalysisSummary | null,
  clauses: Clause[],
  entities: Entity[]
): Promise<void> {
  const { exportToJSON: fn } = await import('./export')
  return fn(document, analysis, clauses, entities)
}
