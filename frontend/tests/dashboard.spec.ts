import { test, expect, Page } from '@playwright/test'

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

async function goDashboard(page: Page, skipWalkthrough = true) {
  if (skipWalkthrough) {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
  }
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  // Wait for the stat strip to be visible - it always renders (even while loading)
  await page.waitForSelector('[data-tour="stats"]', { timeout: 20000 })
}

// Mock helpers - intercept the documents list and stats APIs.
// The app calls /api/documents, /api/search/stats, /api/analysis/{id}/summary.
// All go through the Next.js proxy so URLs are relative to localhost:3001.

async function mockEmptyState(page: Page) {
  await page.route('**/api/documents*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ documents: [], total: 0 }),
    })
  })
  await page.route('**/api/search/stats*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ documents_indexed: 0, chunks_with_embeddings: 0, clauses_extracted: 0 }),
    })
  })
}

// -----------------------------------------------------------------------
// Navigation
// -----------------------------------------------------------------------

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await goDashboard(page)
  })

  test('shows BrightClause branding', async ({ page }) => {
    await expect(page.getByText('BrightClause').first()).toBeVisible()
  })

  test('has exactly 5 nav links', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    const links = nav.getByRole('link')
    await expect(links).toHaveCount(5)
  })

  test('nav items are Dashboard, Analytics, Compare, Obligations, Deals', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    for (const label of ['Dashboard', 'Analytics', 'Compare', 'Obligations', 'Deals']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('no Search nav item', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav.getByRole('link', { name: /^search$/i })).not.toBeVisible()
  })

  test('Dashboard link is active/highlighted', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    const dashLink = nav.getByRole('link', { name: 'Dashboard' })
    await expect(dashLink).toHaveClass(/bg-accent/)
  })

  test('Analytics link navigates to /analytics', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await nav.getByRole('link', { name: 'Analytics' }).click()
    await page.waitForURL(/\/analytics/, { timeout: 10000 })
    expect(page.url()).toContain('/analytics')
  })

  test('Compare link navigates to /compare', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await nav.getByRole('link', { name: 'Compare' }).click()
    await page.waitForURL(/\/compare/, { timeout: 10000 })
    expect(page.url()).toContain('/compare')
  })

  test('Obligations link navigates to /obligations', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await nav.getByRole('link', { name: 'Obligations' }).click()
    await page.waitForURL(/\/obligations/, { timeout: 10000 })
    expect(page.url()).toContain('/obligations')
  })

  test('Deals link navigates to /deals', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await nav.getByRole('link', { name: 'Deals' }).click()
    await page.waitForURL(/\/deals/, { timeout: 10000 })
    expect(page.url()).toContain('/deals')
  })

  test('inline search input is visible in header', async ({ page }) => {
    await expect(page.getByPlaceholder('Search...')).toBeVisible()
  })

  test('Upload button is visible in header', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible()
  })

  test('Tour button is visible in header', async ({ page }) => {
    // WalkthroughButton renders with title="Restart guided tour" and visible text "Tour"
    // Match by title attribute since there's no aria-label
    const tourBtn = page.locator('button[title="Restart guided tour"]')
    await expect(tourBtn).toBeVisible()
  })

  test('theme toggle button is visible', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Switch to (light|dark) mode/i })
    await expect(toggle).toBeVisible()
  })
})

// -----------------------------------------------------------------------
// Stat strip (3-column, grid-cols-3)
// -----------------------------------------------------------------------

test.describe('Stat strip', () => {
  test.beforeEach(async ({ page }) => {
    await goDashboard(page)
    // Wait until loading skeletons are gone (3 real stat buttons appear)
    await page.waitForFunction(() => {
      const strip = document.querySelector('[data-tour="stats"]')
      return strip && strip.querySelectorAll('button').length >= 3
    }, { timeout: 20000 })
  })

  test('renders 3 stats (not 4)', async ({ page }) => {
    const strip = page.locator('[data-tour="stats"]')
    const statButtons = strip.getByRole('button')
    await expect(statButtons).toHaveCount(3)
  })

  test('first stat label is Contracts', async ({ page }) => {
    const strip = page.locator('[data-tour="stats"]')
    await expect(strip.getByRole('button').nth(0)).toContainText('Contracts')
  })

  test('second stat label is Clauses found', async ({ page }) => {
    const strip = page.locator('[data-tour="stats"]')
    await expect(strip.getByRole('button').nth(1)).toContainText('Clauses found')
  })

  test('third stat label is Ready to review', async ({ page }) => {
    const strip = page.locator('[data-tour="stats"]')
    await expect(strip.getByRole('button').nth(2)).toContainText('Ready to review')
  })

  test('no Documents Indexed label (old stat removed)', async ({ page }) => {
    await expect(page.getByText('Documents Indexed')).not.toBeVisible()
  })

  test('no Text Chunks label (old stat removed)', async ({ page }) => {
    await expect(page.getByText('Text Chunks')).not.toBeVisible()
  })

  test('no Contract Portfolio heading (removed)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Contract Portfolio/i })).not.toBeVisible()
  })

  test('stat strip has grid-cols-3 class', async ({ page }) => {
    const strip = page.locator('[data-tour="stats"]')
    await expect(strip).toHaveClass(/grid-cols-3/)
  })
})

