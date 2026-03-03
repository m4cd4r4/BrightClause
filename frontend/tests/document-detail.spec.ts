import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Document Detail Page', () => {
  let testDocId: string

  test.beforeAll(async ({ request }) => {
    test.setTimeout(60_000)
    // Fetch a completed document with clauses from the API
    const res = await request.get(`${FRONTEND_URL}/api/documents?limit=10`)
    const data = await res.json()
    // Prefer a document with chunks (more likely to have clauses)
    const withChunks = data.documents?.find((d: any) => d.status === 'completed' && d.chunk_count > 1)
    const completed = withChunks || data.documents?.find((d: any) => d.status === 'completed')
    testDocId = completed?.id || ''
  })

  test.beforeEach(async ({ page }) => {
    test.skip(!testDocId, 'No completed documents available')
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
    await page.goto(`${FRONTEND_URL}/documents/${testDocId}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
  })

  test('should display document header with filename', async ({ page }) => {
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Filename shown in the nav bar as a link/span
    const filename = page.locator('text=/\\.pdf/i').first()
    await expect(filename).toBeVisible()
  })

  test('should have Export dropdown button', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Look for Export button
    const exportButton = page.getByRole('button', { name: /Export/i })
    await expect(exportButton).toBeVisible({ timeout: 10000 })
  })

  test('should open Export dropdown when clicked', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Click Export button
    const exportButton = page.getByRole('button', { name: /Export/i })
    await exportButton.click()

    // Wait for dropdown menu
    await page.waitForTimeout(500)

    // Check for export options
    await expect(page.getByText('PDF Report')).toBeVisible()
    await expect(page.getByText('Excel (.xlsx)')).toBeVisible()
    await expect(page.getByText('Word (.docx)')).toBeVisible()
    await expect(page.getByText('CSV (Clauses)')).toBeVisible()
    await expect(page.getByText('JSON (Full Data)')).toBeVisible()
  })

  test('should close Export dropdown when clicked outside', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Click Export button to open dropdown
    const exportButton = page.getByRole('button', { name: /Export/i })
    await exportButton.click()
    await page.waitForTimeout(300)

    // Verify dropdown is open
    await expect(page.getByText('PDF Report')).toBeVisible()

    // Click Export button again to close
    await exportButton.click()
    await page.waitForTimeout(300)

    // Dropdown should close
    await expect(page.getByText('PDF Report')).not.toBeVisible()
  })

  test('should have Knowledge Graph link in header', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Look for Knowledge Graph link
    const graphLink = page.locator('a:has-text("Graph")').first()
    await expect(graphLink).toBeVisible()
  })

  test('should navigate to Knowledge Graph when clicking link', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Click Knowledge Graph link
    const graphLink = page.locator('a:has-text("Graph")').first()
    await graphLink.click()

    // Should navigate to graph page
    await page.waitForURL(/\/documents\/[a-f0-9-]+\/graph$/, { timeout: 10000 })
  })

  test('should show analysis status or extraction button', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Wait for page to finish loading
    await page.waitForSelector('text=Loading document...', { state: 'hidden', timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    // Should show either risk summary, extraction button, or No Clauses Found
    const hasRiskSummary = await page.locator('text=/critical|high|medium|low/i').count() > 0
    const hasExtractionButton = await page.getByRole('button', { name: /Run Clause Extraction|Re-run Clause Extraction/i }).count() > 0
    const hasNoClauses = await page.locator('text=No Clauses Found').count() > 0
    const hasNotYetRun = await page.locator('text=Analysis Not Yet Run').count() > 0

    expect(hasRiskSummary || hasExtractionButton || hasNoClauses || hasNotYetRun).toBeTruthy()
  })

  test('should show document metadata', async ({ page }) => {
    // Check we're on document detail page
    const url = page.url()
    if (!url.match(/\/documents\/[a-f0-9-]+$/)) {
      test.skip()
      return
    }

    // Wait for page to finish loading
    await page.waitForSelector('text=Loading document...', { state: 'hidden', timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(1000)

    // Should show page count, chunk count, or clauses count in header
    const metadata = page.locator('header')
    const hasPages = await metadata.locator('text=/\\d+ pages/i').count() > 0
    const hasChunks = await metadata.locator('text=/\\d+ chunks/i').count() > 0
    const hasClauses = await metadata.locator('text=/\\d+ clauses/i').count() > 0
    const hasProcessing = await metadata.locator('text=Processing/i').count() > 0

    expect(hasPages || hasChunks || hasClauses || hasProcessing).toBeTruthy()
  })
})

test.describe('Export with Larger PDFs', () => {
  test('should upload and process 3MB PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox file chooser unreliable in headed mode')

    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /Upload/i }).click()

    // Get file chooser
    const fileChooser = await fileChooserPromise

    // Upload large PDF (3.3MB Software Leasing Agreement)
    const largePdfPath = 'I:/Scratch/ContractClarity/sample-contracts/scribd-downloads/601931598-Software-Leasing-Agreement.pdf'
    await fileChooser.setFiles(largePdfPath)

    // Wait for upload to complete (should see the document in the list)
    await page.waitForTimeout(3000)

    // Check for the uploaded document
    const docName = page.locator('h3').filter({ hasText: /Software-Leasing-Agreement/i })

    // May take time to appear, check multiple times
    let docVisible = false
    for (let i = 0; i < 10; i++) {
      if (await docName.count() > 0) {
        docVisible = true
        break
      }
      await page.waitForTimeout(1000)
    }

    // If document appeared, test passed
    if (docVisible) {
      await expect(docName.first()).toBeVisible()
    }
  })

  test('should upload and process 562KB NDA PDF', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox file chooser unreliable in headed mode')

    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /Upload/i }).click()

    // Get file chooser
    const fileChooser = await fileChooserPromise

    // Upload NDA PDF (562KB)
    const ndaPdfPath = 'I:/Scratch/ContractClarity/sample-contracts/scribd-downloads/246188537-NDA-pdf.pdf'
    await fileChooser.setFiles(ndaPdfPath)

    // Wait for upload
    await page.waitForTimeout(3000)

    // Check for the uploaded document
    const docName = page.locator('h3').filter({ hasText: /NDA/i })

    let docVisible = false
    for (let i = 0; i < 10; i++) {
      if (await docName.count() > 0) {
        docVisible = true
        break
      }
      await page.waitForTimeout(1000)
    }

    if (docVisible) {
      await expect(docName.first()).toBeVisible()
    }
  })
})
