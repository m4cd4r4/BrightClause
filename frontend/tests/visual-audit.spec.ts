/**
 * Visual Audit — captures screenshots of key pages in both dark and light modes
 * for manual UX inspection.
 *
 * Run: BASE_URL=https://brightclause.com npx playwright test tests/visual-audit.spec.ts --project=chromium
 */
import { test, Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_DIR = path.resolve(__dirname, '../audit-screenshots')

async function capture(page: Page, name: string) {
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}.png`),
    fullPage: false,
  })
}

async function captureFullPage(page: Page, name: string) {
  await page.screenshot({
    path: path.join(OUTPUT_DIR, `${name}.png`),
    fullPage: true,
  })
}

async function setTheme(page: Page, theme: 'dark' | 'light') {
  await page.addInitScript((t) => {
    localStorage.setItem('brightclause_theme', t)
  }, theme)
}

async function scrollToSection(page: Page, text: string) {
  try {
    const el = page.getByText(text, { exact: false }).first()
    await el.scrollIntoViewIfNeeded({ timeout: 5000 })
    await page.evaluate(() => window.scrollBy(0, -80))
    await page.waitForTimeout(600)
  } catch {
    // section may not exist
  }
}

test.describe('Visual Audit', () => {
  test.setTimeout(180_000)

  test.beforeAll(() => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  })

  // ── Landing Page ──────────────────────────────────────────────
  for (const theme of ['dark', 'light'] as const) {
    test(`landing hero — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await capture(page, `landing-hero-${theme}`)
    })

    test(`landing full page — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await captureFullPage(page, `landing-full-${theme}`)
    })

    test(`landing showcase — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await scrollToSection(page, 'See It In Action')
      await page.waitForTimeout(600)
      await capture(page, `landing-showcase-${theme}`)
    })

    test(`landing architecture — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await scrollToSection(page, 'Production-Grade Architecture')
      await page.waitForTimeout(600)
      await capture(page, `landing-architecture-${theme}`)
    })

    test(`landing footer — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(800)
      await capture(page, `landing-footer-${theme}`)
    })

    // ── Dashboard ──────────────────────────────────────────────
    test(`dashboard — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.addInitScript(() => {
        localStorage.setItem('bc_walkthrough_seen', 'true')
      })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await capture(page, `dashboard-${theme}`)
    })

    test(`dashboard full page — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.addInitScript(() => {
        localStorage.setItem('bc_walkthrough_seen', 'true')
      })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await captureFullPage(page, `dashboard-full-${theme}`)
    })

    // ── Document Detail (first sample doc) ─────────────────────
    test(`document detail — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.addInitScript(() => {
        localStorage.setItem('bc_walkthrough_seen', 'true')
      })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      // Click first document link
      const docLink = page.locator('a[href*="/documents/"]').first()
      if (await docLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await docLink.click()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)
        await capture(page, `document-detail-${theme}`)
        await captureFullPage(page, `document-detail-full-${theme}`)
      } else {
        // Fallback: just capture what we see
        await capture(page, `document-detail-nodoc-${theme}`)
      }
    })
  }

  // ── Mobile viewport ────────────────────────────────────────────
  for (const theme of ['dark', 'light'] as const) {
    test(`mobile landing — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)
      await capture(page, `mobile-landing-${theme}`)
    })

    test(`mobile dashboard — ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await setTheme(page, theme)
      await page.addInitScript(() => {
        localStorage.setItem('bc_walkthrough_seen', 'true')
      })
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)
      await capture(page, `mobile-dashboard-${theme}`)
    })
  }
})
