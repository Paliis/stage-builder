import { useMemo, useRef } from 'react'
import { useFeaturedMatchesSliderAutoplay } from './matches/useFeaturedMatchesSliderAutoplay'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { isMatchPortalEnabled } from './featureFlags'
import { useUpcomingPublishedMatches } from './matches/useUpcomingPublishedMatches'
import { useMyActiveMatchRegistration } from './matches/useMyActiveMatchRegistration'
import { formatPortalDateShort } from './matches/matchStagesVisibility'
import { portalLabelMatchEventKind } from './matches/matchPortalLabels'
import { stripHttpUrlsFromPlainText } from './matches/plainTextAutolinkHelpers'
import { getMatchEventKindProfile } from '../domain/matchEventKindProfile'
import { parseMatchDiscipline, weaponClassLabel } from './shooterProfileCatalog'
import { useSupabaseSession } from './useSupabaseSession'
import { useOrganizerSelfServiceProfile } from './useOrganizerSelfServiceProfile'

const SLIDER_VISIBLE_MAX = 10

function scrollSliderBy(el: HTMLElement | null, direction: -1 | 1) {
  if (!el) return
  const card = el.querySelector<HTMLElement>('.portal-home__matches-feature-card')
  const step = card ? card.offsetWidth + 12 : el.clientWidth * 0.85
  el.scrollBy({ left: direction * step, behavior: 'smooth' })
}

