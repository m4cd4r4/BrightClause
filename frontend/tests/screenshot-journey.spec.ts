/**
 * BrightClause Screenshot Journey
 *
 * Captures ~25 screenshots of the app's VALUE — the intelligence extracted from PDFs.
 * Uses mock data via route interception for deterministic, reproducible results.
 * Output: demo-video/public/assets/journey/
 */
import { test, Page } from '@playwright/test'
import * as path from 'path'
import {
  mockDocuments, mockSearchStats, mockAnalysisSummary, mockClauses,
  mockExplanation, mockObligations, mockTimeline, mockChatResponse,
  mockEntities, mockGraphData, mockReport, mockDeals, mockDealDetail,
  mockActivities, mockSearchResults, mockGraphTypes, mockClauseTypes,
} from './fixtures/mock-journey-data'

const OUTPUT_DIR = path.resolve(__dirname, '../../demo-video/public/assets/journey')
let screenshotIndex = 0

async function capture(page: Page, name: string) {
  screenshotIndex += 10
  const filename = `${String(screenshotIndex).padStart(3, '0')}-${name}.png`
  await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: false })
}

async function captureFullPage(page: Page, name: string) {
  screenshotIndex += 10
  const filename = `${String(screenshotIndex).padStart(3, '0')}-${name}.png`
  await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: true })
}

async function captureElement(page: Page, selector: string, name: string) {
  screenshotIndex += 10
  const filename = `${String(screenshotIndex).padStart(3, '0')}-${name}.png`
  const el = page.locator(selector).first()
  try {
    await el.waitFor({ state: 'visible', timeout: 5000 })
    await el.screenshot({ path: path.join(OUTPUT_DIR, filename) })
  } catch {
    await page.screenshot({ path: path.join(OUTPUT_DIR, filename), fullPage: false })
  }
}

/**
 * Set up route interception using a single handler that dispatches based on URL.
 * This avoids Playwright route priority issues.
 */
