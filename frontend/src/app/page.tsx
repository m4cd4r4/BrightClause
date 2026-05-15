import {
  AlertTriangle,
  Info,
  Key,
  ShieldCheck,
  FileText,
  ArrowUpRight,
  CheckCircle,
} from 'lucide-react'

export const metadata = {
  title: 'BrightClause - contract intelligence',
  description:
    'BrightClause reads PDFs, extracts every clause, scores risk on a four-tier scale, and cites the page and section behind every finding. You bring your Anthropic key.',
  icons: {
    icon: [
      { url: '/v2/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/v2/icon-512.svg',
    shortcut: '/v2/favicon.svg',
  },
}

export default function LandingV2() {
  return (
    <div className="bc-root">
      <header className="m-top">
        <div className="m-top__inner">
          <a className="bc-wordmark" href="#">
            BrightClause
          </a>
          <nav className="m-nav">
            <a href="#what">What it does</a>
            <a href="#evidence">Evidence trail</a>
            <a href="#byok">Your key</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <div className="row" style={{ gap: 6 }}>
            <button className="bcb bcb-ghost">Sign in</button>
            <button className="bcb bcb-primary">Try with one PDF</button>
          </div>
        </div>
      </header>

      <section className="m-hero">
        <div className="m-hero__inner">
          <div className="m-hero__copy">
            <div className="m-hero__stamp">
              <span className="bc-mono">FINDING</span>
              <span className="m-hero__stamp-dot" />
              <span className="bc-mono">03:42 elapsed</span>
              <span className="m-hero__stamp-dot" />
              <span className="bc-mono">acme-msa-final-2026-04-22.pdf</span>
            </div>

            <h1 className="m-finding-headline">
              Indemnity is broader than market norm for vendor agreements.
            </h1>

            <div className="m-hero__meta">
              <span className="bc-risk bc-risk-high">
                <AlertTriangle size={12} />
                HIGH
              </span>
              <span className="bc-cite">p.18 § 11.2</span>
              <span className="bc-confidence">
                <span className="bc-confidence-bar">
                  <i className="on-high" />
                  <i className="on-high" />
                  <i className="on-high" />
                  <i className="on-high" />
                  <i />
                </span>
                0.86 confidence
              </span>
              <span className="bc-mono m-hero__meta-aside">extracted 1 of 47 clauses</span>
            </div>

            <div className="m-hero__rule" />

            <p className="m-lede">
              BrightClause reads PDFs, extracts every clause, scores risk on a four-tier scale, and
              cites the page and section behind every finding. You bring your Anthropic key. We
              never store it.
            </p>

            <div className="row" style={{ gap: 8, marginTop: 24 }}>
              <button className="bcb bcb-primary bcb-lg">Upload a PDF</button>
              <button className="bcb bcb-secondary bcb-lg">Open the sample analysis</button>
            </div>

            <div className="m-trust">
              <span>
                <Key size={14} /> Your Anthropic API key, kept in your browser session
              </span>
              <span>
                <ShieldCheck size={14} /> Documents never used for model training
              </span>
              <span>
                <FileText size={14} /> PDF stays on your infrastructure
              </span>
            </div>
          </div>

          <div className="m-hero__specimen">
            <div className="m-frame">
              <div className="m-frame__chrome">
                <span className="m-mono">source · page 18 of 38</span>
                <span className="bc-status bc-status-verified" style={{ fontSize: 9 }}>
                  Verified
                </span>
              </div>
              <div className="m-frame__body m-frame__body--stack">
                <div className="m-pdf">
                  <div className="m-pdf__sheet">
                    <div className="m-pdf__line w-100" />
                    <div className="m-pdf__line w-90" />
                    <div className="m-pdf__line w-80" />
                    <div style={{ height: 8 }} />
                    <div className="m-pdf__head">11. INDEMNIFICATION</div>
                    <div className="m-pdf__line w-100" />
                    <div className="m-pdf__highlight">
                      <div className="m-pdf__line w-100" style={{ background: '#0a1d63' }} />
                      <div className="m-pdf__line w-95" style={{ background: '#0a1d63' }} />
                      <div className="m-pdf__line w-88" style={{ background: '#0a1d63' }} />
                      <div className="m-pdf__line w-92" style={{ background: '#0a1d63' }} />
                    </div>
                    <div className="m-pdf__line w-100" />
                    <div className="m-pdf__line w-75" />
                  </div>
                </div>
                <div className="m-find">
                  <span className="bc-label" style={{ display: 'block', marginBottom: 6 }}>
                    PLAIN ENGLISH
                  </span>
                  <p className="m-finding-plain" style={{ margin: 0 }}>
                    If they leak your secrets, they pay everything you lose, with no upper limit.
                    Most vendor contracts cap this at a year of fees.
                  </p>
                  <div className="m-find__foot">
                    <span className="bc-mono">from §11.2, sentence 2</span>
                    <button className="bcb bcb-ghost bcb-sm">
                      Open in viewer <ArrowUpRight size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="m-section" id="what">
        <div className="m-section__inner">
          <div className="m-section__head">
            <span className="bc-label">01 · WHAT IT DOES</span>
            <h2 className="bc-h1">Four operations, on a real clause.</h2>
            <p className="m-section__lede">
              The clause below is § 11.2 from the sample MSA. The four numbered marks show what
              BrightClause does to it.
            </p>
          </div>

          <div className="m-spec">
            <div className="m-spec__clause">
              <div className="m-spec__chrome">
                <span className="bc-mono">§ 11.2 INDEMNIFICATION</span>
                <span className="bc-mono">p.18 of 38</span>
              </div>
              <div className="m-spec__body">
                <p className="bc-prose">
                  Customer shall indemnify Provider against any{' '}
                  <span className="m-spec__mark">1</span> and all losses, damages, claims, costs
                  and expenses, including <span className="m-spec__mark">2</span> indirect and
                  consequential damages, arising from any <span className="m-spec__mark">3</span>{' '}
                  breach of confidentiality, without limitation as to amount{' '}
                  <span className="m-spec__mark">4</span>.
                </p>
              </div>
            </div>

            <ol className="m-spec__callouts">
              <li className="m-spec__callout">
                <div className="m-spec__num">01</div>
                <div>
                  <span className="bc-label">EXTRACTS CLAUSES</span>
                  <p>
                    Identified as an indemnification clause. Tagged for the source page, section
                    number, and 15 other clause types it appears alongside.
                  </p>
                </div>
              </li>
              <li className="m-spec__callout">
                <div className="m-spec__num">02</div>
                <div>
                  <span className="bc-label">SCORES RISK</span>
                  <p>
                    Marked{' '}
                    <span className="bc-risk bc-risk-high" style={{ verticalAlign: 1 }}>
                      <AlertTriangle size={11} />
                      HIGH
                    </span>{' '}
                    because the indemnity covers indirect and consequential damages, with no cap,
                    for a confidentiality breach.
                  </p>
                </div>
              </li>
              <li className="m-spec__callout">
                <div className="m-spec__num">03</div>
                <div>
                  <span className="bc-label">ANSWERS QUESTIONS</span>
                  <p>
                    If you ask &quot;am I liable for indirect damages?&quot;, BrightClause cites
                    this clause and § 14.3 to answer &quot;yes, for confidentiality breach
                    only&quot;.
                  </p>
                </div>
              </li>
              <li className="m-spec__callout">
                <div className="m-spec__num">04</div>
                <div>
                  <span className="bc-label">TRACKS OBLIGATIONS</span>
                  <p>
                    No dated obligation in this clause, so nothing is added to the timeline.
                    Survival period is recorded from § 9.4 instead.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="m-section m-section--alt" id="evidence">
        <div className="m-section__inner">
          <div className="m-section__head">
            <span className="bc-label">02 · EVIDENCE TRAIL</span>
            <h2 className="bc-h1">Every finding traces back to a page and a clause.</h2>
            <p className="m-section__lede">
              Citations are the unit of trust in this product. They are not a footnote. They are
              not behind a tooltip. Every model claim, in every view, carries the page reference
              where it came from.
            </p>
          </div>

          <div className="m-evidence">
            <div className="m-evidence__row">
              <span className="bc-label" style={{ width: 120, flexShrink: 0 }}>
                IN PROSE
              </span>
              <div className="m-evidence__demo">
                <p className="bc-prose" style={{ margin: 0 }}>
                  Termination requires 90 days&apos; written notice{' '}
                  <span className="bc-cite">p.14 § 8.2</span>. The provision is mutual and does not
                  contain a fee-payable carve-out for early termination by the customer.
                </p>
              </div>
            </div>

            <div className="m-evidence__row">
              <span className="bc-label" style={{ width: 120, flexShrink: 0 }}>
                IN A TABLE
              </span>
              <div className="m-evidence__demo">
                <table className="bc-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Clause</th>
                      <th>Finding</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Indemnification</td>
                      <td>
                        <span className="bc-risk bc-risk-high">
                          <AlertTriangle size={12} />
                          HIGH
                        </span>{' '}
                        Uncapped for confidentiality breach
                      </td>
                      <td>
                        <span className="bc-cite">p.18 § 11.2</span>
                      </td>
                    </tr>
                    <tr>
                      <td>Termination</td>
                      <td>
                        <span className="bc-risk bc-risk-medium">
                          <Info size={12} />
                          MEDIUM
                        </span>{' '}
                        90 days notice, mutual
                      </td>
                      <td>
                        <span className="bc-cite">p.14 § 8.2</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="m-evidence__row">
              <span className="bc-label" style={{ width: 120, flexShrink: 0 }}>
                IN CHAT
              </span>
              <div className="m-evidence__demo">
                <div className="m-chat">
                  <div className="m-chat__q">Am I liable for indirect damages?</div>
                  <div className="m-chat__a">
                    <p>
                      Yes, for breach of confidentiality only. The mutual liability cap excludes
                      confidentiality breaches <span className="bc-cite">p.22 § 14.3</span>, and
                      the indemnity at <span className="bc-cite">p.18 § 11.2</span> expressly
                      covers indirect and consequential damages flowing from confidentiality
                      breach.
                    </p>
                    <div className="m-chat__sources">
                      <FileText size={13} /> Source clauses · 2
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="m-section" id="byok">
        <div className="m-section__inner m-byok">
          <div>
            <span className="bc-label">03 · YOUR KEY</span>
            <h2 className="bc-h1">BrightClause runs on your Anthropic key, not ours.</h2>
            <p className="m-section__lede">
              You paste your key once per session. It is stored in your browser only. Every
              analysis call goes from your machine to Anthropic, not via our servers. We never see
              the key, the prompt, or the response.
            </p>
            <ul className="m-byok__list">
              <li>
                <Key />
                <div>
                  <b>Cost is your line item, not ours.</b>
                  <p>
                    You pay Anthropic at standard rates. No markup. No per-document fee. A 40-page
                    MSA costs roughly the price of a coffee in tokens.
                  </p>
                </div>
              </li>
              <li>
                <ShieldCheck />
                <div>
                  <b>Documents leave your browser only when you act.</b>
                  <p>
                    The PDF stays in your storage. Only the extracted text chunks needed for the
                    analysis are sent, and only when you trigger an extraction.
                  </p>
                </div>
              </li>
              <li>
                <CheckCircle />
                <div>
                  <b>Revocable in one click.</b>
                  <p>
                    Clearing your browser session clears the key. There is no server-side record
                    to delete.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="m-keycard">
            <div className="m-keycard__head">
              <span className="bc-mono" style={{ color: 'var(--bc-ink-3)', fontSize: 11 }}>
                SETTINGS · API KEY
              </span>
              <span className="bc-status bc-status-verified" style={{ fontSize: 10 }}>
                Valid
              </span>
            </div>
            <div style={{ padding: 18 }}>
              <div className="bc-label" style={{ marginBottom: 6 }}>
                ANTHROPIC API KEY
              </div>
              <input
                className="bci"
                type="text"
                defaultValue="sk-ant-api03-Xb4kZ  ··············  dW"
                style={{ font: 'var(--bc-t-mono-sm)' }}
              />
              <div className="m-keycard__meta">
                <div>
                  <span className="bc-label">SCOPE</span>
                  <span className="bc-mono">claude-haiku-4-5</span>
                </div>
                <div>
                  <span className="bc-label">STORED</span>
                  <span className="bc-mono">browser session only</span>
                </div>
                <div>
                  <span className="bc-label">USED</span>
                  <span className="bc-mono">14 calls · ~$0.42 today</span>
                </div>
              </div>
              <div className="m-keycard__foot">
                <button className="bcb bcb-secondary bcb-sm">Revoke key</button>
                <button className="bcb bcb-primary bcb-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="m-section m-section--alt">
        <div className="m-section__inner">
          <div className="m-section__head">
            <span className="bc-label">04 · USER JOBS</span>
            <h2 className="bc-h1">Six sentences from your head.</h2>
            <p className="m-section__lede">
              If the product cannot answer one of these, it is not finished. Every view in the app
              maps back to one of them.
            </p>
          </div>
          <div className="m-jobs">
            <article className="m-job">
              <span className="bc-label">JOB 01</span>
              <p className="m-job__line">
                I have a 40-page MSA on my desk and a meeting in two hours. What is risky in here?
              </p>
              <p className="m-job__caption">→ Document analysis · risk-tier summary</p>
            </article>
            <article className="m-job">
              <span className="bc-label">JOB 02</span>
              <p className="m-job__line">
                Where exactly in this PDF does it say I am liable for indirect damages?
              </p>
              <p className="m-job__caption">→ In-document viewer · clause navigation</p>
            </article>
            <article className="m-job">
              <span className="bc-label">JOB 03</span>
              <p className="m-job__line">
                Compare these three vendor agreements. Which has the worst termination clause?
              </p>
              <p className="m-job__caption">→ Comparison matrix</p>
            </article>
            <article className="m-job">
              <span className="bc-label">JOB 04</span>
              <p className="m-job__line">
                What am I obligated to do, and by when, across every contract we signed this
                quarter?
              </p>
              <p className="m-job__caption">→ Obligations timeline</p>
            </article>
            <article className="m-job">
              <span className="bc-label">JOB 05</span>
              <p className="m-job__line">Explain clause 12.4 to me as if I were not a lawyer.</p>
              <p className="m-job__caption">→ Plain-English translator</p>
            </article>
            <article className="m-job">
              <span className="bc-label">JOB 06</span>
              <p className="m-job__line">
                Show every confidentiality clause across our portfolio with a survival period over
                five years.
              </p>
              <p className="m-job__caption">→ Hybrid search</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="m-foot">
        <div className="m-foot__inner">
          <div className="row" style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 48 }}>
            <div>
              <a className="bc-wordmark" href="#" style={{ marginBottom: 14, display: 'inline-flex' }}>
                BrightClause
              </a>
              <p className="bc-mono" style={{ color: 'var(--bc-ink-3)', maxWidth: 320, fontSize: 11, margin: '14px 0 0' }}>
                Contract intelligence for the person staring at a 40-page agreement at 4pm with a 6pm deadline.
              </p>
            </div>
            <div className="m-foot__cols">
              <div>
                <div className="bc-label" style={{ marginBottom: 10 }}>PRODUCT</div>
                <a href="#">Document analysis</a>
                <a href="#">Portfolio view</a>
                <a href="#">Comparison</a>
                <a href="#">Obligations</a>
                <a href="#">Q&amp;A chat</a>
              </div>
              <div>
                <div className="bc-label" style={{ marginBottom: 10 }}>FOR</div>
                <a href="#">In-house counsel</a>
                <a href="#">Contracts managers</a>
                <a href="#">M&amp;A due diligence</a>
                <a href="#">Procurement</a>
              </div>
              <div>
                <div className="bc-label" style={{ marginBottom: 10 }}>CO</div>
                <a href="#">Security</a>
                <a href="#">Privacy</a>
                <a href="#">Pricing</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </div>
          <div className="m-foot__rule" />
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span className="bc-mono" style={{ color: 'var(--bc-ink-4)', fontSize: 11 }}>
              BRIGHTCLAUSE · CONTRACT INTELLIGENCE
            </span>
            <span className="bc-mono" style={{ color: 'var(--bc-ink-4)', fontSize: 11 }}>
              v2026.05.14 · all systems normal
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
