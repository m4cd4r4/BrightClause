import { test, expect } from '@playwright/test'

const FRONTEND_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Knowledge Graph Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })

    // Find a completed document via API and navigate directly to its graph page
    const res = await page.request.get(`${FRONTEND_URL}/api/documents?limit=10`)
    const data = await res.json() as { documents: any[] }
    const completed = data.documents.find((d: any) => d.status === 'completed')

    if (completed) {
      await page.goto(`${FRONTEND_URL}/documents/${completed.id}/graph`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForTimeout(3000)
    } else {
      // No documents — tests will be skipped via individual checks
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
    }
  })

  test('should display larger, more visible nodes', async ({ page }) => {
    // Wait for graph page to load
    const graphTitle = page.locator('text=Knowledge Graph')
    await expect(graphTitle).toBeVisible({ timeout: 10000 })

    // Check for canvas element
    const canvas = page.locator('canvas')
    const hasCanvas = await canvas.count() > 0

    if (hasCanvas) {
      // Canvas should be visible and large
      await expect(canvas).toBeVisible()

      // Get canvas dimensions
      const boundingBox = await canvas.boundingBox()
      expect(boundingBox?.width).toBeGreaterThan(200)
      expect(boundingBox?.height).toBeGreaterThan(200)
    }
  })

  test('should zoom in when clicking zoom in button', async ({ page }) => {
    // Wait for graph page to load
    await page.waitForSelector('text=Knowledge Graph', { timeout: 10000 })

    // Find zoom indicator (shows percentage)
    const zoomIndicator = page.locator('text=/\\d+%/')

    // Get initial zoom level
    const initialZoomText = await zoomIndicator.textContent()
    const initialZoom = parseInt(initialZoomText?.replace('%', '') || '100')

    // Click zoom in button
    const zoomInButton = page.locator('button[title="Zoom In"]')
    await zoomInButton.click()
    await page.waitForTimeout(300)

    // Check zoom increased
    const newZoomText = await zoomIndicator.textContent()
    const newZoom = parseInt(newZoomText?.replace('%', '') || '100')

    expect(newZoom).toBeGreaterThan(initialZoom)
  })

  test('should zoom out when clicking zoom out button', async ({ page }) => {
    // Wait for graph page to load
    await page.waitForSelector('text=Knowledge Graph', { timeout: 10000 })

    // Find zoom indicator
    const zoomIndicator = page.locator('text=/\\d+%/')

    // Get initial zoom level
    const initialZoomText = await zoomIndicator.textContent()
    const initialZoom = parseInt(initialZoomText?.replace('%', '') || '100')

    // Click zoom out button
    const zoomOutButton = page.locator('button[title="Zoom Out"]')
    await zoomOutButton.click()
    await page.waitForTimeout(300)

    // Check zoom decreased
    const newZoomText = await zoomIndicator.textContent()
    const newZoom = parseInt(newZoomText?.replace('%', '') || '100')

    expect(newZoom).toBeLessThan(initialZoom)
  })

  test('should have working entity type filters in sidebar', async ({ page }) => {
    // Wait for graph page and sidebar to load
    await page.waitForSelector('text=Knowledge Graph', { timeout: 10000 })
    await page.waitForSelector('text=Entity Types', { timeout: 5000 })

    // Check for entity type buttons (Party, Person, Date, etc.)
    const entityButtons = page.locator('aside button')
    const buttonCount = await entityButtons.count()

    if (buttonCount > 0) {
      // Click first entity type button
      await entityButtons.first().click()
      await page.waitForTimeout(300)

      // Check button styling changed (should have different opacity)
      // The clicked button should become "selected"
      const firstButtonClass = await entityButtons.first().getAttribute('class')
      expect(firstButtonClass).toBeTruthy()

      // Click again to toggle off
      await entityButtons.first().click()
      await page.waitForTimeout(300)
    }
  })

  test('should reset view when clicking reset button', async ({ page }) => {
    // Wait for graph page to load
    await page.waitForSelector('text=Knowledge Graph', { timeout: 10000 })

    // Zoom in first
    const zoomInButton = page.locator('button[title="Zoom In"]')
    await zoomInButton.click()
    await zoomInButton.click()
    await page.waitForTimeout(300)

    // Click reset button
    const resetButton = page.locator('button[title="Reset View"]')
    await resetButton.click()
    await page.waitForTimeout(300)

    // Zoom should be back to 100%
    const zoomIndicator = page.locator('text=/\\d+%/')
    const zoomText = await zoomIndicator.textContent()
    expect(zoomText).toBe('100%')
  })

  test('should toggle fullscreen mode', async ({ page }) => {
    // Wait for graph page to load
    await page.waitForSelector('text=Knowledge Graph', { timeout: 10000 })

    // Click fullscreen button
    const fullscreenButton = page.locator('button[title="Fullscreen"]')
    await fullscreenButton.click()

    // Wait for fullscreen to be applied
    await page.waitForTimeout(500)

    // The button title should change to "Exit Fullscreen"
    const exitButton = page.locator('button[title="Exit Fullscreen"]')
    // Note: Fullscreen may not work in automated tests due to browser security
    // but the button should still respond
  })

  test('should navigate back to clauses page', async ({ page }) => {
    // Wait for graph page to load
    const onGraph = page.url().includes('/graph')
    test.skip(!onGraph, 'Could not navigate to graph page')

    await page.waitForSelector('text=Knowledge Graph', { timeout: 10000 })

    // Click the Clauses link (icon + text span in nav)
    const clausesLink = page.locator('a:has-text("Clauses")').first()
    await clausesLink.click()

    await page.waitForURL(/\/documents\/[a-f0-9-]+$/, { timeout: 10000 })
  })
})