async function setupMockRoutes(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const method = route.request().method()
    const pathname = new URL(url).pathname

    // === Documents ===
    if (pathname === '/api/documents' || pathname.match(/^\/api\/documents$/)) {
      return route.fulfill({ json: mockDocuments })
    }
    if (pathname === '/api/documents/doc-acme-acquisition') {
      return route.fulfill({ json: mockDocuments.documents[0] })
    }
    if (pathname === '/api/documents/doc-techstart-nda') {
      return route.fulfill({ json: mockDocuments.documents[1] })
    }
    if (pathname === '/api/documents/doc-globaltrade-jv') {
      return route.fulfill({ json: mockDocuments.documents[2] })
    }

    // === Search ===
    if (pathname === '/api/search/stats') {
      return route.fulfill({ json: mockSearchStats })
    }
    if (pathname === '/api/search') {
      return route.fulfill({ json: mockSearchResults })
    }

    // === Analysis: explain must come BEFORE generic clauses ===
    if (pathname.includes('/clauses/') && pathname.includes('/explain')) {
      return route.fulfill({ json: mockExplanation })
    }
    if (pathname.match(/\/api\/analysis\/[^/]+\/summary$/)) {
      return route.fulfill({ json: mockAnalysisSummary })
    }
    if (pathname.match(/\/api\/analysis\/[^/]+\/clauses/)) {
      return route.fulfill({ json: mockClauses })
    }
    if (pathname.match(/\/api\/analysis\/[^/]+\/report$/)) {
      return route.fulfill({ json: mockReport })
    }
    if (pathname === '/api/analysis/clause-types') {
      return route.fulfill({ json: mockClauseTypes })
    }

    // === Obligations ===
    if (pathname.includes('/obligations')) {
      if (pathname.includes('/extract')) {
        return route.fulfill({ json: { document_id: 'doc-acme-acquisition', obligations_found: 7, message: 'ok' } })
      }
      if (pathname.includes('/all')) {
        return route.fulfill({ json: mockObligations })
      }
      return route.fulfill({
        json: {
          document_id: 'doc-acme-acquisition',
          filename: mockDocuments.documents[0].filename,
          obligations: mockObligations.obligations.filter(o => o.document_id === 'doc-acme-acquisition'),
          total: 5,
        },
      })
    }

    // === Timeline ===
    if (pathname.match(/\/api\/graph\/timeline\//)) {
      return route.fulfill({ json: mockTimeline })
    }

    // === Chat ===
    if (pathname.match(/\/api\/chat\//)) {
      return route.fulfill({ json: mockChatResponse })
    }

    // === Graph ===
    if (pathname === '/api/graph/stats') {
      return route.fulfill({
        json: {
          documents_with_entities: 5,
          entity_counts: { party: 2, person: 2, amount: 2, date: 1, location: 1, term: 1, percentage: 1 },
          total_entities: 10,
        },
      })
    }
    if (pathname === '/api/graph/types') {
      return route.fulfill({ json: mockGraphTypes })
    }
    if (pathname.match(/\/api\/graph\/[^/]+\/entities/)) {
      return route.fulfill({ json: mockEntities })
    }
    if (pathname.includes('/cross-reference')) {
      return route.fulfill({
        json: {
          entities: [
            { normalized_name: 'Acme Corp', entity_type: 'party', document_count: 3, documents: [
              { document_id: 'doc-acme-acquisition', filename: 'Acme Corp — Asset Purchase Agreement.pdf', contexts: ['Buyer'] },
              { document_id: 'doc-techstart-nda', filename: 'TechStart Inc — Mutual NDA.pdf', contexts: ['Referenced'] },
              { document_id: 'doc-globaltrade-jv', filename: 'GlobalTrade JV — Joint Venture Agreement.pdf', contexts: ['Partner'] },
            ]},
            { normalized_name: 'Smith & Associates LLP', entity_type: 'party', document_count: 2, documents: [
              { document_id: 'doc-acme-acquisition', filename: 'Acme Corp — Asset Purchase Agreement.pdf', contexts: ['Legal Counsel'] },
              { document_id: 'doc-globaltrade-jv', filename: 'GlobalTrade JV — Joint Venture Agreement.pdf', contexts: ['Advisor'] },
            ]},
            { normalized_name: 'Indemnification', entity_type: 'term', document_count: 4, documents: [
              { document_id: 'doc-acme-acquisition', filename: 'Acme Corp — Asset Purchase Agreement.pdf', contexts: ['Section 8.1'] },
              { document_id: 'doc-techstart-nda', filename: 'TechStart Inc — Mutual NDA.pdf', contexts: ['Section 5'] },
              { document_id: 'doc-globaltrade-jv', filename: 'GlobalTrade JV — Joint Venture Agreement.pdf', contexts: ['Article VII'] },
              { document_id: 'doc-sunrise-lease', filename: 'Sunrise Properties — Commercial Lease.pdf', contexts: ['Section 12'] },
            ]},
          ],
          total: 3,
        },
      })
    }
    if (pathname.match(/\/api\/graph\/[^/]+$/) && !pathname.includes('stats') && !pathname.includes('types')) {
      return route.fulfill({ json: mockGraphData })
    }

    // === Deals ===
    if (pathname === '/api/deals/deal-acme') {
      return route.fulfill({ json: mockDealDetail })
    }
    if (pathname === '/api/deals') {
      if (method === 'GET') return route.fulfill({ json: mockDeals })
      return route.fulfill({ json: { id: 'deal-new', name: 'New Deal' } })
    }

    // === Activity ===
    if (pathname.startsWith('/api/activity')) {
      return route.fulfill({ json: mockActivities })
    }

    // === Health ===
    if (pathname === '/api/health') {
      return route.fulfill({ json: { status: 'healthy' } })
    }

    // Catch-all — return empty but log
    console.log(`[mock] Unmatched: ${method} ${pathname}`)
    return route.fulfill({ json: {} })
  })
}

