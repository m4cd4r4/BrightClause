import { test } from '@playwright/test'

test('debug run analysis flow', async ({ page }) => {
  const apiLogs: { url: string; method: string; status: number; reqBody: string; resBody: string }[] = []

  // Log all API requests and responses
  page.on('request', async (req) => {
    const url = req.url()
    if (url.includes('/api/')) {
      let body = ''
      try { body = req.postData() ?? '' } catch { /* ignore */ }
      apiLogs.push({ url, method: req.method(), status: 0, reqBody: body, resBody: '' })
    }
  })

  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/')) {
      try {
        const body = await response.text()
        const entry = apiLogs.find(l => l.url === url && l.status === 0)
        if (entry) {
          entry.status = response.status()
          entry.resBody = body.slice(0, 1000)
        } else {
          apiLogs.push({ url, method: response.request().method(), status: response.status(), reqBody: '', resBody: body.slice(0, 1000) })
        }
      } catch { /* ignore */ }
    }
  })

  // Skip walkthrough
  await page.goto('https://brightclause.com/dashboard')
  await page.evaluate(() => localStorage.setItem('bc_walkthrough_seen', 'true'))
  await page.reload()
  await page.waitForLoadState('networkidle', { timeout: 20000 })

  // Click the second document (SaaS License Agreement)
  const rows = page.locator('div[role="button"].cursor-pointer')
  const count = await rows.count()
  console.log(`Found ${count} document rows`)

  // Click the second document
  const doc2 = rows.nth(1)
  const doc2Text = await doc2.innerText()
  console.log(`\nClicking: ${doc2Text.slice(0, 60).replace(/\n/g, ' ')}`)
  await doc2.click()
  await page.waitForTimeout(1000)

  // Check right panel state
  const panel = page.locator('[data-tour="analysis"]')
  const panelText = await panel.innerText()
  console.log(`Panel state: ${panelText.slice(0, 100).replace(/\n/g, ' ')}`)

  // Click "Run Analysis" if visible
  const runBtn = panel.locator('button:has-text("Run Analysis")')
  if (await runBtn.isVisible()) {
    console.log('\nClicking "Run Analysis"...')
    await runBtn.click()

    // Wait up to 30 seconds for analysis to complete
    console.log('Waiting for analysis to complete (up to 30s)...')
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000)
      const currentText = await panel.innerText().catch(() => '')
      const hasRisk = currentText.includes('Overall Risk Level')
      const hasRunning = currentText.includes('Analysis started') || currentText.includes('Run Analysis')
      console.log(`  ${i + 1}s: hasRisk=${hasRisk}, panel="${currentText.slice(0, 80).replace(/\n/g, ' ')}"`)

      if (hasRisk) {
        console.log('\nAnalysis COMPLETED successfully!')
        break
      }
    }
  } else {
    console.log('No "Run Analysis" button visible')
  }

  await page.screenshot({ path: 'tests/debug-analysis-result.png' })

  console.log('\n=== All API Calls (ordered) ===')
  for (const log of apiLogs) {
    if (log.url.includes('/analysis') || log.url.includes('/extract')) {
      console.log(`${log.method} ${log.status} ${log.url}`)
      if (log.reqBody) console.log(`  REQ: ${log.reqBody}`)
      console.log(`  RES: ${log.resBody}`)
    }
  }
})