/** Matches promo on `/:locale` home — guests: value prop; signed-in: active registration + shortcuts. */
export function PortalMatchesFeaturedBand() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const sliderRef = useRef<HTMLDivElement>(null)
  const matchPortalOn = isMatchPortalEnabled()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: organizerLoading, profile: organizerProfile } = useOrganizerSelfServiceProfile(user?.id)

  const { rows, error, loading: upcomingLoading } = useUpcomingPublishedMatches(matchPortalOn)
  const { registration: activeReg, loading: activeRegLoading } = useMyActiveMatchRegistration(
    user?.id,
    matchPortalOn && !sessionLoading && Boolean(user),
  )

  const sliderRows = useMemo(() => (rows ?? []).slice(0, SLIDER_VISIBLE_MAX), [rows])

  useFeaturedMatchesSliderAutoplay(
    sliderRef,
    sliderRows.length,
    !upcomingLoading && !error && sliderRows.length > 1,
  )
  const matchesHubPath = `/${locale}/matches`
  const accountPath = `/${locale}/account`
  const organizerMatchesPath = `/${locale}/matches/my`
  const locShort = locale === 'uk' ? 'uk' : 'en'

  const signedIn = Boolean(user) && !sessionLoading
  const showGuestOnboarding = !signedIn || (activeReg === null && !activeRegLoading)
  const showActiveReg = signedIn && activeReg != null
  const showReturningNoReg = signedIn && activeReg === null && !activeRegLoading
  const showOrganizerLink =
    signedIn && !organizerLoading && organizerProfile === 'active'

  if (!matchPortalOn) return null

  return (
    <section
      className="portal-home__matches-feature"
      aria-labelledby="portal-home-matches-feature-title"
    >
      <div className="portal-home__matches-feature-inner">
        <div className="portal-home__matches-feature-copy">
          <div className="portal-home__matches-feature-copy-body">
            <header className="portal-home__matches-feature-head">
              <h2 id="portal-home-matches-feature-title" className="portal-home__matches-feature-title">
                {p.portalHomeMatchesFeaturedTitle}
              </h2>
              {showGuestOnboarding ?
                <span className="portal-home__matches-feature-badge">{p.badgeNew}</span>
              : null}
            </header>

            <p className="portal-home__matches-feature-lead">
              {showActiveReg || showReturningNoReg ?
                p.portalHomeMatchesFeaturedLeadReturning
              : p.portalHomeMatchesFeaturedLead}
            </p>
          </div>

          <nav className="portal-home__matches-feature-links" aria-label={p.portalHomeMatchesFeaturedLinksAria}>
            <ul className="portal-home__matches-feature-link-list">
              <li>
                <Link className="portal-home__matches-feature-link" to={matchesHubPath}>
                  {p.portalHomeMatchesFeaturedLinkAllEvents}
                </Link>
              </li>
              {signedIn ?
                <li>
                  <Link className="portal-home__matches-feature-link" to={accountPath}>
                    {p.portalHomeMatchesFeaturedLinkMyRegistrations}
                  </Link>
                </li>
              : null}
              {showOrganizerLink ?
                <li>
                  <Link className="portal-home__matches-feature-link" to={organizerMatchesPath}>
                    {p.portalHomeMatchesFeaturedLinkOrganizerCabinet}
                  </Link>
                </li>
              : null}
            </ul>
          </nav>
        </div>

        <div className="portal-home__matches-feature-events">
          {upcomingLoading && rows === undefined ?
            <p className="portal-home__matches-feature-status">{p.portalHomeMatchesFeaturedLoading}</p>
          : error ?
            <p className="portal-home__matches-feature-status" role="alert">
              {p.portalPublishedMatchesLoadError}: {error}
            </p>
          : sliderRows.length === 0 ?
            <p className="portal-home__matches-feature-status">{p.portalHomeMatchesFeaturedEmpty}</p>
          :
            <>
              <div className="portal-home__matches-feature-slider-toolbar">
                <p className="portal-home__matches-feature-slider-label" id="portal-home-matches-slider-label">
                  {p.portalHomeMatchesFeaturedSliderLabel}
                </p>
                {sliderRows.length > 1 ?
                  <div className="portal-home__matches-feature-slider-nav">
                    <button
                      type="button"
                      className="portal-home__matches-feature-slider-btn"
                      aria-label={p.portalHomeMatchesFeaturedPrevAria}
                      onClick={() => scrollSliderBy(sliderRef.current, -1)}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="portal-home__matches-feature-slider-btn"
                      aria-label={p.portalHomeMatchesFeaturedNextAria}
                      onClick={() => scrollSliderBy(sliderRef.current, 1)}
                    >
                      ›
                    </button>
                  </div>
                : null}
              </div>
              <div
                ref={sliderRef}
                className="portal-home__matches-feature-slider"
                role="list"
                aria-labelledby="portal-home-matches-slider-label"
              >
                {sliderRows.map((m) => {
                  const detailPath = `/${locale}/matches/${m.id}`
                  const titleText = m.title.trim() || '—'
                  const coverUrl = m.cover_image_url?.trim() ?? ''
                  const kindProfile = getMatchEventKindProfile(m.match_event_kind ?? null)
                  const weaponId = parseMatchDiscipline(m.discipline)
                  const weaponLine =
                    kindProfile.showDisciplineOnCard && weaponId ?
                      weaponClassLabel(weaponId, locale)
                    : ''
                  const kindLine =
                    portalLabelMatchEventKind(m.match_event_kind ?? null, p) ||
                    p.portalMatchesHubListDash
                  const locationLine = stripHttpUrlsFromPlainText(m.location_label ?? '')
                  const dateLine = formatPortalDateShort(m.starts_at, locShort)
                  const isActiveMatch = activeReg?.matchId === m.id
                  return (
                    <Link
                      key={m.id}
                      to={detailPath}
                      className={`portal-home__matches-feature-card${isActiveMatch ? ' portal-home__matches-feature-card--yours' : ''}`}
                      role="listitem"
                    >
                      <div
                        className={`portal-home__matches-feature-card-cover${coverUrl ? '' : ' portal-home__matches-feature-card-cover--brand'}`}
                        aria-hidden="true"
                      >
                        {coverUrl ?
                          <img
                            className="portal-match-cover-img"
                            src={coverUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        : null}
                      </div>
                      <div className="portal-home__matches-feature-card-body">
                        {isActiveMatch ?
                          <span className="portal-home__matches-feature-card-yours">{p.portalHomeMatchesFeaturedYourEvent}</span>
                        : null}
                        <time className="portal-home__matches-feature-card-date" dateTime={m.starts_at}>
                          {dateLine}
                        </time>
                        <h3 className="portal-home__matches-feature-card-title" title={titleText}>
                          {titleText}
                        </h3>
                        <p className="portal-home__matches-feature-card-meta">
                          {weaponLine ?
                            <>
                              {weaponLine}
                              {' · '}
                            </>
                          : null}
                          {kindLine}
                          {locationLine ?
                            <>
                              {' · '}
                              <span className="portal-home__matches-feature-card-location">{locationLine}</span>
                            </>
                          : null}
                        </p>
                        <span className="portal-home__matches-feature-card-link">
                          {p.portalPublishedMatchOpenPrimary}
                          <span aria-hidden="true"> →</span>
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          }
        </div>
      </div>
    </section>
  )
}
