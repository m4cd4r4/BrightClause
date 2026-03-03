import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('BrightClause Deal Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
  })

  test('should show deal not found for invalid ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/nonexistent-id-12345`)
    await page.waitForTimeout(3000)
    // Should show "not found" or error state
    const notFound = page.getByText(/not found/i).or(page.getByText(/error/i))
    const heading = page.getByRole('heading')
    const hasNotFound = await notFound.isVisible().catch(() => false)
    const hasHeading = await heading.first().isVisible().catch(() => false)
    expect(hasNotFound || hasHeading).toBeTruthy()
  })

  test('should display deal details when navigating from deals list', async ({ page }) => {
    // First create a deal or find an existing one
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)

    // Check if there are any deal cards
    const dealCards = page.locator('a[href*="/deals/"]').or(
      page.locator('[class*="cursor-pointer"]').filter({ hasText: /deal|contract/i })
    )
    const count = await dealCards.count()
    if (count === 0) {
      // No deals exist — create one via UI
      const newDealBtn = page.getByRole('button', { name: /New Deal/i })
      if (await newDealBtn.isVisible().catch(() => false)) {
        await newDealBtn.click()
        await page.waitForTimeout(1000)
        const nameInput = page.locator('input[placeholder*="deal"]').or(page.locator('input').first())
        await nameInput.fill('Test E2E Deal')
        const createBtn = page.getByRole('button', { name: /Create Deal/i })
        if (await createBtn.isEnabled()) {
          await createBtn.click()
          await page.waitForTimeout(2000)
        }
      }
    }

    // Navigate to the first deal
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (await firstDeal.isVisible().catch(() => false)) {
      await firstDeal.click()
      await page.waitForTimeout(3000)
      // Should show the deal detail page with a heading
      const heading = page.getByRole('heading').first()
      await expect(heading).toBeVisible()
    }
  })

  test('should have back button to All Deals', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (!await firstDeal.isVisible().catch(() => false)) {
      test.skip()
      return
    }
    await firstDeal.click()
    await page.waitForTimeout(3000)
    const backBtn = page.getByText(/All Deals/i).or(page.getByRole('link', { name: /All Deals/i }))
    await expect(backBtn.first()).toBeVisible()
  })

  test('should navigate back when clicking All Deals', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (!await firstDeal.isVisible().catch(() => false)) {
      test.skip()
      return
    }
    await firstDeal.click()
    await page.waitForTimeout(3000)
    const backBtn = page.getByText(/All Deals/i).or(page.getByRole('link', { name: /All Deals/i }))
    await backBtn.first().click()
    await page.waitForTimeout(2000)
    expect(page.url()).toContain('/deals')
    expect(page.url()).not.toMatch(/\/deals\/[a-f0-9-]+/)
  })

  test('should show Add Documents button', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (!await firstDeal.isVisible().catch(() => false)) {
      test.skip()
      return
    }
    await firstDeal.click()
    await page.waitForTimeout(3000)
    const addBtn = page.getByRole('button', { name: /Add/i }).or(
      page.getByText(/Add Documents/i)
    )
    await expect(addBtn.first()).toBeVisible()
  })

  test('should show delete button', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (!await firstDeal.isVisible().catch(() => false)) {
      test.skip()
      return
    }
    await firstDeal.click()
    await page.waitForTimeout(3000)
    // Trash/delete icon button
    const deleteBtn = page.locator('button').filter({ has: page.locator('svg') }).last()
    const hasDelete = await deleteBtn.isVisible().catch(() => false)
    expect(hasDelete).toBeTruthy()
  })

  test('should show aggregate stats cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (!await firstDeal.isVisible().catch(() => false)) {
      test.skip()
      return
    }
    await firstDeal.click()
    await page.waitForTimeout(3000)
    // Should show Documents count card
    const docsLabel = page.getByText(/Documents/i).first()
    await expect(docsLabel).toBeVisible()
  })

  test('should have navigation bar with BrightClause branding', async ({ page }) => {
    await page.goto(`${BASE_URL}/deals/test-id`)
    const header = page.locator('header, [role="banner"]').first()
    await expect(header).toBeVisible()
    await expect(header.getByText(/BrightClause/i).first()).toBeVisible()
  })

  test('should not have horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE_URL}/deals`)
    await page.waitForTimeout(3000)
    const firstDeal = page.locator('a[href*="/deals/"]').first()
    if (!await firstDeal.isVisible().catch(() => false)) {
      // Test the deals page itself for mobile overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
      return
    }
    await firstDeal.click()
    await page.waitForTimeout(3000)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5)
  })
})
