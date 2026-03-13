import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const SAMPLE_DIR = path.resolve('I:/Scratch/ContractClarity/sample-contracts/scribd-downloads')
const REPORT_DIR = path.resolve('test-results/contract-portfolio')

// Discover all PDF files in the sample directory
const CONTRACTS = fs.readdirSync(SAMPLE_DIR)
  .filter(f => f.toLowerCase().endsWith('.pdf'))
  .sort()

function slug(filename: string): string {
  return filename.replace(/\.pdf$/i, '')
}

interface ContractResult {
  filename: string
  id: string | null
  status: string
  pageCount: number
  chunkCount: number
  clauseCount: number
  riskSummary: Record<string, number>
  overallRisk: string
  screenshots: string[]
  errors: string[]
}

// Shared state across serial tests
const uploadedIds: Record<string, string> = {}
const results: ContractResult[] = []

test.describe.serial('Contract Portfolio — Full Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
  })

  // ── Pre-flight ─────────────────────────────────────────────
  test('Pre-flight: verify backend is healthy', async ({ request }) => {
    test.setTimeout(15_000)
    const res = await request.get(`${BASE_URL}/api/health`)
    expect(res.status(), 'Backend should return 200').toBe(200)
    const body = await res.text()
    expect(body).toContain('healthy')
    console.log(`[PRE-FLIGHT] Backend healthy at ${BASE_URL}`)
    console.log(`[PRE-FLIGHT] Found ${CONTRACTS.length} sample PDFs to process`)
  })

  // ── Phase 1: Batch Upload ─────────────────────────────────
  test('Phase 1: Upload all sample contracts', async ({ page }) => {
    test.setTimeout(300_000) // 5 minutes for all uploads
    fs.mkdirSync(REPORT_DIR, { recursive: true })

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    await page.screenshot({ path: path.join(REPORT_DIR, '00-dashboard-before.png') })

    // Upload all PDFs at once via multi-file chooser
    const filePaths = CONTRACTS.map(f => path.join(SAMPLE_DIR, f))
    const chooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /Upload/i }).click()
    const chooser = await chooserPromise
    await chooser.setFiles(filePaths)

    console.log(`[UPLOAD] Sending ${CONTRACTS.length} files via multi-upload...`)

    // Wait for the multi-upload to finish (button re-enabled, success toast)
    // The app uploads sequentially, ~2-5s per file
    await expect(page.getByRole('button', { name: /Upload/i })).toBeEnabled({
      timeout: CONTRACTS.length * 10_000
    })
    await page.waitForTimeout(2000)

    await page.screenshot({
      path: path.join(REPORT_DIR, '01-dashboard-after-upload.png'),
      fullPage: true,
    })

    // Verify documents appear in the API
    const res = await page.request.get(`${BASE_URL}/api/documents?limit=50`)
    const data = (await res.json()) as { documents: any[]; total: number }

    for (const doc of data.documents) {
      if (CONTRACTS.includes(doc.filename)) {
        uploadedIds[doc.filename] = doc.id
      }
    }

    const matched = Object.keys(uploadedIds).length
    console.log(`[UPLOAD] ${matched}/${CONTRACTS.length} contracts found in API`)
    expect(matched, 'All contracts should be uploaded').toBeGreaterThanOrEqual(CONTRACTS.length - 1)
  })

  // ── Phase 2: Wait for Processing ──────────────────────────
  test('Phase 2: Wait for all documents to finish processing', async ({ page }) => {
    test.setTimeout(900_000) // 15 minutes max

    let allDone = false
    let attempt = 0

    while (!allDone && attempt < 180) {
      const res = await page.request.get(`${BASE_URL}/api/documents?limit=50`)
      const data = (await res.json()) as { documents: any[] }

      // Update IDs for any we missed
      for (const doc of data.documents) {
        if (CONTRACTS.includes(doc.filename) && !uploadedIds[doc.filename]) {
          uploadedIds[doc.filename] = doc.id
        }
      }

      const ourDocs = data.documents.filter(d => CONTRACTS.includes(d.filename))
      const completed = ourDocs.filter(d => d.status === 'completed').length
      const failed = ourDocs.filter(d => d.status === 'failed').length
      const processing = ourDocs.filter(d =>
        ['queued', 'processing', 'uploading'].includes(d.status)
      ).length

      if (attempt % 6 === 0) {
        console.log(
          `[POLL #${attempt}] Completed: ${completed} | Processing: ${processing} | Failed: ${failed} | Total: ${ourDocs.length}`
        )
      }

      if (processing === 0) {
        allDone = true
      } else {
        await page.waitForTimeout(5000)
        attempt++
      }
    }

    // Screenshot dashboard with all processed documents
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)
    await page.screenshot({
      path: path.join(REPORT_DIR, '02-dashboard-all-processed.png'),
      fullPage: true,
    })

    expect(allDone, 'All documents should finish processing within 15 minutes').toBeTruthy()
    console.log('[PROCESSING] All documents finished processing')
  })

  // ── Phase 3: Analyze Each Contract ────────────────────────
  for (const filename of CONTRACTS) {
    test(`Phase 3: Analyze — ${slug(filename)}`, async ({ page }) => {
      test.setTimeout(300_000) // 5 minutes per contract (extraction can be slow)

      const contractDir = path.join(REPORT_DIR, slug(filename))
      fs.mkdirSync(contractDir, { recursive: true })

      const result: ContractResult = {
        filename,
        id: null,
        status: 'unknown',
        pageCount: 0,
        chunkCount: 0,
        clauseCount: 0,
        riskSummary: {},
        overallRisk: 'unknown',
        screenshots: [],
        errors: [],
      }

      // ── Find document by filename ──
      const listRes = await page.request.get(`${BASE_URL}/api/documents?limit=50`)
      const listData = (await listRes.json()) as { documents: any[] }
      const matches = listData.documents
        .filter((d: any) => d.filename === filename)
        .sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      const doc = matches[0]

      if (!doc) {
        result.errors.push('Document not found in API after upload')
        results.push(result)
        console.log(`[SKIP] ${filename} — not found`)
        return
      }

      result.id = doc.id
      result.status = doc.status
      result.pageCount = doc.page_count || 0
      result.chunkCount = doc.chunk_count || 0

      if (doc.status !== 'completed') {
        result.errors.push(`Processing status: ${doc.status}`)
        results.push(result)
        console.log(`[SKIP] ${filename} — status is ${doc.status}`)
        return
      }

      // ── Document Detail Page ──
      await page.goto(`${BASE_URL}/documents/${doc.id}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      await page.screenshot({ path: path.join(contractDir, '02-detail-overview.png') })
      result.screenshots.push('02-detail-overview.png')

      // ── Trigger Clause Extraction via API (uses Ollama, no BYOK needed) ──
      const summaryRes = await page.request.get(
        `${BASE_URL}/api/analysis/${doc.id}/summary`
      ).catch(() => null)
      const summaryData = summaryRes?.ok() ? await summaryRes.json() as any : null

      if (summaryData && summaryData.clauses_extracted > 0) {
        // Already extracted — just record
        result.clauseCount = summaryData.clauses_extracted
        result.riskSummary = summaryData.risk_summary || {}
        result.overallRisk = summaryData.overall_risk || 'unknown'
        console.log(`[CLAUSES] ${filename} — already extracted: ${result.clauseCount} clauses`)
      } else {
        // Trigger extraction via API (bypasses BYOK modal, uses Ollama)
        console.log(`[EXTRACT] ${filename} — triggering clause extraction...`)
        const extractRes = await page.request.post(
          `${BASE_URL}/api/analysis/${doc.id}/extract`,
          { data: {} }
        ).catch(() => null)

        if (extractRes?.ok()) {
          await page.screenshot({ path: path.join(contractDir, '03-extraction-triggered.png') })
          result.screenshots.push('03-extraction-triggered.png')

          // Poll for extraction completion (up to 3 minutes)
          for (let i = 0; i < 60; i++) {
            await page.waitForTimeout(3000)
            const pollRes = await page.request.get(
              `${BASE_URL}/api/analysis/${doc.id}/summary`
            ).catch(() => null)
            if (pollRes?.ok()) {
              const pollData = await pollRes.json() as any
              if (pollData.clauses_extracted > 0) {
                result.clauseCount = pollData.clauses_extracted
                result.riskSummary = pollData.risk_summary || {}
                result.overallRisk = pollData.overall_risk || 'unknown'
                console.log(`[EXTRACT] ${filename} — done: ${result.clauseCount} clauses`)
                break
              }
            }
          }
        } else {
          const errText = extractRes ? `HTTP ${extractRes.status()}` : 'request failed'
          result.errors.push(`Extraction failed: ${errText}`)
          console.log(`[EXTRACT] ${filename} — failed: ${errText}`)
        }
      }

      // ── Reload detail page to show clauses ──
      await page.goto(`${BASE_URL}/documents/${doc.id}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)
      await page.screenshot({
        path: path.join(contractDir, '04-analysis-with-clauses.png'),
        fullPage: true,
      })
      result.screenshots.push('04-analysis-with-clauses.png')

      // ── Scroll down to see clause cards ──
      await page.evaluate(() => window.scrollBy(0, 800))
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(contractDir, '05-clause-cards.png') })
      result.screenshots.push('05-clause-cards.png')

      // ── Fetch clauses for the report ──
      const clauseRes = await page.request.get(
        `${BASE_URL}/api/analysis/${doc.id}/clauses`
      ).catch(() => null)
      if (clauseRes?.ok()) {
        const clauseData = await clauseRes.json() as any[]
        result.clauseCount = clauseData.length
      }

      // ── Knowledge Graph ──
      const graphLink = page.locator('a:has-text("Graph")')
      if (await graphLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await graphLink.click()
        await page.waitForTimeout(3000)
        await page.screenshot({ path: path.join(contractDir, '06-knowledge-graph.png') })
        result.screenshots.push('06-knowledge-graph.png')
      }

      results.push(result)
      console.log(
        `[DONE] ${filename} | Pages: ${result.pageCount} | Chunks: ${result.chunkCount} | ` +
        `Clauses: ${result.clauseCount} | Risk: ${result.overallRisk}`
      )
    })
  }

  // ── Phase 4: Summary Report ───────────────────────────────
  test('Phase 4: Generate summary report', async ({ request }) => {
    test.setTimeout(30_000)

    // Fetch final document state
    const res = await request.get(`${BASE_URL}/api/documents?limit=50`)
    const data = (await res.json()) as { documents: any[]; total: number }
    const ourDocs = data.documents.filter(d => CONTRACTS.includes(d.filename))

    // Fill in any results that weren't captured (e.g. skipped tests)
    for (const doc of ourDocs) {
      if (!results.find(r => r.filename === doc.filename)) {
        results.push({
          filename: doc.filename,
          id: doc.id,
          status: doc.status,
          pageCount: doc.page_count || 0,
          chunkCount: doc.chunk_count || 0,
          clauseCount: 0,
          riskSummary: {},
          overallRisk: 'unknown',
          screenshots: [],
          errors: ['Test was skipped or not run'],
        })
      }
    }

    // Sort results by filename
    results.sort((a, b) => a.filename.localeCompare(b.filename))

    const completed = results.filter(r => r.status === 'completed')
    const failed = results.filter(r => r.status === 'failed')
    const withClauses = results.filter(r => r.clauseCount > 0)
    const totalPages = results.reduce((sum, r) => sum + r.pageCount, 0)
    const totalChunks = results.reduce((sum, r) => sum + r.chunkCount, 0)
    const totalClauses = results.reduce((sum, r) => sum + r.clauseCount, 0)

    // ── JSON Report ──
    const jsonReport = {
      generated: new Date().toISOString(),
      baseUrl: BASE_URL,
      totalContracts: CONTRACTS.length,
      summary: {
        completed: completed.length,
        failed: failed.length,
        withClauses: withClauses.length,
        totalPages,
        totalChunks,
        totalClauses,
      },
      contracts: results,
    }

    fs.writeFileSync(
      path.join(REPORT_DIR, 'summary-report.json'),
      JSON.stringify(jsonReport, null, 2)
    )

    // ── Markdown Report ──
    const lines: string[] = []
    lines.push('# Contract Portfolio Analysis Report')
    lines.push('')
    lines.push(`**Generated:** ${jsonReport.generated}`)
    lines.push(`**Target:** ${BASE_URL}`)
    lines.push(`**Total Contracts:** ${CONTRACTS.length}`)
    lines.push('')
    lines.push('## Summary')
    lines.push('')
    lines.push('| Metric | Value |')
    lines.push('|--------|-------|')
    lines.push(`| Processed Successfully | ${completed.length} |`)
    lines.push(`| Failed | ${failed.length} |`)
    lines.push(`| With Extracted Clauses | ${withClauses.length} |`)
    lines.push(`| Total Pages | ${totalPages} |`)
    lines.push(`| Total Text Chunks | ${totalChunks} |`)
    lines.push(`| Total Clauses Extracted | ${totalClauses} |`)
    lines.push('')
    lines.push('## Per-Contract Results')
    lines.push('')
    lines.push('| # | Contract | Status | Pages | Chunks | Clauses | Overall Risk |')
    lines.push('|---|----------|--------|-------|--------|---------|--------------|')

    results.forEach((r, i) => {
      const risk = r.overallRisk !== 'unknown' ? r.overallRisk : '—'
      lines.push(
        `| ${i + 1} | ${slug(r.filename)} | ${r.status} | ${r.pageCount} | ${r.chunkCount} | ${r.clauseCount} | ${risk} |`
      )
    })

    // Risk breakdown section
    const allRisks: Record<string, number> = {}
    for (const r of results) {
      for (const [level, count] of Object.entries(r.riskSummary)) {
        allRisks[level] = (allRisks[level] || 0) + (count as number)
      }
    }

    if (Object.keys(allRisks).length > 0) {
      lines.push('')
      lines.push('## Risk Distribution (All Contracts)')
      lines.push('')
      lines.push('| Risk Level | Clause Count |')
      lines.push('|------------|-------------|')
      for (const level of ['critical', 'high', 'medium', 'low']) {
        if (allRisks[level]) {
          lines.push(`| ${level.charAt(0).toUpperCase() + level.slice(1)} | ${allRisks[level]} |`)
        }
      }
    }

    // Errors section
    const withErrors = results.filter(r => r.errors.length > 0)
    if (withErrors.length > 0) {
      lines.push('')
      lines.push('## Issues')
      lines.push('')
      for (const r of withErrors) {
        lines.push(`- **${r.filename}**: ${r.errors.join('; ')}`)
      }
    }

    lines.push('')
    lines.push('## Screenshots')
    lines.push('')
    lines.push(`All screenshots saved to \`${REPORT_DIR}/\``)
    lines.push('')
    for (const r of results) {
      if (r.screenshots.length > 0) {
        lines.push(`### ${slug(r.filename)}`)
        for (const s of r.screenshots) {
          lines.push(`- \`${slug(r.filename)}/${s}\``)
        }
        lines.push('')
      }
    }

    fs.writeFileSync(path.join(REPORT_DIR, 'summary-report.md'), lines.join('\n'))

    // ── Console Summary ──
    console.log('')
    console.log('='.repeat(72))
    console.log('  CONTRACT PORTFOLIO ANALYSIS REPORT')
    console.log('='.repeat(72))
    console.log(`  Contracts tested:      ${CONTRACTS.length}`)
    console.log(`  Processed OK:          ${completed.length}`)
    console.log(`  Failed:                ${failed.length}`)
    console.log(`  With clauses:          ${withClauses.length}`)
    console.log(`  Total pages:           ${totalPages}`)
    console.log(`  Total chunks:          ${totalChunks}`)
    console.log(`  Total clauses:         ${totalClauses}`)
    if (Object.keys(allRisks).length > 0) {
      console.log('  Risk breakdown:')
      for (const level of ['critical', 'high', 'medium', 'low']) {
        if (allRisks[level]) {
          console.log(`    ${level.padEnd(12)} ${allRisks[level]}`)
        }
      }
    }
    console.log('─'.repeat(72))
    console.log(`  JSON report:  ${path.join(REPORT_DIR, 'summary-report.json')}`)
    console.log(`  MD report:    ${path.join(REPORT_DIR, 'summary-report.md')}`)
    console.log(`  Screenshots:  ${REPORT_DIR}/`)
    console.log('='.repeat(72))
    console.log('')
  })
})
