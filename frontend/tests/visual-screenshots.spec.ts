/**
 * Visual Screenshots for PR Comments
 *
 * Triggered by GitHub Actions on Vercel preview deployments.
 * Captures key sections of the landing page and the dashboard,
 * saving to test-screenshots/ for upload to the screenshots branch.
 *
 * Run: BASE_URL=<preview-url> npx playwright test tests/visual-screenshots.spec.ts --project=chromium
 */
import { test, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_DIR = path.resolve(__dirname, '../test-screenshots')

async function capture(page: Page, name: string) {
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}.png`),
    fullPage: false,
  })
}

async function scrollToSection(page: Page, text: string) {
  try {
    const el = page.getByText(text, { exact: false }).first()
    await el.scrollIntoViewIfNeeded({ timeout: 5000 })
    await page.evaluate(() => window.scrollBy(0, -80))
    await page.waitForTimeout(600)
  } catch {
    // section may not exist — skip scroll
  }
}

test.describe('Visual Screenshots', () => {
  test.setTimeout(120_000)

  test.beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  })

  test('landing — hero', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await capture(page, 'landing')
  })

  test('landing — screenshot showcase', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await scrollToSection(page, 'See It In Action')
    await page.waitForTimeout(600)
    await capture(page, 'showcase')
  })

  test('landing — architecture section', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await scrollToSection(page, 'Production-Grade Architecture')
    await page.waitForTimeout(600)
    await capture(page, 'architecture')
  })

  test('dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript(() => {
      localStorage.setItem('bc_walkthrough_seen', 'true')
    })
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await capture(page, 'dashboard')
  })
})
