import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const BASE = 'https://brightclause.com'
const OUT = 'i:/Scratch/ContractClarity/docs/v1-audit/screenshots'

const routes = [
  ['landing', '/'],
  ['dashboard', '/dashboard'],
  ['search', '/search'],
  ['compare', '/compare'],
  ['analytics', '/analytics'],
  ['obligations', '/obligations'],
  ['deals', '/deals'],
]

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

for (const [name, path] of routes) {
  try {
    const r = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(4500)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    console.log(`${name} ${r?.status()} → ${OUT}/${name}.png`)
  } catch (e) {
    console.log(`${name} FAILED: ${e.message}`)
  }
}

// Also capture a real document detail page using a known doc id
try {
  await page.goto('https://brightclause.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 25000 })
  await page.waitForTimeout(4000)
  const firstDocHref = await page.$eval('a[href^="/documents/"]', (a) => a.getAttribute('href')).catch(() => null)
  if (firstDocHref) {
    await page.goto(BASE + firstDocHref, { waitUntil: 'domcontentloaded', timeout: 25000 })
    await page.waitForTimeout(5000)
    await page.screenshot({ path: `${OUT}/document-detail.png`, fullPage: true })
    console.log(`document-detail (${firstDocHref}) → ${OUT}/document-detail.png`)
  } else {
    console.log('document-detail: no link found on dashboard')
  }
} catch (e) {
  console.log('document-detail FAILED:', e.message)
}

await browser.close()
