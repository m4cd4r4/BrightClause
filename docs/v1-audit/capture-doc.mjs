import { chromium } from 'playwright'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const DOC = '9772a3f5-67b6-45f3-a714-ca05eb8afa12'
const OUT = 'i:/Scratch/ContractClarity/docs/v1-audit/screenshots'
await page.goto(`https://brightclause.com/documents/${DOC}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(8000)
await page.screenshot({ path: `${OUT}/document-detail.png`, fullPage: true })
console.log('document-detail captured')
await page.goto(`https://brightclause.com/documents/${DOC}/graph`, { waitUntil: 'domcontentloaded', timeout: 30000 })
await page.waitForTimeout(6000)
await page.screenshot({ path: `${OUT}/knowledge-graph.png`, fullPage: true })
console.log('knowledge-graph captured')
await browser.close()
