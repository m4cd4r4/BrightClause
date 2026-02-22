import { chromium } from 'playwright'
import fs from 'fs'

const BASE_URL = process.env.CAPTURE_URL || 'http://localhost:3000'
const FRAMES_DIR = 'docs/gif-frames'

if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, { recursive: true })

async function capture() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

  // Bypass walkthrough
  await page.addInitScript(() => {
    localStorage.setItem('bc_walkthrough_seen', 'true')
  })

  let frame = 0
  const shot = async (name) => {
    const path = `${FRAMES_DIR}/${String(frame).padStart(3, '0')}-${name}.png`
    await page.screenshot({ path, fullPage: false })
    console.log(`Frame ${frame}: ${name}`)
    frame++
  }

  // 1. Landing page hero
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(4000)
  await shot('landing-hero')

  // 2. Scroll to How It Works
  try {
    await page.evaluate(() => {
      const el = document.querySelector('h2')
      const sections = document.querySelectorAll('h2')
      for (const s of sections) {
        if (s.textContent.includes('How It Works')) {
          s.scrollIntoView({ behavior: 'instant', block: 'start' })
          break
        }
      }
    })
    await page.waitForTimeout(1500)
    await shot('how-it-works')
  } catch (e) {
    console.log('Skipping How It Works:', e.message)
  }

  // 3. Scroll to Key Features
  try {
    await page.evaluate(() => {
      const sections = document.querySelectorAll('h2')
      for (const s of sections) {
        if (s.textContent.includes('Key Features')) {
          s.scrollIntoView({ behavior: 'instant', block: 'start' })
          break
        }
      }
    })
    await page.waitForTimeout(1500)
    await shot('key-features')
  } catch (e) {
    console.log('Skipping Key Features:', e.message)
  }

  // 4. Dashboard
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(3000)
    await shot('dashboard')
  } catch (e) {
    console.log('Skipping dashboard:', e.message)
  }

  // 5. Click first document if available
  try {
    const pdfFiles = page.locator('h3').filter({ hasText: /\.pdf$/i })
    const docCount = await pdfFiles.count()
    if (docCount > 0) {
      await pdfFiles.first().click()
      await page.waitForTimeout(2000)
      await shot('doc-selected')

      const viewBtn = page.getByRole('button', { name: /View Full Analysis|View Details/i }).first()
      if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await viewBtn.click()
        await page.waitForURL(/\/documents\//, { timeout: 8000 }).catch(() => {})
        await page.waitForTimeout(2000)
        await shot('doc-detail')
      }
    }
  } catch (e) {
    console.log('Skipping doc selection:', e.message)
  }

  // 6. Deals page
  try {
    await page.goto(`${BASE_URL}/deals`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)
    await shot('deals')
  } catch (e) {
    console.log('Skipping deals:', e.message)
  }

  // 7. Obligations page
  try {
    await page.goto(`${BASE_URL}/obligations`, { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)
    await shot('obligations')
  } catch (e) {
    console.log('Skipping obligations:', e.message)
  }

  await browser.close()
  console.log(`\nDone! ${frame} frames captured to ${FRAMES_DIR}/`)
}

capture().catch(console.error)
