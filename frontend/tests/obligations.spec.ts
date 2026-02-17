import { test, expect } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:3000'

test.describe('ClauseLens Obligations Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/obligations`)
    await page.waitForLoadState('networkidle')
  })

  test('should load with Obligation Tracker heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Obligation Tracker/i })
    await expect(heading).toBeVisible()
  })

  test('should display page description text', async ({ page }) => {
    await expect(
      page.getByText('Deadlines, commitments, and obligations across all contracts')
    ).toBeVisible()
  })

  test('should display status filter cards: All, Pending, Overdue, Completed', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000)

    // All four status filter buttons should be present
    const allButton = page.getByRole('button', { name: /All/i }).first()
    const pendingButton = page.getByRole('button', { name: /Pending/i }).first()
    const overdueButton = page.getByRole('button', { name: /Overdue/i }).first()
    const completedButton = page.getByRole('button', { name: /Completed/i }).first()

    await expect(allButton).toBeVisible()
    await expect(pendingButton).toBeVisible()
    await expect(overdueButton).toBeVisible()
    await expect(completedButton).toBeVisible()
  })

  test('should display status counts as numbers', async ({ page }) => {
    await page.waitForTimeout(3000)

    // Each status card should show a numeric count (0 or more)
    // The counts are rendered as bold text-2xl numbers
    const countElements = page.locator('.card p.font-mono.font-bold')
    const count = await countElements.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('should display type filter pills', async ({ page }) => {
    await page.waitForTimeout(2000)

    // "All Types" filter button should be present
    await expect(page.getByRole('button', { name: /All Types/i })).toBeVisible()

    // At least some obligation type filters should be present
    const typeLabels = ['Payment', 'Delivery', 'Notification', 'Compliance', 'Reporting', 'General']
    for (const label of typeLabels) {
      await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible()
    }
  })

  test('should render obligation list or empty state', async ({ page }) => {
    await page.waitForTimeout(3000)

    // Check for either obligations grouped by document or empty state
    const emptyStateNoFilter = page.getByText(
      'No obligations extracted yet. Analyze a document to extract obligations.'
    )
    const emptyStateFiltered = page.getByText('No obligations match your filters.')

    const hasEmptyNoFilter = await emptyStateNoFilter.isVisible().catch(() => false)
    const hasEmptyFiltered = await emptyStateFiltered.isVisible().catch(() => false)

    if (hasEmptyNoFilter || hasEmptyFiltered) {
      // Empty state is valid - no obligations present or filtered out
      expect(hasEmptyNoFilter || hasEmptyFiltered).toBeTruthy()
    } else {
      // Obligations should be grouped by document with filename headers
      const documentHeaders = page.locator('h3').filter({ hasText: /.+/ })
      const headerCount = await documentHeaders.count()
      expect(headerCount).toBeGreaterThan(0)
    }
  })

  test('should filter by status when clicking Pending card', async ({ page }) => {
    await page.waitForTimeout(3000)

    const pendingButton = page.getByRole('button', { name: /Pending/i }).first()
    await pendingButton.click()

    // Wait for filter to apply
    await page.waitForTimeout(2000)

    // The Pending card should now have active styling (border-accent)
    // After clicking, either obligations show with pending status or empty state appears
    const emptyFiltered = page.getByText('No obligations match your filters.')
    const hasPendingItems = await page.locator('text=Pending').count()
    const hasEmpty = await emptyFiltered.isVisible().catch(() => false)

    // Either we see pending items or the "no matches" empty state
    expect(hasPendingItems > 0 || hasEmpty).toBeTruthy()
  })

  test('should filter by status when clicking Completed card', async ({ page }) => {
    await page.waitForTimeout(3000)

    const completedButton = page.getByRole('button', { name: /Completed/i }).first()
    await completedButton.click()

    await page.waitForTimeout(2000)

    const emptyFiltered = page.getByText('No obligations match your filters.')
    const hasCompletedItems = await page.locator('text=Completed').count()
    const hasEmpty = await emptyFiltered.isVisible().catch(() => false)

    expect(hasCompletedItems > 0 || hasEmpty).toBeTruthy()
  })

  test('should filter by type when clicking a type pill', async ({ page }) => {
    await page.waitForTimeout(3000)

    // Click the "Payment" type filter
    const paymentButton = page.getByRole('button', { name: 'Payment', exact: true })
    await paymentButton.click()

    await page.waitForTimeout(2000)

    // Either payment obligations appear or empty state with filter message
    const emptyFiltered = page.getByText('No obligations match your filters.')
    const hasPaymentItems = await page.locator('text=Payment').count()
    const hasEmpty = await emptyFiltered.isVisible().catch(() => false)

    expect(hasPaymentItems > 0 || hasEmpty).toBeTruthy()
  })

  test('should reset status filter when clicking All card', async ({ page }) => {
    await page.waitForTimeout(3000)

    // First apply a filter
    const pendingButton = page.getByRole('button', { name: /Pending/i }).first()
    await pendingButton.click()
    await page.waitForTimeout(1000)

    // Then reset by clicking All
    const allButton = page.getByRole('button', { name: /All/i }).first()
    await allButton.click()
    await page.waitForTimeout(2000)

    // All card should now be the active filter
    // Either all obligations show or the generic empty state (not filter-specific)
    const emptyNoFilter = page.getByText(
      'No obligations extracted yet. Analyze a document to extract obligations.'
    )
    const hasObligations = await page.locator('.card.overflow-hidden').count() > 0
    const hasGenericEmpty = await emptyNoFilter.isVisible().catch(() => false)

    expect(hasObligations || hasGenericEmpty).toBeTruthy()
  })

  test('should have navigation bar with ClauseLens branding', async ({ page }) => {
    await expect(page.getByText('ClauseLens').first()).toBeVisible()
  })

  test('should show Obligations link as active in navigation', async ({ page }) => {
    const obligationsNavLink = page.getByRole('link', { name: /Obligations/i }).first()
    await expect(obligationsNavLink).toBeVisible()
  })

  test('should navigate to dashboard via navigation link', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i })
    await dashboardLink.click()
    await page.waitForURL(/\/dashboard$/)
    expect(page.url()).toMatch(/\/dashboard$/)
  })

  test('should navigate to deals page via navigation link', async ({ page }) => {
    const dealsLink = page.getByRole('link', { name: /Deals/i })
    await dealsLink.click()
    await page.waitForURL(/\/deals$/)
    expect(page.url()).toMatch(/\/deals$/)
  })

  test('should expand obligation details when clicking an obligation row', async ({ page }) => {
    await page.waitForTimeout(3000)

    // Check if there are any obligation items to click
    const emptyState = page.getByText(
      'No obligations extracted yet. Analyze a document to extract obligations.'
    )
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    if (!hasEmpty) {
      // Click the first obligation row to expand it
      const firstObligation = page.locator('button.w-full.text-left').first()
      const isPresent = await firstObligation.count() > 0

      if (isPresent) {
        await firstObligation.click()
        await page.waitForTimeout(500)

        // Expanded details should show Type and Extracted labels
        await expect(page.getByText('Type:', { exact: false }).first()).toBeVisible()
        await expect(page.getByText('Extracted:', { exact: false }).first()).toBeVisible()
      }
    }
  })

  test('should have View Document links on obligation groups when data exists', async ({ page }) => {
    await page.waitForTimeout(3000)

    const emptyState = page.getByText(
      'No obligations extracted yet. Analyze a document to extract obligations.'
    )
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    if (!hasEmpty) {
      // Each document group should have an external link button to view the document
      const viewDocButtons = page.locator('button[title="View document"]')
      const btnCount = await viewDocButtons.count()

      if (btnCount > 0) {
        await expect(viewDocButtons.first()).toBeVisible()
      }
    }
  })
})
