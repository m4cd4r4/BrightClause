/**
 * Visual Screenshots for PR Comments
 *
 * Triggered by GitHub Actions on Vercel preview deployments.
 * Captures key sections of the landing page and the dashboard,
 * saving to test-screenshots/ for upload to the screenshots branch.
 *
 * Run: BASE_URL=<preview-url> npx playwright test tests/visual-screenshots.spec.ts --project=chromium
 */
import { test, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { mockDocuments, mockSearchStats, mockAnalysisSummary, mockClauses,
  mockExplanation, mockObligations, mockTimeline, mockChatResponse,
  mockEntities, mockGraphData, mockReport, mockDeals, mockDealDetail,
  mockActivities, mockSearchResults, mockGraphTypes, mockClauseTypes,
} from './fixtures/mock-journey-data'

const OUTPUT_DIR = path.resolve(__dirname, '../test-screenshots')

async function capture(page: Page, name: string) {
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}.png`),
    fullPage: false,
  })
}

async function scrollToSection(page: Page, text: string) {
  try {
    const el = page.getByText(text, { exact: false }).first()
    await el.scrollIntoViewIfNeeded({ timeout: 5000 })
    // Nudge up a bit so heading is in frame
    await page.evaluate(() => window.scrollBy(0, -80))
    await page.waitForTimeout(600)
  } catch {
    // section may not exist — skip scroll
  }
}

async function setupMockRoutes(page: Page) {
  await page.route('**/api/**', (route) => {
    const url = route.request().url()
    const method = route.request().method()
    const pathname = new URL(url).pathname

    if (pathname === '/api/documents' || pathname.match(/^\/api\/documents$/))
      return route.fulfill({ json: mockDocuments })
    if (pathname === '/api/documents/doc-acme-acquisition')
      return route.fulfill({ json: mockDocuments.documents[0] })
    if (pathname === '/api/search/stats')
      return route.fulfill({ json: mockSearchStats })
    if (pathname === '/api/search')
      return route.fulfill({ json: mockSearchResults })
    if (pathname.includes('/clauses/') && pathname.includes('/explain'))
      return route.fulfill({ json: mockExplanation })
    if (pathname.match(/\/api\/analysis\/[^/]+\/summary$/))
      return route.fulfill({ json: mockAnalysisSummary })
    if (pathname.match(/\/api\/analysis\/[^/]+\/clauses/))
      return route.fulfill({ json: mockClauses })
    if (pathname.match(/\/api\/analysis\/[^/]+\/report$/))
      return route.fulfill({ json: mockReport })
    if (pathname === '/api/analysis/clause-types')
      return route.fulfill({ json: mockClauseTypes })
    if (pathname.includes('/obligations')) {
      if (pathname.includes('/extract'))
        return route.fulfill({ json: { document_id: 'doc-acme-acquisition', obligations_found: 7, message: 'ok' } })
      if (pathname.includes('/all'))
        return route.fulfill({ json: mockObligations })
      return route.fulfill({ json: {
        document_id: 'doc-acme-acquisition',
        filename: mockDocuments.documents[0].filename,
        obligations: mockObligations.obligations.filter(o => o.document_id === 'doc-acme-acquisition'),
        total: 5,
      }})
    }
    if (pathname.match(/\/api\/graph\/timeline\//))
      return route.fulfill({ json: mockTimeline })
    if (pathname.match(/\/api\/chat\//))
      return route.fulfill({ json: mockChatResponse })
    if (pathname === '/api/graph/stats')
      return route.fulfill({ json: {
        documents_with_entities: 5,
        entity_counts: { party: 2, person: 2, amount: 2, date: 1, location: 1, term: 1, percentage: 1 },
        total_entities: 10,
      }})
    if (pathname === '/api/graph/types')
      return route.fulfill({ json: mockGraphTypes })
    if (pathname.match(/\/api\/graph\/[^/]+\/entities/))
      return route.fulfill({ json: mockEntities })
    if (pathname === '/api/deals/deal-acme')
      return route.fulfill({ json: mockDealDetail })
    if (pathname === '/api/deals') {
      if (method === 'GET') return route.fulfill({ json: mockDeals })
      return route.fulfill({ json: { id: 'deal-new', name: 'New Deal' } })
    }
    if (pathname.startsWith('/api/activity'))
      return route.fulfill({ json: mockActivities })
    if (pathname === '/api/health')
      return route.fulfill({ json: { status: 'healthy' } })

    return route.fulfill({ json: {} })
  })
}

test.describe('Visual Screenshots', () => {
  test.setTimeout(120_000)

  test.beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  })

  test('landing — hero', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await capture(page, 'landing')
  })

  test('landing — screenshot showcase', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await scrollToSection(page, 'See It In Action')
    await page.waitForTimeout(600)
    await capture(page, 'showcase')
  })

  test('landing — architecture section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await scrollToSection(page, 'Production-Grade Architecture')
    await page.waitForTimeout(600)
    await capture(page, 'architecture')
  })

  test('dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
    await setupMockRoutes(page)
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await capture(page, 'dashboard')
  })
})