// -----------------------------------------------------------------------
// Empty state (no documents) - uses mocked API
// -----------------------------------------------------------------------

test.describe('Empty state', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page)
    // Wait for the empty-state CTA to appear
    await page.waitForSelector('text=Add your first contract', { timeout: 15000 })
  })

  test('stat strip shows 0 for all three counts', async ({ page }) => {
    const strip = page.locator('[data-tour="stats"]')
    await page.waitForFunction(() => {
      const strip = document.querySelector('[data-tour="stats"]')
      return strip && strip.querySelectorAll('button').length >= 3
    }, { timeout: 15000 })
    const buttons = strip.getByRole('button')
    for (let i = 0; i < 3; i++) {
      await expect(buttons.nth(i)).toContainText('0')
    }
  })

  test('document list shows "Add your first contract" empty state', async ({ page }) => {
    await expect(page.getByText('Add your first contract')).toBeVisible()
  })

  test('empty state has Choose PDF button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Choose PDF/i })).toBeVisible()
  })

  test('no Activity Feed visible', async ({ page }) => {
    await expect(page.getByText('Activity Feed')).not.toBeVisible()
    await expect(page.getByRole('heading', { name: /Activity/i })).not.toBeVisible()
  })

  test('risk panel shows Shield icon and "Select a contract" hint', async ({ page }) => {
    await expect(page.getByText(/Select a contract to see its risk breakdown/i)).toBeVisible()
    const riskPanel = page.locator('[data-tour="analysis"]')
    await expect(riskPanel).toBeVisible()
  })

  test('risk panel empty state is minimal (no Risk Assessment heading)', async ({ page }) => {
    const riskPanel = page.locator('[data-tour="analysis"]')
    await expect(riskPanel.getByRole('heading', { name: /Risk Assessment/i })).not.toBeVisible()
  })
})

// -----------------------------------------------------------------------
// Upload flow
// -----------------------------------------------------------------------

test.describe('Upload flow', () => {
  test.beforeEach(async ({ page }) => {
    await goDashboard(page)
  })

  test('file input accepts PDF only', async ({ page }) => {
    const input = page.locator('input[type="file"][accept=".pdf"]')
    await expect(input).toBeAttached()
    await expect(input).toHaveAttribute('accept', '.pdf')
  })

  test('file input supports multiple', async ({ page }) => {
    const input = page.locator('input[type="file"][accept=".pdf"]')
    await expect(input).toHaveAttribute('multiple', '')
  })

  test('drag-over handler does not crash the page', async ({ page }) => {
    // Dispatch a dragover event on the page container
    await page.dispatchEvent('[data-tour="stats"]', 'dragover', {
      bubbles: true,
      cancelable: true,
    })
    await expect(page.locator('[data-tour="stats"]')).toBeVisible()
  })
})

// -----------------------------------------------------------------------
// Document list & risk panel interaction - uses mocked API
// -----------------------------------------------------------------------

