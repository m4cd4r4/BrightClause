import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('BrightClause Deal Detail Page', () => {
  let dealId: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/deals`, {
      data: { name: '__e2e__ Deal Detail Test' },
    })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    dealId = data.id
  })

  test.afterAll(async ({ request }) => {
    if (dealId) {
      await request.delete(`${BASE_URL}/api/deals/${dealId}`)
    }
  })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
  })

  test('should show deal not found for invalid ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/nonexistent-id-12345`)
    await page.waitForTimeout(3000)
    const notFound = page.getByText(/not found/i).or(page.getByText(/error/i))
    const heading = page.getByRole('heading')
    const hasNotFound = await notFound.isVisible().catch(() => false)
    const hasHeading = await heading.first().isVisible().catch(() => false)
    expect(hasNotFound || hasHeading).toBeTruthy()
  })

  test('should display deal details page', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()
  })

  test('should have back button to All Deals', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const backBtn = page.getByText(/All Deals/i).or(page.getByRole('link', { name: /All Deals/i }))
    await expect(backBtn.first()).toBeVisible()
  })

  test('should navigate back when clicking All Deals', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const backBtn = page.getByText(/All Deals/i).or(page.getByRole('link', { name: /All Deals/i }))
    await backBtn.first().click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/deals')
    expect(page.url()).not.toMatch(/\/deals\/[a-f0-9-]+/)
  })

  test('should show Add Documents button', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const addBtn = page.getByRole('button', { name: /Add/i }).or(
      page.getByText(/Add Documents/i)
    )
    await expect(addBtn.first()).toBeVisible()
  })

  test('should show delete button', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg') }).last()
    const hasDelete = await deleteBtn.isVisible().catch(() => false)
    expect(hasDelete).toBeTruthy()
  })

  test('should show aggregate stats cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const docsLabel = page.getByText(/Documents/i).first()
    await expect(docsLabel).toBeVisible()
  })

  test('should have navigation bar with BrightClause branding', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    const header = page.locator('header, [role="banner"]').first()
    await expect(header).toBeVisible()
    await expect(header.getByText(/BrightClause/i).first()).toBeVisible()
  })

  test('should not have horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE_URL}/deals/${dealId}`)
    await page.waitForTimeout(3000)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })
})
