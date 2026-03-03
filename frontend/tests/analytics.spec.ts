import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('BrightClause Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
  })

  test('should load with Portfolio Analytics heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await expect(page.getByRole('heading', { name: /Portfolio Analytics/i })).toBeVisible()
  })

  test('should display subtitle referencing analyzed contracts', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const subtitle = page.getByText(/across.*analyzed contracts/i)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    const hasSubtitle = await subtitle.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasSubtitle || hasEmpty).toBeTruthy()
  })

  test('should show risk stats cards or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    if (await emptyState.isVisible().catch(() => false)) {
      await expect(page.getByRole('link', { name: /Go to Dashboard/i }).or(
        page.getByRole('button', { name: /Go to Dashboard/i })
      )).toBeVisible()
      return
    }
    // Should show at least one risk stat
    const riskLabels = ['Critical', 'High', 'Medium', 'Low']
    let foundAny = false
    for (const label of riskLabels) {
      if (await page.getByText(label).first().isVisible().catch(() => false)) {
        foundAny = true
        break
      }
    }
    expect(foundAny).toBeTruthy()
  })

  test('should display Risk Heatmap section when data exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const heatmap = page.getByText(/Risk Heatmap/i)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    const hasHeatmap = await heatmap.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasHeatmap || hasEmpty).toBeTruthy()
  })

  test('should display Clause Distribution section when data exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const section = page.getByText(/Clause Distribution/i)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    const hasSection = await section.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasSection || hasEmpty).toBeTruthy()
  })

  test('should display Document Risk Summary when data exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const section = page.getByText(/Document Risk Summary/i)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    const hasSection = await section.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasSection || hasEmpty).toBeTruthy()
  })

  test('should have navigation bar with BrightClause branding', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    const header = page.locator('header, [role="banner"]').first()
    await expect(header).toBeVisible()
    await expect(header.getByText(/BrightClause/i).first()).toBeVisible()
  })

  test('should have Portfolio Health Score indicator when data exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    if (await emptyState.isVisible().catch(() => false)) return
    // Health score shows one of: Good Standing, Needs Review, At Risk
    const healthLabels = ['Good Standing', 'Needs Review', 'At Risk']
    let found = false
    for (const label of healthLabels) {
      if (await page.getByText(label).isVisible().catch(() => false)) {
        found = true
        break
      }
    }
    expect(found).toBeTruthy()
  })

  test('should show Top Risk Items or empty message', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const emptyState = page.getByText(/No Analysis Data Yet/i)
    if (await emptyState.isVisible().catch(() => false)) return
    const topRisk = page.getByText(/Top Risk Items/i)
    const noRisk = page.getByText(/No high-risk clauses detected/i)
    const hasTopRisk = await topRisk.isVisible().catch(() => false)
    const hasNoRisk = await noRisk.isVisible().catch(() => false)
    expect(hasTopRisk || hasNoRisk).toBeTruthy()
  })

  test('should not have horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE_URL}/analytics`)
    await page.waitForTimeout(3000)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })
})
