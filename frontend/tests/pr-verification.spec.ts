/**
 * PR #23 verification tests
 *
 * Verifies the 4 specific behaviors called out in the PR test plan:
 *   1. Stat strip renders 3 columns at all breakpoints (no 2×2 on mobile)
 *   2. Walkthrough shows on first visit, skips on return
 *   3. Clicking a contract row populates the Risk panel
 *   4. Empty-state copy is visible before any contract is uploaded
 */

import { test, expect, Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Shared helpers (duplicated here so this file is self-contained)
// ---------------------------------------------------------------------------

async function setWalkthroughSeen(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('bc_walkthrough_seen', 'true')
  })
}

async function mockEmptyAPI(page: Page) {
  await page.route('**/api/documents*', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ documents: [], total: 0 }) }))
  await page.route('**/api/search/stats*', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ documents_indexed: 0, chunks_with_embeddings: 0, clauses_extracted: 0 }) }))
}

async function mockOneDoc(page: Page) {
  const docId = 'pr-verify-doc'
  await page.route('**/api/documents*', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({
        documents: [{
          id: docId,
          filename: 'service-agreement.pdf',
          status: 'completed',
          page_count: 8,
          chunk_count: 32,
          created_at: new Date().toISOString(),
          metadata: {},
        }],
        total: 1,
      }) }))
  await page.route('**/api/search/stats*', route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ documents_indexed: 1, chunks_with_embeddings: 32, clauses_extracted: 18 }) }))
  await page.route(`**/api/analysis/${docId}/summary`, route =>
    route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({
        clauses_extracted: 18,
        overall_risk: 'high',
        risk_summary: { critical: 2, high: 4, medium: 7, low: 5 },
        high_risk_highlights: [
          { clause_type: 'indemnification', risk_level: 'critical',
            summary: 'Unlimited indemnification with no liability cap.' },
          { clause_type: 'governing_law', risk_level: 'high',
            summary: 'Dispute resolution in a foreign jurisdiction.' },
        ],
      }) }))
  return docId
}

async function goTo(page: Page, url = '/dashboard') {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('[data-tour="stats"]', { timeout: 20000 })
}

// ---------------------------------------------------------------------------
// 1. Stat strip — 3 columns at all breakpoints
// ---------------------------------------------------------------------------

test.describe('PR verify 1 — Stat strip: 3 columns at all breakpoints', () => {

  test('desktop (1280px): grid-cols-3 class present', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await mockEmptyAPI(page)
    await setWalkthroughSeen(page)
    await goTo(page)

    const strip = page.locator('[data-tour="stats"]')
    await expect(strip).toHaveClass(/grid-cols-3/)
  })

  test('desktop (1280px): renders exactly 3 stat buttons', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await mockEmptyAPI(page)
    await setWalkthroughSeen(page)
    await goTo(page)

    const strip = page.locator('[data-tour="stats"]')
    await page.waitForFunction(() => {
      const s = document.querySelector('[data-tour="stats"]')
      return s && s.querySelectorAll('button').length >= 3
    }, { timeout: 15000 })
    await expect(strip.getByRole('button')).toHaveCount(3)
  })

  test('tablet (768px): grid-cols-3 class present — no 2-column wrap', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await mockEmptyAPI(page)
    await setWalkthroughSeen(page)
    await goTo(page)

    const strip = page.locator('[data-tour="stats"]')
    await expect(strip).toHaveClass(/grid-cols-3/)
  })

  test('mobile (390px): grid-cols-3 class present — no 2×2 layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockEmptyAPI(page)
    await setWalkthroughSeen(page)
    await goTo(page)

    const strip = page.locator('[data-tour="stats"]')
    await expect(strip).toHaveClass(/grid-cols-3/)
  })

  test('mobile (390px): all 3 stat items fit within viewport width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockEmptyAPI(page)
    await setWalkthroughSeen(page)
    await goTo(page)

    const strip = page.locator('[data-tour="stats"]')
    const box = await strip.boundingBox()
    expect(box).not.toBeNull()
    // The strip should not overflow the 390px viewport
    expect(box!.x + box!.width).toBeLessThanOrEqual(395)
  })

  test('mobile (390px): 3 stats render in a single row (same y coordinate)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await mockEmptyAPI(page)
    await setWalkthroughSeen(page)
    await goTo(page)

    await page.waitForFunction(() => {
      const s = document.querySelector('[data-tour="stats"]')
      return s && s.querySelectorAll('button').length >= 3
    }, { timeout: 15000 })

    const strip = page.locator('[data-tour="stats"]')
    const buttons = strip.getByRole('button')
    const boxes = await Promise.all([
      buttons.nth(0).boundingBox(),
      buttons.nth(1).boundingBox(),
      buttons.nth(2).boundingBox(),
    ])
    // All three buttons must start at approximately the same y — single row, not 2×2
    const ys = boxes.map(b => b!.y)
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(10)
  })
})