test.describe('Document list and risk panel', () => {
  const mockDocId = 'test-doc-1234'
  const mockDoc = {
    id: mockDocId,
    filename: 'test-contract.pdf',
    status: 'completed',
    page_count: 12,
    chunk_count: 48,
    created_at: new Date().toISOString(),
    metadata: {},
  }
  const mockAnalysis = {
    clauses_extracted: 24,
    overall_risk: 'high',
    risk_summary: { critical: 1, high: 3, medium: 8, low: 12 },
    high_risk_highlights: [
      {
        clause_type: 'indemnification',
        risk_level: 'critical',
        summary: 'Unlimited indemnification with no cap on liability.',
      },
      {
        clause_type: 'non_compete',
        risk_level: 'high',
        summary: '36-month global non-compete with no geographic limits.',
      },
    ],
  }

  test.beforeEach(async ({ page }) => {
    // Mock the documents list endpoint
    await page.route('**/api/documents*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documents: [mockDoc], total: 1 }),
      })
    })
    // Mock the stats endpoint
    await page.route('**/api/search/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documents_indexed: 1, chunks_with_embeddings: 48, clauses_extracted: 24 }),
      })
    })
    // Mock the analysis summary endpoint (different route: /api/analysis/{id}/summary)
    await page.route(`**/api/analysis/${mockDocId}/summary`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAnalysis),
      })
    })
    await goDashboard(page)
    await page.waitForSelector('text=test-contract.pdf', { timeout: 15000 })
  })

  test('document filename appears in list', async ({ page }) => {
    await expect(page.getByText('test-contract.pdf')).toBeVisible()
  })

  test('document list shows count header', async ({ page }) => {
    await expect(page.getByText(/1 contract/i)).toBeVisible()
  })

  test('document list is scrollable (overflow-y-auto)', async ({ page }) => {
    const list = page.locator('[data-tour="documents"] .overflow-y-auto')
    await expect(list).toBeVisible()
    const maxH = await list.evaluate((el) => window.getComputedStyle(el).maxHeight)
    expect(maxH).not.toBe('none')
  })

  test('Eye button is visible on hover', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.hover()
    const eyeLink = page.locator('[aria-label="View document details"]').first()
    await expect(eyeLink).toBeVisible()
  })

  test('Eye button navigates to document detail', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.hover()
    const eyeLink = page.locator('[aria-label="View document details"]').first()
    await eyeLink.click()
    await page.waitForURL(/\/documents\//, { timeout: 10000 })
    expect(page.url()).toContain(`/documents/${mockDocId}`)
  })

  test('clicking document row loads risk panel', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(page.getByRole('heading', { name: /Risk Assessment/i })).toBeVisible({ timeout: 10000 })
  })

  test('risk panel shows overall risk level after selection', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await page.waitForSelector('text=Risk Assessment', { timeout: 10000 })
    // The risk level "high" should appear in the panel
    const riskPanel = page.locator('[data-tour="analysis"]')
    await expect(riskPanel.getByText(/^high$/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('risk panel shows risk breakdown section after selection', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await page.waitForSelector('text=Risk Assessment', { timeout: 10000 })
    await expect(page.getByText('Risk breakdown')).toBeVisible({ timeout: 8000 })
  })

  test('risk panel shows View Full Analysis button after selection', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(page.getByRole('button', { name: /View Full Analysis/i })).toBeVisible({ timeout: 12000 })
  })

  test('View Full Analysis button navigates to document detail', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    const btn = page.getByRole('button', { name: /View Full Analysis/i })
    await btn.waitFor({ timeout: 12000 })
    await btn.click()
    await page.waitForURL(/\/documents\//, { timeout: 10000 })
    expect(page.url()).toContain(`/documents/${mockDocId}`)
  })

  test('risk panel shows Knowledge Graph button after selection', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(page.getByRole('button', { name: /Knowledge Graph/i })).toBeVisible({ timeout: 12000 })
  })

  test('Knowledge Graph button navigates to /graph', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    const btn = page.getByRole('button', { name: /Knowledge Graph/i })
    await btn.waitFor({ timeout: 12000 })
    await btn.click()
    await page.waitForURL(/\/documents\/.*\/graph/, { timeout: 10000 })
    expect(page.url()).toContain('/graph')
  })

  test('unknown risk level falls back to low (no render error)', async ({ page }) => {
    // Override the analysis mock with unknown risk level
    await page.unroute(`**/api/analysis/${mockDocId}/summary`)
    await page.route(`**/api/analysis/${mockDocId}/summary`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...mockAnalysis, overall_risk: 'unknown_value' }),
      })
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('text=test-contract.pdf', { timeout: 15000 })
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(page.getByRole('heading', { name: /Risk Assessment/i })).toBeVisible({ timeout: 10000 })
    // The fallback renders the unknown value mapped to 'low'
    const riskPanel = page.locator('[data-tour="analysis"]')
    await expect(riskPanel.getByText(/^low$/i).first()).toBeVisible({ timeout: 8000 })
  })
})

// -----------------------------------------------------------------------
// Inline search - uses mocked API
// -----------------------------------------------------------------------

