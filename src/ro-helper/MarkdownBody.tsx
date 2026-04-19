import ReactMarkdown from 'react-markdown'

function ExternalLink({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith('http://') || href?.startsWith('https://')
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  )
}

/** Renders markdown article body (frontmatter already stripped). */
export function MarkdownBody({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => {
          void node
          return <ExternalLink {...props} />
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}
