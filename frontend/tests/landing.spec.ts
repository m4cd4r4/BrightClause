import { test, expect } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:3000'

test.describe('ClauseLens Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
  })

  test('should load with correct title containing ClauseLens', async ({ page }) => {
    const title = await page.title()
    expect(title.toLowerCase()).toContain('clauselens')
  })

  test('should display hero section with correct heading text', async ({ page }) => {
    const hero = page.locator('h1')
    await expect(hero).toBeVisible()
    await expect(hero).toContainText('AI-Powered')
    await expect(hero).toContainText('Contract Analysis')
    await expect(hero).toContainText('M&A Due Diligence')
  })

  test('should display hero description paragraph', async ({ page }) => {
    await expect(
      page.getByText('Upload contracts. Chat with them in plain English.')
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
    await expect(sourceLink).toHaveAttribute('href', 'https://github.com/m4cd4r4/ClauseLens')
    await expect(sourceLink).toHaveAttribute('target', '_blank')
  })

  test('should have Live Demo navigation link pointing to dashboard', async ({ page }) => {
    const demoLink = page.getByRole('link', { name: /Live Demo/i })
    await expect(demoLink).toBeVisible()
    await expect(demoLink).toHaveAttribute('href', '/dashboard')
  })

  test('should display How It Works section with 6 pipeline steps', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /How It Works/i })
    await expect(heading).toBeVisible()

    // Verify all 6 step titles are present
    const stepTitles = ['Upload', 'Extract', 'Embed', 'Analyze', 'Chat', 'Act']
    for (const title of stepTitles) {
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    }

    // Verify step numbers
    const stepNumbers = ['01', '02', '03', '04', '05', '06']
    for (const num of stepNumbers) {
      await expect(page.getByText(num, { exact: true })).toBeVisible()
    }
  })

  test('should display Key Features section with 12 feature cards', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Key Features/i })
    await expect(heading).toBeVisible()

    // Verify all 12 feature titles are present
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
    await expect(heading).toBeVisible()

    // Verify a representative sample of clause type pills
    const clauseTypes = [
      'Termination',
      'Indemnification',
      'Confidentiality',
      'Non-Compete',
      'Intellectual Property',
      'Force Majeure',
      'Governing Law',
      'Data Privacy',
      'Limitation of Liability',
      'Change of Control',
      'Assignment',
      'Dispute Resolution',
      'Warranty',
      'Payment Terms',
      'Insurance',
      'Audit Rights',
    ]

    for (const type of clauseTypes) {
      await expect(page.getByText(type, { exact: true })).toBeVisible()
    }
  })

  test('should display Tech Stack section with 4 categories', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Tech Stack/i })
    await expect(heading).toBeVisible()

    // Verify all 4 category headings
    const categories = ['Frontend', 'Backend', 'AI / ML', 'Infrastructure']
    for (const category of categories) {
      await expect(page.getByRole('heading', { name: category })).toBeVisible()
    }

    // Verify representative tech items from each category
    await expect(page.getByText('Next.js 14')).toBeVisible()
    await expect(page.getByText('FastAPI')).toBeVisible()
    await expect(page.getByText('Ollama (llama3.2)')).toBeVisible()
    await expect(page.getByText('PostgreSQL 16')).toBeVisible()
  })

  test('should display Production-Grade Architecture section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /Production-Grade Architecture/i })
    await expect(heading).toBeVisible()

    // Check architecture details
    await expect(page.getByText('RAG-Powered Chat')).toBeVisible()
    await expect(page.getByText('Async Task Processing')).toBeVisible()
    await expect(page.getByText('Full Audit Trail')).toBeVisible()
    await expect(page.getByText('Secure Architecture')).toBeVisible()

    // Check ASCII architecture diagram is present
    await expect(page.getByText('Next.js Frontend')).toBeVisible()
    await expect(page.getByText('FastAPI Backend')).toBeVisible()
  })

  test('should render footer with ClauseLens branding and GitHub link', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Check branding text
    await expect(footer.getByText('ClauseLens')).toBeVisible()
    await expect(footer.getByText('Built by Macdara')).toBeVisible()

    // Check GitHub link in footer
    const footerGithubLink = footer.getByRole('link', { name: /GitHub/i })
    await expect(footerGithubLink).toBeVisible()
    await expect(footerGithubLink).toHaveAttribute(
      'href',
      'https://github.com/m4cd4r4/ClauseLens'
    )

    // Check Dashboard link in footer
    const dashboardLink = footer.getByRole('link', { name: /Dashboard/i })
    await expect(dashboardLink).toBeVisible()
    await expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  test('should have a See It in Action CTA section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /See It in Action/i })
    await expect(heading).toBeVisible()

    // Second Explore the Demo link (in CTA section at bottom)
    const ctaLinks = page.getByRole('link', { name: /Explore the Demo/i })
    const count = await ctaLinks.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // View on GitHub link in CTA section
    await expect(page.getByText('View on GitHub')).toBeVisible()
  })

  test('should navigate to dashboard when clicking Explore the Demo', async ({ page }) => {
    const ctaLink = page.getByRole('link', { name: /Explore the Demo/i }).first()
    await ctaLink.click()
    await page.waitForURL(/\/dashboard$/)
    expect(page.url()).toMatch(/\/dashboard$/)
  })

  test('should have fixed navigation bar at top', async ({ page }) => {
    const nav = page.locator('nav').first()
    await expect(nav).toBeVisible()

    // Nav should contain ClauseLens text
    await expect(nav.getByText('ClauseLens')).toBeVisible()
  })
})
