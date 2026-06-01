/** Brand mark when `matches.cover_image_url` is empty (hub list thumbs). */

type Props = {

  className?: string

}



/**

 * Empty hook for CSS (`::after` logo tile). Parent must be `position: relative`

 * with explicit size — see `.portal-match-hub__published-card-thumb`.

 */

export function MatchCoverPlaceholder({ className }: Props) {

  return <span className={className ?? 'portal-match-cover-placeholder'} aria-hidden />

}

