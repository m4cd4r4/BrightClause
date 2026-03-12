import { request } from '@playwright/test'

// Safety net: deletes any deals whose name starts with '__e2e__'
// in case a test run fails before its afterAll cleanup runs.
export default async function globalTeardown() {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  const ctx = await request.newContext({ baseURL })

  const res = await ctx.get('/api/deals')
  if (!res.ok()) return

  const data = await res.json() as { deals: Array<{ id: string; name: string }> }
  const stale = data.deals.filter(d => d.name.startsWith('__e2e__'))

  await Promise.all(stale.map(d => ctx.delete(`/api/deals/${d.id}`)))

  if (stale.length > 0) {
    console.log(`[teardown] Cleaned up ${stale.length} stale __e2e__ deal(s)`)
  }

  await ctx.dispose()
}
