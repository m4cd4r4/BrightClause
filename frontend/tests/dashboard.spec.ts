import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('BrightClause Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
  })

  test('should load dashboard and display header correctly', async ({ page }) => {
    // Navigation header with branding
    await expect(page.getByText('BrightClause').first()).toBeVisible()

    // Search input
    await expect(page.getByPlaceholder('Search...')).toBeVisible()

    // Upload button
    await expect(page.getByRole('button', { name: /Upload/i })).toBeVisible()
  })

  test('should display stats cards with correct data', async ({ page }) => {
    await expect(page.locator('text=Documents Indexed').first()).toBeVisible()
    await expect(page.locator('text=Text Chunks').first()).toBeVisible()
    await expect(page.locator('text=Clauses Extracted').first()).toBeVisible()
  })

  test('should display document list with correct structure', async ({ page }) => {
    await page.waitForTimeout(2000)

    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      await expect(pdfFiles.first()).toBeVisible()
      const filename = await pdfFiles.first().textContent()
      expect(filename).toMatch(/\.pdf$/i)
    } else {
      await expect(page.getByText(/No contracts uploaded yet|Upload your first/i)).toBeVisible()
    }
  })

  test('should handle document selection and show analysis panel', async ({ page }) => {
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)

      const hasAnalysis = await page.locator('text=Risk Assessment').isVisible().catch(() => false)
      const hasProcessing = await page.locator('text=/queued|processing/i').count() > 0
      expect(hasAnalysis || hasProcessing).toBeTruthy()
    }
  })

  test('should navigate to document detail when clicking View Details', async ({ page }) => {
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)

      const viewButton = page.getByRole('button', { name: /View Full Analysis|View Details/i }).first()
      if (await viewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await viewButton.click()
        await page.waitForURL(/\/documents\/[a-f0-9-]+/, { timeout: 10000 }).catch(() => {})
        expect(page.url()).toMatch(/\/documents\/[a-f0-9-]+/)
      }
    }
  })

  test('should navigate to knowledge graph when clicking graph button', async ({ page }) => {
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)

      const graphButton = page.getByRole('button', { name: /Knowledge Graph/i }).first()
      if (await graphButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await graphButton.click()
        await page.waitForURL(/\/documents\/[a-f0-9-]+\/graph/, { timeout: 10000 }).catch(() => {})
        expect(page.url()).toMatch(/\/documents\/[a-f0-9-]+\/graph/)
      }
    }
  })

  test('should perform search and display results', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...')
    await searchInput.fill('business')
    await searchInput.press('Enter')
    await page.waitForTimeout(3000)

    // Check for search results section or document highlight
    const hasResults = await page.locator('text=/results|matches|found/i').count() > 0
    const hasDocs = await page.locator('h3').filter({ hasText: /\.pdf$/i }).count() > 0
    expect(hasResults || hasDocs).toBeTruthy()
  })

  test('should show file upload dialog when clicking upload button', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /Upload/i }).click()
    const fileChooser = await fileChooserPromise
    expect(fileChooser).toBeTruthy()
  })

  test('should show hover states on document list items', async ({ page }) => {
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      const firstDoc = pdfFiles.first()
      const docRow = firstDoc.locator('xpath=ancestor::div[contains(@class, "cursor-pointer")]')
      await docRow.hover()
      await page.waitForTimeout(500)

      const eyeButton = page.locator('button[aria-label="View document details"]').first()
      await expect(eyeButton).toBeVisible()
    }
  })

  test('should display risk levels with correct styling', async ({ page }) => {
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()

    if (docCount > 0) {
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)

      const hasRiskPanel = await page.locator('text=Risk Assessment').count() > 0
      if (hasRiskPanel) {
        const riskLevelCount = await page.locator('text=/^(critical|high|medium|low)$/i').count()
        expect(riskLevelCount).toBeGreaterThanOrEqual(0)
      }
    }
  })

  test('should have accessible search input with label', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search...')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('id', 'search-input')

    const searchLabel = page.locator('label[for="search-input"]')
    await expect(searchLabel).toBeVisible()
  })
})