test.describe('Inline search', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page)
    await page.waitForSelector('text=Add your first contract', { timeout: 15000 })
  })

  test('search input has correct id', async ({ page }) => {
    const input = page.locator('#search-input')
    await expect(input).toBeVisible()
  })

  test('search input has accessible label', async ({ page }) => {
    const label = page.locator('label[for="search-input"]')
    await expect(label).toBeAttached()
  })

  test('typing in search does not navigate away', async ({ page }) => {
    const input = page.getByPlaceholder('Search...')
    await input.fill('termination')
    expect(page.url()).toContain('/dashboard')
  })

  test('pressing Enter with empty search does nothing', async ({ page }) => {
    const input = page.getByPlaceholder('Search...')
    await input.press('Enter')
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/dashboard')
  })

  test('search returns results section when API responds', async ({ page }) => {
    await page.route('**/api/search?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              chunk_id: 'chunk-1',
              document_name: 'test-contract.pdf',
              content: 'The party may terminate this agreement with 30 days notice.',
              combined_score: 0.92,
            },
          ],
        }),
      })
    })
    const input = page.getByPlaceholder('Search...')
    await input.fill('termination')
    await input.press('Enter')
    await expect(page.getByRole('heading', { name: /Search Results/i })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('1 matches found')).toBeVisible()
  })

  test('search results can be cleared with X button', async ({ page }) => {
    await page.route('**/api/search?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              chunk_id: 'chunk-1',
              document_name: 'test-contract.pdf',
              content: 'Termination clause content here.',
              combined_score: 0.87,
            },
          ],
        }),
      })
    })
    const input = page.getByPlaceholder('Search...')
    await input.fill('termination')
    await input.press('Enter')
    await page.waitForSelector('text=Search Results', { timeout: 10000 })
    await page.getByRole('button', { name: /Clear search results/i }).click()
    await expect(page.getByRole('heading', { name: /Search Results/i })).not.toBeVisible()
  })

  test('concurrent search guard - rapid searches do not crash UI', async ({ page }) => {
    await page.route('**/api/search?**', async (route) => {
      await new Promise(r => setTimeout(r, 200))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      })
    })
    const input = page.getByPlaceholder('Search...')
    await input.fill('a')
    await input.press('Enter')
    await input.fill('b')
    await input.press('Enter')
    await page.waitForTimeout(600)
    await expect(page.locator('[data-tour="stats"]')).toBeVisible()
  })
})

// -----------------------------------------------------------------------
// Walkthrough
// -----------------------------------------------------------------------

test.describe('Walkthrough', () => {
  test('walkthrough does NOT auto-start when localStorage flag is set', async ({ page }) => {
    await goDashboard(page, true)
    await page.waitForSelector('[data-tour="stats"]', { timeout: 20000 })
    await page.waitForTimeout(2000)
    // Walkthrough backdrop should not be visible
    await expect(page.locator('.fixed.inset-0.bg-black\\/40')).not.toBeVisible()
  })

  test('walkthrough auto-starts on first visit (no localStorage flag)', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page, false)
    // 1.5s delay in code + page load time = allow up to 15s (mocked API speeds load)
    await page.waitForSelector('text=Your contract portfolio', { timeout: 15000 })
    await expect(page.getByText('Your contract portfolio')).toBeVisible()
  })

  test('walkthrough shows step counter', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page, false)
    await page.waitForSelector('text=1 of 5', { timeout: 15000 })
    await expect(page.getByText('1 of 5')).toBeVisible()
  })

  test('walkthrough can be dismissed via Skip tour', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page, false)
    await page.waitForSelector('text=Skip tour', { timeout: 15000 })
    await page.getByText('Skip tour').click()
    await expect(page.getByText('Your contract portfolio')).not.toBeVisible()
  })

  test('walkthrough can be dismissed via X button', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page, false)
    // Wait for the walkthrough to appear (1.5s delay + render time)
    await page.waitForSelector('[aria-label="Close walkthrough"]', { timeout: 15000 })
    await page.getByRole('button', { name: /Close walkthrough/i }).click()
    await expect(page.getByText('Your contract portfolio')).not.toBeVisible()
  })

  test('walkthrough advances on Next click', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page, false)
    await page.waitForSelector('text=1 of 5', { timeout: 15000 })
    await page.getByRole('button', { name: /^Next$/i }).click()
    await expect(page.getByText('2 of 5')).toBeVisible({ timeout: 5000 })
  })

  test('Tour button restarts walkthrough', async ({ page }) => {
    await goDashboard(page, true)
    // Wait until the page has fully loaded (stats visible with real values)
    await page.waitForFunction(() => {
      const strip = document.querySelector('[data-tour="stats"]')
      return strip && strip.querySelectorAll('button').length >= 3
    }, { timeout: 20000 })
    // Click the Tour button by title attribute
    await page.locator('button[title="Restart guided tour"]').click()
    // The walkthrough appears synchronously (no delay when restarting)
    await expect(page.getByText('1 of 5')).toBeVisible({ timeout: 8000 })
  })

  test('dismissing walkthrough stores flag in localStorage', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page, false)
    // Wait for the walkthrough overlay with the 1.5s delay + render
    await page.waitForSelector('text=Skip tour', { timeout: 15000 })
    await page.getByText('Skip tour').click()
    const flag = await page.evaluate(() => localStorage.getItem('bc_walkthrough_seen'))
    expect(flag).toBe('true')
  })
})

