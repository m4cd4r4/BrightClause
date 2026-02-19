import { test, expect } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:3000'

test.describe('BrightClause Deals Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/deals`)
    await page.waitForLoadState('networkidle')
  })

  test('should load with Deals heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Deals', exact: true })
    await expect(heading).toBeVisible()
  })

  test('should display page description text', async ({ page }) => {
    await expect(
      page.getByText('Group related contracts into deals for aggregate analysis')
    ).toBeVisible()
  })

  test('should show New Deal button', async ({ page }) => {
    const newDealButton = page.getByRole('button', { name: /New Deal/i })
    await expect(newDealButton).toBeVisible()
  })

  test('should render deal cards or empty state', async ({ page }) => {
    // Wait for loading to finish (skeleton cards or real content)
    await page.waitForTimeout(3000)

    // Check for either deal cards with content or the empty state
    const emptyState = page.getByText('No deals yet. Create one to group related contracts.')
    const dealCards = page.locator('button.card')

    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const cardCount = await dealCards.count()

    if (hasEmptyState) {
      // Empty state should have a "Create Your First Deal" button
      await expect(
        page.getByRole('button', { name: /Create Your First Deal/i })
      ).toBeVisible()
    } else {
      // At least one deal card should be visible
      expect(cardCount).toBeGreaterThan(0)

      // Each deal card should have a deal name (h3 element)
      const firstCard = dealCards.first()
      await expect(firstCard.locator('h3')).toBeVisible()
    }
  })

  test('should open Create New Deal modal when clicking New Deal', async ({ page }) => {
    const newDealButton = page.getByRole('button', { name: /New Deal/i })
    await newDealButton.click()

    // Modal should appear with "Create New Deal" heading
    await expect(
      page.getByRole('heading', { name: /Create New Deal/i })
    ).toBeVisible()

    // Modal should have name input, description textarea, and create button
    await expect(
      page.getByPlaceholder('Deal name (e.g., Acme Corp Acquisition)')
    ).toBeVisible()
    await expect(page.getByPlaceholder('Description (optional)')).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Create Deal/i })
    ).toBeVisible()
  })

  test('should disable Create Deal button when name is empty', async ({ page }) => {
    const newDealButton = page.getByRole('button', { name: /New Deal/i })
    await newDealButton.click()

    const createButton = page.getByRole('button', { name: /Create Deal/i })
    await expect(createButton).toBeDisabled()
  })

  test('should enable Create Deal button when name is entered', async ({ page }) => {
    const newDealButton = page.getByRole('button', { name: /New Deal/i })
    await newDealButton.click()

    const nameInput = page.getByPlaceholder('Deal name (e.g., Acme Corp Acquisition)')
    await nameInput.fill('Test Deal Name')

    const createButton = page.getByRole('button', { name: /Create Deal/i })
    await expect(createButton).toBeEnabled()
  })

  test('should close Create New Deal modal when clicking X', async ({ page }) => {
    const newDealButton = page.getByRole('button', { name: /New Deal/i })
    await newDealButton.click()

    // Modal is visible
    await expect(
      page.getByRole('heading', { name: /Create New Deal/i })
    ).toBeVisible()

    // Close modal via the X button (the close button in the modal header)
    const closeButton = page.locator('.card button').filter({ has: page.locator('svg') }).first()
    await closeButton.click()

    // Modal should disappear
    await expect(
      page.getByRole('heading', { name: /Create New Deal/i })
    ).not.toBeVisible()
  })

  test('should have navigation bar with BrightClause branding', async ({ page }) => {
    await expect(page.getByText('BrightClause').first()).toBeVisible()
  })

  test('should show Deals link as active in navigation', async ({ page }) => {
    const dealsNavLink = page.getByRole('link', { name: /Deals/i }).first()
    await expect(dealsNavLink).toBeVisible()
  })

  test('should navigate back to landing page via logo', async ({ page }) => {
    // Click the BrightClause logo/brand link which goes to "/"
    const logoLink = page.locator('header a[href="/"]')
    await logoLink.click()
    await page.waitForURL(/\/$/)
    expect(page.url()).toMatch(/\/$/)
  })

  test('should navigate to dashboard via navigation link', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i })
    await dashboardLink.click()
    await page.waitForURL(/\/dashboard$/)
    expect(page.url()).toMatch(/\/dashboard$/)
  })

  test('should display document count on deal cards when deals exist', async ({ page }) => {
    await page.waitForTimeout(3000)

    const dealCards = page.locator('button.card')
    const cardCount = await dealCards.count()

    if (cardCount > 0) {
      // Deal cards should show document count (e.g., "0 documents" or "3 documents")
      const firstCard = dealCards.first()
      await expect(firstCard.getByText(/\d+ documents?/)).toBeVisible()
    }
  })
})
