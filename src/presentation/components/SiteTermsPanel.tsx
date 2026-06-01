import type { MessageTree } from '../../i18n/messages'

export function SiteTermsPanel({ tree }: { tree: MessageTree }) {
  const legal = tree.legal
  return (
    <>
      <h2 className="app__onboarding-title app__publish-policy-heading">{legal.siteTermsTitle}</h2>
      <p className="app__publish-policy-updated">{legal.siteTermsUpdated}</p>
      <div className="app__publish-policy-body">
        {legal.siteTermsSections.map((section) => (
          <section key={section.heading} className="app__publish-policy-section">
            <h3 className="app__publish-policy-section-heading">{section.heading}</h3>
            {section.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    </>
  )
}