// -----------------------------------------------------------------------
// Mobile viewport
// -----------------------------------------------------------------------

test.describe('Mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('stat strip does not overflow on mobile', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page)
    const strip = page.locator('[data-tour="stats"]')
    const box = await strip.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(400)
    }
  })

  test('overflow-y-auto scroll container is present on mobile', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page)
    const list = page.locator('[data-tour="documents"] .overflow-y-auto')
    await expect(list).toBeVisible()
  })

  test('mobile hamburger menu button is visible', async ({ page }) => {
    await goDashboard(page)
    const menuBtn = page.getByRole('button', { name: /Toggle menu/i })
    await expect(menuBtn).toBeVisible()
  })

  test('mobile menu opens and shows all 5 nav links', async ({ page }) => {
    await mockEmptyState(page)
    await goDashboard(page)
    // Wait for the page to be fully interactive before touching the nav
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    const menuBtn = page.locator('button[aria-label="Toggle menu"]')
    await menuBtn.waitFor({ state: 'visible', timeout: 10000 })
    // Use tap() for a proper mobile touch interaction (dispatches touchstart/touchend)
    await menuBtn.tap()
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]')
    // The nav is conditionally rendered via React state when mobileOpen=true
    await mobileNav.waitFor({ state: 'attached', timeout: 10000 })
    await mobileNav.waitFor({ state: 'visible', timeout: 5000 })
    for (const label of ['Dashboard', 'Analytics', 'Compare', 'Obligations', 'Deals']) {
      await expect(mobileNav.getByRole('link', { name: label })).toBeVisible()
    }
  })

  test('Eye button has adequate touch target on mobile', async ({ page }) => {
    await page.route('**/api/documents*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documents: [{
            id: 'touch-doc',
            filename: 'mobile-test.pdf',
            status: 'completed',
            page_count: 5,
            chunk_count: 20,
            created_at: new Date().toISOString(),
            metadata: {},
          }],
          total: 1,
        }),
      })
    })
    await page.route('**/api/search/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documents_indexed: 1, chunks_with_embeddings: 20, clauses_extracted: 5 }),
      })
    })
    await goDashboard(page)
    await page.waitForSelector('text=mobile-test.pdf', { timeout: 15000 })

    const eyeBtn = page.locator('[aria-label="View document details"]').first()
    await expect(eyeBtn).toBeVisible()
    const box = await eyeBtn.boundingBox()
    if (box) {
      // min-w-[44px] min-h-[44px] on mobile
      expect(box.width).toBeGreaterThanOrEqual(40)
      expect(box.height).toBeGreaterThanOrEqual(40)
    }
  })
})

// -----------------------------------------------------------------------
// Error and edge cases
// -----------------------------------------------------------------------

test.describe('Error states', () => {
  test('API failure shows error toast', async ({ page }) => {
    await page.route('**/api/documents*', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    await page.route('**/api/search/stats*', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    await goDashboard(page)
    await expect(page.getByText(/Failed to connect|failed|error/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('null clause_type in highlight renders without crash', async ({ page }) => {
    const nullDocId = 'null-clause-doc'
    await page.route('**/api/documents*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          documents: [{
            id: nullDocId,
            filename: 'null-clause.pdf',
            status: 'completed',
            page_count: 3,
            chunk_count: 12,
            created_at: new Date().toISOString(),
            metadata: {},
          }],
          total: 1,
        }),
      })
    })
    await page.route('**/api/search/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ documents_indexed: 1, chunks_with_embeddings: 12, clauses_extracted: 5 }),
      })
    })
    await page.route(`**/api/analysis/${nullDocId}/summary`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clauses_extracted: 5,
          overall_risk: 'high',
          risk_summary: { critical: 0, high: 1, medium: 2, low: 2 },
          high_risk_highlights: [
            { clause_type: null, risk_level: 'high', summary: 'Something risky.' },
          ],
        }),
      })
    })

    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await goDashboard(page)
    await page.waitForSelector('text=null-clause.pdf', { timeout: 15000 })
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    // Should render Risk Assessment panel without crashing
    await expect(page.getByRole('heading', { name: /Risk Assessment/i })).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(1000)
    expect(errors.filter(e => e.toLowerCase().includes('typeerror'))).toHaveLength(0)
  })
})
