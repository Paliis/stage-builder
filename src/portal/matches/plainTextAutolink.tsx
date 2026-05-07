import { Fragment, createElement } from 'react'
import { plainTextToAutolinkNodes } from './plainTextAutolinkHelpers'

/** Renders `text` with `http(s)://…` and `www.…` turned into external links. */
export function PlainTextAutolink({ text }: { text: string }) {
  return createElement(Fragment, null, ...plainTextToAutolinkNodes(text))
}
