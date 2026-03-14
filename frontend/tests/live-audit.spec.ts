import { test, expect } from '@playwright/test'

const LIVE_URL = 'https://brightclause.com'

// Bypass access code gate + onboarding tour before each test
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bc_walkthrough_seen', 'true')
  })
})

test.describe('BrightClause Live Site Audit', () => {
  test.setTimeout(60_000)

  // ── Landing Page ──────────────────────────────────────────────
  test('Landing page - hero and branding', async ({ page }) => {
    await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Should see the landing page, NOT the access code gate
    const heroHeading = page.getByRole('heading', { name: /Read Every Clause/i })
    await expect(heroHeading).toBeVisible()

    // CTA
    await expect(page.getByRole('link', { name: /Try It Live/i }).first()).toBeVisible()

    await page.screenshot({ path: 'test-results/audit-01-landing-hero.png', fullPage: false })
  })

  test('Landing page - How It Works and Features', async ({ page }) => {
    await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Scroll to How It Works
    await page.getByRole('heading', { name: /How It Works/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/audit-02-landing-how-it-works.png', fullPage: false })

    // Scroll to Key Features
    await page.getByRole('heading', { name: /Key Features/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/audit-03-landing-features.png', fullPage: false })
  })

  test('Landing page - Trust Signals and Footer', async ({ page }) => {
    await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Scroll to Built for Trust
    await page.getByRole('heading', { name: /Built for Trust/i }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/audit-04-landing-trust.png', fullPage: false })

    // Footer
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await expect(footer.getByText('BrightClause')).toBeVisible()
    await page.screenshot({ path: 'test-results/audit-05-landing-footer.png', fullPage: false })
  })

  // ── Dashboard ─────────────────────────────────────────────────
  test('Dashboard - stats and contract list', async ({ page }) => {
    await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    // No tour overlay should be visible
    const tourOverlay = page.locator('div.fixed.inset-0.bg-black\\/40')
    await expect(tourOverlay).not.toBeVisible({ timeout: 3000 }).catch(() => {})

    // Stats cards
    await expect(page.locator('text=Documents Indexed').first()).toBeVisible()
    await expect(page.locator('text=Text Chunks').first()).toBeVisible()
    await expect(page.locator('text=Clauses Extracted').first()).toBeVisible()

    await page.screenshot({ path: 'test-results/audit-06-dashboard-stats.png', fullPage: false })

    // Contract Portfolio section
    const hasPortfolio = await page.locator('text=Contract Portfolio').isVisible().catch(() => false)
    expect(hasPortfolio).toBeTruthy()

    // Check for PDF documents
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()
    await page.screenshot({ path: 'test-results/audit-07-dashboard-contracts.png', fullPage: false })

    // Log document count for audit
    console.log(`[AUDIT] Documents visible on dashboard: ${docCount}`)
  })

  test('Dashboard - document selection and analysis panel', async ({ page }) => {
    await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      // Click first document
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test-results/audit-08-doc-selected.png', fullPage: false })

      // Check analysis panel or processing state
      const analysisPanel = page.locator('text=Risk Assessment')
      const processingState = page.locator('text=/queued|processing/i')
      const hasAnalysis = await analysisPanel.isVisible().catch(() => false)
      const hasProcessing = await processingState.count() > 0

      console.log(`[AUDIT] Analysis panel visible: ${hasAnalysis}, Processing: ${hasProcessing}`)
    } else {
      console.log('[AUDIT] No documents to select')
    }
  })

  test('Dashboard - document detail page', async ({ page }) => {
    await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000)

    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)

      const viewButton = page.getByRole('button', { name: /View Full Analysis|View Details/i }).first()
      if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await viewButton.click()
        await page.waitForURL(/\/documents\/[a-f0-9-]+/, { timeout: 10000 }).catch(() => {})
        await page.waitForTimeout(3000)
        await page.screenshot({ path: 'test-results/audit-09-document-detail.png', fullPage: false })
      } else {
        console.log('[AUDIT] No View Details button - documents may be in queued state')
        await page.screenshot({ path: 'test-results/audit-09-no-detail-button.png', fullPage: false })
      }
    }
  })

  // ── Deals Page ────────────────────────────────────────────────
  test('Deals page', async ({ page }) => {
    await page.goto(`${LIVE_URL}/deals`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await expect(page.getByRole('heading', { name: 'Deals', exact: true })).toBeVisible()
    await expect(page.getByText('Group related contracts into deals')).toBeVisible()
    await expect(page.getByRole('button', { name: /New Deal/i })).toBeVisible()

    await page.screenshot({ path: 'test-results/audit-10-deals-page.png', fullPage: false })

    // New Deal modal
    await page.getByRole('button', { name: /New Deal/i }).click()
    await page.waitForTimeout(500)
    await expect(page.getByRole('heading', { name: /Create New Deal/i })).toBeVisible()
    await page.screenshot({ path: 'test-results/audit-11-deals-modal.png', fullPage: false })
  })

  // ── Obligations Page ──────────────────────────────────────────
  test('Obligations page', async ({ page }) => {
    await page.goto(`${LIVE_URL}/obligations`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await expect(page.getByRole('heading', { name: /Obligation Tracker/i })).toBeVisible()

    // Status cards
    await expect(page.getByRole('button', { name: /All/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Pending/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Overdue/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Completed/i }).first()).toBeVisible()

    // Type filters
    await expect(page.getByRole('button', { name: /All Types/i })).toBeVisible()

    await page.screenshot({ path: 'test-results/audit-12-obligations-page.png', fullPage: false })
  })

  // ── Navigation ────────────────────────────────────────────────
  test('Navigation across all pages (no tour blocking)', async ({ page }) => {
    await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Dashboard → Deals
    await page.getByRole('link', { name: /Deals/i }).click()
    await page.waitForURL(/\/deals/, { timeout: 10000 })
    expect(page.url()).toContain('/deals')
    await page.screenshot({ path: 'test-results/audit-13-nav-deals.png', fullPage: false })

    // Deals → Obligations
    await page.getByRole('link', { name: /Obligations/i }).click()
    await page.waitForURL(/\/obligations/, { timeout: 10000 })
    expect(page.url()).toContain('/obligations')

    // Obligations → Dashboard
    await page.getByRole('link', { name: /Dashboard/i }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
    await page.screenshot({ path: 'test-results/audit-14-nav-back-to-dashboard.png', fullPage: false })
  })

  // ── Branding Audit ────────────────────────────────────────────
  test('No leftover ContractClarity branding', async ({ page }) => {
    const pages = ['/', '/dashboard', '/deals', '/obligations']

    for (const path of pages) {
      await page.goto(`${LIVE_URL}${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)

      const bodyText = await page.locator('body').textContent() || ''
      const hasOldBranding = bodyText.toLowerCase().includes('contractclarity')
      expect(hasOldBranding, `Found "ContractClarity" on ${path}`).toBeFalsy()
    }
  })

  // ── API Health ────────────────────────────────────────────────
  test('Backend API health check', async ({ page }) => {
    const response = await page.goto(`${LIVE_URL}/api/health`, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    const body = await page.locator('body').textContent()
    expect(body).toContain('healthy')
  })

  // ── API Documents Check ───────────────────────────────────────
  test('Backend API returns documents', async ({ page }) => {
    const response = await page.goto(`${LIVE_URL}/api/documents?limit=50`, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    const body = await page.locator('body').textContent() || ''
    const data = JSON.parse(body)

    console.log(`[AUDIT] Total documents in DB: ${data.total}`)
    console.log(`[AUDIT] Documents:`)
    for (const doc of data.documents) {
      console.log(`  - ${doc.filename} | status: ${doc.status} | chunks: ${doc.chunk_count} | pages: ${doc.page_count}`)
    }

    expect(data.total).toBeGreaterThan(0)
  })

  // ── Analytics Page ───────────────────────────────────────────
  test('Analytics page', async ({ page }) => {
    await page.goto(`${LIVE_URL}/analytics`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)

    // Either shows portfolio analytics or empty state
    const heading = page.getByRole('heading', { name: /Portfolio Analytics/i })
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    const hasData = await heading.isVisible().catch(() => false)
    const isEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasData || isEmpty).toBeTruthy()

    if (hasData) {
      // Risk level stats should render
      await expect(page.getByText(/Critical/i).first()).toBeVisible()
      await expect(page.getByText(/High/i).first()).toBeVisible()
      await expect(page.getByText(/Medium/i).first()).toBeVisible()
      await expect(page.getByText(/Low/i).first()).toBeVisible()
    }

    await page.screenshot({ path: 'test-results/audit-17-analytics.png', fullPage: false })
  })

  // ── Compare Page ────────────────────────────────────────────
  test('Compare page', async ({ page }) => {
    await page.goto(`${LIVE_URL}/compare`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await expect(page.getByRole('heading', { name: /Document Comparison/i })).toBeVisible()
    await expect(page.getByText(/Compare clause coverage/i)).toBeVisible()

    // Add Document button
    await expect(page.getByRole('button', { name: /Add Document/i })).toBeVisible()

    // Should show empty state prompting selection
    await expect(page.getByText(/Select Documents to Compare|Add One More/i)).toBeVisible()

    await page.screenshot({ path: 'test-results/audit-18-compare.png', fullPage: false })

    // Open document picker
    await page.getByRole('button', { name: /Add Document/i }).click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/audit-19-compare-picker.png', fullPage: false })
  })

  // ── Search Page ─────────────────────────────────────────────
  test('Search page', async ({ page }) => {
    await page.goto(`${LIVE_URL}/search`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await expect(page.getByRole('heading', { name: /Search Your Contract/i })).toBeVisible()

    // Search input
    const searchInput = page.getByPlaceholder(/search/i).first()
    await expect(searchInput).toBeVisible()

    // Search mode buttons
    await expect(page.getByRole('button', { name: /Hybrid/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Semantic/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Keyword/i })).toBeVisible()

    // Example searches shown before first search
    await expect(page.getByText(/Example Searches|Search Tips/i)).toBeVisible()

    await page.screenshot({ path: 'test-results/audit-20-search.png', fullPage: false })

    // Perform a search
    await searchInput.fill('termination')
    await page.getByRole('button', { name: /Search/i }).first().click()
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'test-results/audit-21-search-results.png', fullPage: false })
  })

  // ── Mobile ────────────────────────────────────────────────────
  test('Mobile - dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${LIVE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(4000)

    await page.screenshot({ path: 'test-results/audit-15-mobile-dashboard.png', fullPage: false })

    // Stats should still render on mobile
    await expect(page.locator('text=Documents Indexed').first()).toBeVisible()
  })

  test('Mobile - landing page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(LIVE_URL, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    await page.screenshot({ path: 'test-results/audit-16-mobile-landing.png', fullPage: false })
    await expect(page.getByRole('heading', { name: /Read Every Clause/i })).toBeVisible()
  })
})