test.describe('BrightClause Screenshot Journey', () => {
  test.setTimeout(240_000)

  test('capture results journey', async ({ page }) => {
    screenshotIndex = 0

    await page.emulateMedia({ reducedMotion: 'reduce' })

    // Dismiss walkthrough tour
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })

    await setupMockRoutes(page)

    // ── PHASE 1: Dashboard with data ──────────────────────────────────────
    await page.goto('/dashboard')
    await page.waitForTimeout(2500)

    await capture(page, 'dashboard-full')
    await captureElement(page, '[data-tour="stats"]', 'dashboard-stats')

    // Click first document to load risk assessment panel
    const acmeDoc = page.locator('h3').filter({ hasText: /Acme Corp/ }).first()
    try {
      await acmeDoc.waitFor({ state: 'visible', timeout: 5000 })
      await acmeDoc.click({ timeout: 5000 })
      await page.waitForTimeout(1500)
      await captureElement(page, '[data-tour="analysis"]', 'dashboard-risk-panel')
      await capture(page, 'dashboard-with-analysis')
    } catch {
      // Dashboard document list might not be clickable — skip risk panel
      screenshotIndex += 20
    }

    // ── PHASE 2: Document Detail — THE VALUE ──────────────────────────────
    await page.goto('/documents/doc-acme-acquisition')
    await page.waitForTimeout(2500)

    await capture(page, 'document-analysis-full')

    // Risk summary cards
    const riskGrid = page.locator('[class*="grid"]').filter({
      has: page.locator('text=/Critical|High|Medium|Low/'),
    }).first()
    try {
      await riskGrid.waitFor({ state: 'visible', timeout: 3000 })
      screenshotIndex += 10
      await riskGrid.screenshot({
        path: path.join(OUTPUT_DIR, `${String(screenshotIndex).padStart(3, '0')}-risk-summary-cards.png`),
      })
    } catch {
      screenshotIndex += 10
    }

    // Clause type sidebar
    await captureElement(page, '[class*="sticky"]', 'clause-type-sidebar')

    // Expand the Termination clause
    const terminationBtn = page.locator('button').filter({ hasText: /Termination/ }).first()
    try {
      await terminationBtn.scrollIntoViewIfNeeded({ timeout: 3000 })
      await terminationBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1000)
      await page.evaluate(() => window.scrollBy(0, 300))
      await page.waitForTimeout(500)
      await capture(page, 'clause-critical-expanded')
    } catch {
      screenshotIndex += 10
    }

    // Click "Explain in Plain English"
    const explainBtn = page.locator('button').filter({ hasText: /Explain in Plain English/ }).first()
    try {
      await explainBtn.scrollIntoViewIfNeeded({ timeout: 3000 })
      await explainBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1500)
      await capture(page, 'clause-plain-english')
    } catch {
      try {
        await explainBtn.click({ force: true, timeout: 3000 })
        await page.waitForTimeout(1500)
        await capture(page, 'clause-plain-english')
      } catch {
        screenshotIndex += 10
      }
    }

    // Expand Indemnification clause
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const indemnBtn = page.locator('button').filter({ hasText: /Indemnification/ }).first()
    try {
      await indemnBtn.scrollIntoViewIfNeeded({ timeout: 3000 })
      await indemnBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1000)
      await page.evaluate(() => window.scrollBy(0, 300))
      await page.waitForTimeout(500)
      await capture(page, 'clause-indemnification')
    } catch {
      screenshotIndex += 10
    }

    // ── PHASE 3: Executive Report Modal ───────────────────────────────────
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    const reportBtn = page.locator('button').filter({ hasText: /Report/ }).first()
    try {
      await reportBtn.scrollIntoViewIfNeeded({ timeout: 3000 })
      await reportBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1500)
      await capture(page, 'report-modal')
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    } catch {
      screenshotIndex += 10
    }

    // ── PHASE 4: Chat — Contract Q&A ──────────────────────────────────────
    // Chat is a floating panel on the document detail page (bottom-right button)
    const chatToggle = page.locator('button').filter({ hasText: /Ask AI/ }).first()
    const hasChatBtn = await chatToggle.count() > 0
    if (hasChatBtn) {
      try {
        await chatToggle.click({ timeout: 5000 })
        await page.waitForTimeout(1000)
        await capture(page, 'chat-starters')

        // Click a starter question
        const starterQ = page.locator('button').filter({ hasText: /key risks/ }).first()
        await starterQ.click({ timeout: 5000 })
        await page.waitForTimeout(1500)
        await capture(page, 'chat-ai-response')

        // Close chat
        const closeToggle = page.locator('button').filter({ hasText: /Close/ }).first()
        await closeToggle.click({ timeout: 3000 })
        await page.waitForTimeout(300)
      } catch {
        screenshotIndex += 20
      }
    } else {
      // No chat button available — skip
      screenshotIndex += 20
    }

    // ── PHASE 5: Obligations Tracker ──────────────────────────────────────
    await page.goto('/obligations')
    await page.waitForTimeout(2500)

    await capture(page, 'obligations-full')
    await captureFullPage(page, 'obligations-full-page')

    // ── PHASE 6: Deals ──────────────────────────────────────────────────────
    await page.goto('/deals')
    await page.waitForTimeout(2000)

    await capture(page, 'deals-list')

    // Try navigating to deal detail
    const dealLink = page.locator('a, [role="link"], button').filter({ hasText: /Acme Corp Acquisition/ }).first()
    try {
      await dealLink.click({ timeout: 5000 })
      await page.waitForTimeout(2000)
      await capture(page, 'deal-detail-risk')
    } catch {
      screenshotIndex += 10
    }

    // ── PHASE 7: Search Results ───────────────────────────────────────────
    await page.goto('/search')
    await page.waitForTimeout(1500)

    const searchInput = page.locator('input[type="search"], input[type="text"], input[placeholder*="earch"]').first()
    try {
      await searchInput.fill('termination rights')
      await searchInput.press('Enter')
      await page.waitForTimeout(1500)
      await capture(page, 'search-results')
    } catch {
      screenshotIndex += 10
      await capture(page, 'search-page')
    }

    // ── PHASE 8: Analytics / Knowledge Graph ─────────────────────────────
    await page.goto('/analytics')
    await page.waitForTimeout(2000)
    await capture(page, 'analytics-overview')

    // ── PHASE 9: Final full-page captures ────────────────────────────────
    await page.goto('/documents/doc-acme-acquisition')
    await page.waitForTimeout(2500)
    await captureFullPage(page, 'document-full-page')
  })
})