// ---------------------------------------------------------------------------
// 2. Walkthrough — shows on first visit, skips on return
// ---------------------------------------------------------------------------

test.describe('PR verify 2 — Walkthrough: first visit vs return', () => {

  test('first visit (no localStorage flag): walkthrough auto-starts', async ({ page }) => {
    // Do NOT set the seen flag — simulate a brand-new visitor
    await mockEmptyAPI(page)
    await goTo(page)
    // Walkthrough has a 1.5s delay before appearing
    await page.waitForSelector('text=Your contract portfolio', { timeout: 15000 })
    await expect(page.getByText('Your contract portfolio')).toBeVisible()
  })

  test('first visit: step counter shows "1 of 5"', async ({ page }) => {
    await mockEmptyAPI(page)
    await goTo(page)
    await page.waitForSelector('text=1 of 5', { timeout: 15000 })
    await expect(page.getByText('1 of 5')).toBeVisible()
  })

  test('return visit (localStorage flag set): walkthrough does NOT appear', async ({ page }) => {
    await setWalkthroughSeen(page)
    await mockEmptyAPI(page)
    await goTo(page)
    // Wait long enough for the 1.5s delay to fire — it should NOT appear
    await page.waitForTimeout(2500)
    await expect(page.getByText('Your contract portfolio')).not.toBeVisible()
    // The walkthrough backdrop should not be present
    await expect(page.locator('.fixed.inset-0.bg-black\\/40')).not.toBeVisible()
  })

  test('dismissing walkthrough writes flag to localStorage', async ({ page }) => {
    await mockEmptyAPI(page)
    await goTo(page)
    await page.waitForSelector('text=Skip tour', { timeout: 15000 })
    await page.getByText('Skip tour').click()
    // Flag must now be set — a page refresh will NOT show the walkthrough again
    const flag = await page.evaluate(() => localStorage.getItem('bc_walkthrough_seen'))
    expect(flag).toBe('true')
  })

  test('after dismissing, reloading the page does not show walkthrough', async ({ page }) => {
    await mockEmptyAPI(page)
    await goTo(page)
    await page.waitForSelector('text=Skip tour', { timeout: 15000 })
    await page.getByText('Skip tour').click()
    // Reload
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForSelector('[data-tour="stats"]', { timeout: 20000 })
    await page.waitForTimeout(2500)
    await expect(page.getByText('Your contract portfolio')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Risk panel — populates when a contract row is selected
// ---------------------------------------------------------------------------

test.describe('PR verify 3 — Risk panel populates on row click', () => {
  test.beforeEach(async ({ page }) => {
    await setWalkthroughSeen(page)
    await mockOneDoc(page)
    await goTo(page)
    await page.waitForSelector('text=service-agreement.pdf', { timeout: 15000 })
  })

  test('before selection: risk panel shows "Select a contract" prompt', async ({ page }) => {
    await expect(
      page.getByText(/Select a contract to see its risk breakdown/i)
    ).toBeVisible()
  })

  test('before selection: Risk Assessment heading is NOT visible', async ({ page }) => {
    const riskPanel = page.locator('[data-tour="analysis"]')
    await expect(
      riskPanel.getByRole('heading', { name: /Risk Assessment/i })
    ).not.toBeVisible()
  })

  test('clicking a contract row: Risk Assessment heading appears', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(
      page.getByRole('heading', { name: /Risk Assessment/i })
    ).toBeVisible({ timeout: 10000 })
  })

  test('clicking a contract row: overall risk level is shown', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await page.waitForSelector('text=Risk Assessment', { timeout: 10000 })
    const riskPanel = page.locator('[data-tour="analysis"]')
    // Mock returns overall_risk: 'high'
    await expect(riskPanel.getByText(/^high$/i).first()).toBeVisible({ timeout: 8000 })
  })

  test('clicking a contract row: risk breakdown section appears', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(page.getByText('Risk breakdown')).toBeVisible({ timeout: 10000 })
  })

  test('clicking a contract row: stacked risk bar labels are visible', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await page.waitForSelector('text=Risk Assessment', { timeout: 10000 })
    const riskPanel = page.locator('[data-tour="analysis"]')
    // The breakdown renders 4 labels: critical, high, medium, low
    // (div with class "capitalize" under each count number)
    await expect(riskPanel.getByText('critical').first()).toBeVisible({ timeout: 8000 })
    await expect(riskPanel.getByText('high').first()).toBeVisible({ timeout: 8000 })
  })

  test('clicking a contract row: View Full Analysis button appears', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await expect(
      page.getByRole('button', { name: /View Full Analysis/i })
    ).toBeVisible({ timeout: 12000 })
  })

  test('clicking a contract row: "Select a contract" prompt disappears', async ({ page }) => {
    const docRow = page.locator('[data-tour="documents"]').getByRole('button').first()
    await docRow.click()
    await page.waitForSelector('text=Risk Assessment', { timeout: 10000 })
    await expect(
      page.getByText(/Select a contract to see its risk breakdown/i)
    ).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Empty state — upload copy visible before any contract is uploaded
// ---------------------------------------------------------------------------

test.describe('PR verify 4 — Empty state copy before upload', () => {
  test.beforeEach(async ({ page }) => {
    await setWalkthroughSeen(page)
    await mockEmptyAPI(page)
    await goTo(page)
    await page.waitForSelector('text=Add your first contract', { timeout: 15000 })
  })

  test('"Add your first contract" heading is visible', async ({ page }) => {
    await expect(page.getByText('Add your first contract')).toBeVisible()
  })

  test('value prop copy mentions reading clauses', async ({ page }) => {
    await expect(
      page.getByText(/read every clause/i)
    ).toBeVisible()
  })

  test('value prop copy mentions flagging risky provisions', async ({ page }) => {
    await expect(
      page.getByText(/risky provisions|needs your attention/i)
    ).toBeVisible()
  })

  test('"Choose PDF" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Choose PDF/i })).toBeVisible()
  })

  test('file input accepts only PDF', async ({ page }) => {
    const input = page.locator('input[type="file"]')
    await expect(input).toHaveAttribute('accept', '.pdf')
  })

  test('no Activity Feed visible in empty state', async ({ page }) => {
    await expect(page.getByText('Activity Feed')).not.toBeVisible()
  })

  test('Risk panel shows Shield prompt (not ghost zeros)', async ({ page }) => {
    await expect(
      page.getByText(/Select a contract to see its risk breakdown/i)
    ).toBeVisible()
  })

  test('contract list area is present but contains no document rows', async ({ page }) => {
    const docs = page.locator('[data-tour="documents"]')
    await expect(docs).toBeVisible()
    // No actual document rows — filter by literal .pdf extension (not "Choose PDF" button)
    const rows = docs.getByRole('button').filter({ hasText: /\.pdf/i })
    await expect(rows).toHaveCount(0)
  })
})
