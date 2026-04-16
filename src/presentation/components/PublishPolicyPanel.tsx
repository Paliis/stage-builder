import type { MessageTree } from '../../i18n/messages'

export function PublishPolicyPanel({ tree }: { tree: MessageTree }) {
  const sp = tree.share
  return (
    <>
      <h2 className="app__onboarding-title app__publish-policy-heading">{sp.publishPolicyTitle}</h2>
      <div className="app__publish-policy-body">
        {sp.publishPolicyParagraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </>
  )
}
