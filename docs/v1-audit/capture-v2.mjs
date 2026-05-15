import { chromium } from 'playwright'
const BASE = 'https://brightclause.com'
const OUT = 'i:/Scratch/ContractClarity/docs/v1-audit/screenshots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
// Suppress walkthrough across the session
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('bc_walkthrough_seen', 'true')
  } catch {}
})
const page = await ctx.newPage()
const routes = [
  ['dashboard', '/dashboard'],
  ['compare', '/compare'],
  ['obligations', '/obligations'],
  ['deals', '/deals'],
]
for (const [name, path] of routes) {
  try {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Try to dismiss any tour
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'))
      const skip = btns.find(b => /skip|close|dismiss/i.test(b.textContent || ''))
      if (skip) skip.click()
    }).catch(()=>{})
    await page.waitForTimeout(8000)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
    console.log(`${name} captured`)
  } catch (e) {
    console.log(`${name} FAILED:`, e.message)
  }
}
const DOC = '9772a3f5-67b6-45f3-a714-ca05eb8afa12'
try {
  await page.goto(`${BASE}/documents/${DOC}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(10000)
  await page.screenshot({ path: `${OUT}/document-detail.png`, fullPage: true })
  console.log('document-detail re-captured')
} catch (e) { console.log('doc fail:', e.message) }
await browser.close()
