import { test, expect } from '@playwright/test'

const BASE = process.env.BASE_URL || 'http://localhost:3000'

test.describe('BrightClause Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
  })

  test('should load with correct title containing BrightClause', async ({ page }) => {
    const title = await page.title()
    expect(title.toLowerCase()).toContain('brightclause')
  })

  test('should display hero section with correct heading text', async ({ page }) => {
    const hero = page.locator('h1')
    await expect(hero).toBeVisible()
    await expect(hero).toContainText('Read Every Clause')
    await expect(hero).toContainText('Miss Nothing')
  })

  test('should display hero description paragraph', async ({ page }) => {
    await expect(
      page.getByText('Upload contracts and chat with them in plain English')
    ).toBeVisible()
  })

  test('should have Explore the Demo CTA button linking to dashboard', async ({ page }) => {
    const ctaLink = page.getByRole('link', { name: /Explore the Demo/i }).first()
    await expect(ctaLink).toBeVisible()
    await expect(ctaLink).toHaveAttribute('href', '/dashboard')
  })

  test('should have Source Code navigation link pointing to GitHub', async ({ page }) => {
    const sourceLink = page.getByRole('link', { name: /Source Code/i })
    await expect(sourceLink).toBeVisible()
    await expect(sourceLink).toHaveAttribute('href', 'https://github.com/m4cd4r4/BrightClause')
    await expect(sourceLink).toHaveAttribute('target', '_blank')
  })

  test('should have Live Demo navigation link pointing to dashboard', async ({ page }) => {
    const demoLink = page.getByRole('link', { name: /Live Demo/i })
    await expect(demoLink).toBeVisible()
    await expect(demoLink).toHaveAttribute('href', '/dashboard')
  })

  test('should display How It Works section with 6 pipeline steps', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /How It Works/i })
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible()

    const stepTitles = ['Upload', 'Extract', 'Embed', 'Analyze', 'Chat', 'Act']
    for (const title of stepTitles) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    }
  })

  test('should display Key Features section with 12 feature cards', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Key Features/i })
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible()

    const featureTitles = [
      'Chat with Your Contract',
      'AI Clause Extraction',
      'Plain-English Translator',
      'Risk Assessment',
      'Obligation Tracker',
      'Executive Reports',
      'Timeline Extraction',
      'Deal Grouping',
      'Knowledge Graph',
      'Hybrid Vector Search',
      'PDF Viewer & Export',
      'Dark & Light Mode',
    ]

    for (const title of featureTitles) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
  })

  test('should display 16+ Clause Types section with clause type pills', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /16\+ Clause Types/i })
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible()

    const clauseTypes = [
      'Termination', 'Indemnification', 'Confidentiality', 'Non-Compete',
      'Intellectual Property', 'Force Majeure', 'Governing Law', 'Data Privacy',
    ]
    for (const type of clauseTypes) {
      await expect(page.getByText(type, { exact: true })).toBeVisible()
    }
  })

  test('should display Built for Trust section with 4 trust signals', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Built for Trust/i })
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible()

    const signals = ['Self-Hosted & Private', 'Analysis in Seconds', 'Enterprise Architecture', 'Complete Audit Trail']
    for (const signal of signals) {
      await expect(page.getByRole('heading', { name: signal })).toBeVisible()
    }
  })

  test('should display Production-Grade Architecture section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Production-Grade Architecture/i })
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible()

    await expect(page.getByText('RAG-Powered Chat')).toBeVisible()
    await expect(page.getByText('Async Task Processing')).toBeVisible()
    await expect(page.getByText('Full Audit Trail')).toBeVisible()
    await expect(page.getByText('Secure Architecture')).toBeVisible()
  })

  test('should render footer with BrightClause branding and GitHub link', async ({ page }) => {
    const footer = page.locator('footer')
    await footer.scrollIntoViewIfNeeded()
    await expect(footer).toBeVisible()

    await expect(footer.getByText('BrightClause')).toBeVisible()
    await expect(footer.getByText('Built by Macdara')).toBeVisible()

    const footerGithubLink = footer.getByRole('link', { name: /GitHub/i })
    await expect(footerGithubLink).toBeVisible()
    await expect(footerGithubLink).toHaveAttribute('href', 'https://github.com/m4cd4r4/BrightClause')

    const dashboardLink = footer.getByRole('link', { name: /Dashboard/i })
    await expect(dashboardLink).toBeVisible()
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  test('should have Upload Your First Contract CTA section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Upload Your First Contract/i })
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeVisible()

    const ctaLinks = page.getByRole('link', { name: /Explore the Demo/i })
    const count = await ctaLinks.count()
    expect(count).toBeGreaterThanOrEqual(2)

    await expect(page.getByText('View on GitHub')).toBeVisible()
  })

  test('should navigate to dashboard when clicking Explore the Demo', async ({ page }) => {
    const ctaLink = page.getByRole('link', { name: /Explore the Demo/i }).first()
    await ctaLink.click()
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('should have fixed navigation bar at top', async ({ page }) => {
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()
    await expect(nav.getByText('BrightClause')).toBeVisible()
  })
})
