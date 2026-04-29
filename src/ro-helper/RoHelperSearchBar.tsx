import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import type { Locale } from '../i18n/messages'
import type { RoHelperDiscipline } from './constants'
import { categoryLabel, disciplineLabel } from './labels'
import { roHelperPath } from './paths'
import {
  searchRoHelper,
  type RoHelperSearchEntry,
  type RoHelperSearchHit,
} from './roHelperSearch'
import './RoHelperSearchBar.css'

const DEBOUNCE_MS = 150

type IndexState =
  | { status: 'idle' }
  | { status: 'loading'; locale: Locale }
  | { status: 'ready'; locale: Locale; entries: RoHelperSearchEntry[] }
  | { status: 'error'; locale: Locale }

async function loadIndex(locale: Locale): Promise<RoHelperSearchEntry[]> {
  const mod =
    locale === 'uk'
      ? await import('./data/searchIndex.uk.json')
      : await import('./data/searchIndex.en.json')
  return (mod.default ?? mod) as RoHelperSearchEntry[]
}

export function RoHelperSearchBar() {
  const { locale, tree } = useI18n()
  const rh = tree.roHelper
  const listboxId = useId()
  const inputId = useId()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [indexState, setIndexState] = useState<IndexState>({ status: 'idle' })
  const [trackedLocale, setTrackedLocale] = useState<Locale>(locale)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset cached index when locale changes (resync state without an effect — see React docs).
  if (trackedLocale !== locale) {
    setTrackedLocale(locale)
    setIndexState({ status: 'idle' })
  }

  function ensureIndex() {
    if (indexState.status !== 'idle') return
    const want = locale
    setIndexState({ status: 'loading', locale: want })
    loadIndex(want)
      .then((entries) => {
        setIndexState((prev) => {
          if (prev.status !== 'loading' || prev.locale !== want) return prev
          return { status: 'ready', locale: want, entries }
        })
      })
      .catch(() => {
        setIndexState((prev) => {
          if (prev.status !== 'loading' || prev.locale !== want) return prev
          return { status: 'error', locale: want }
        })
      })
  }

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const hits = useMemo<RoHelperSearchHit[]>(() => {
    if (indexState.status !== 'ready' || !debouncedQuery) return []
    return searchRoHelper(debouncedQuery, indexState.entries, 10)
  }, [indexState, debouncedQuery])

  const grouped = useMemo(() => {
    const m = new Map<RoHelperDiscipline, RoHelperSearchHit[]>()
    for (const h of hits) {
      const arr = m.get(h.discipline) ?? []
      arr.push(h)
      m.set(h.discipline, arr)
    }
    return [...m.entries()]
  }, [hits])

  const showDropdown =
    open &&
    (query.trim().length > 0 || indexState.status === 'loading' || indexState.status === 'error')

  function handleClear() {
    setQuery('')
    setDebouncedQuery('')
    inputRef.current?.focus()
  }

  function closeWithReset() {
    setOpen(false)
    setQuery('')
    setDebouncedQuery('')
  }

  return (
    <div className="ro-helper-search" ref={containerRef}>
      <div className="ro-helper-search__inner">
        <div
          className="ro-helper-search__field"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-owns={showDropdown ? listboxId : undefined}
        >
          <span className="ro-helper-search__icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            className="ro-helper-search__input"
            placeholder={rh.searchPlaceholder}
            aria-label={rh.searchAriaLabel}
            aria-controls={showDropdown ? listboxId : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (!open) setOpen(true)
              ensureIndex()
            }}
            onFocus={() => {
              setOpen(true)
              ensureIndex()
            }}
          />
          {query ? (
            <button
              type="button"
              className="ro-helper-search__clear"
              onClick={handleClear}
              aria-label={rh.searchClear}
            >
              ×
            </button>
          ) : null}
        </div>

        {showDropdown ? (
          <div className="ro-helper-search__dropdown" role="presentation">
            {indexState.status === 'loading' ? (
              <p className="ro-helper-search__hint">{rh.searchLoading}</p>
            ) : indexState.status === 'error' ? (
              <p className="ro-helper-search__hint" role="alert">
                {rh.searchEmpty}
              </p>
            ) : hits.length === 0 ? (
              <p className="ro-helper-search__hint">{rh.searchEmpty}</p>
            ) : (
              <ul
                id={listboxId}
                className="ro-helper-search__list"
                role="listbox"
                aria-label={rh.searchAriaLabel}
              >
                {grouped.map(([disc, rows]) => (
                  <li key={disc} className="ro-helper-search__group">
                    <p className="ro-helper-search__group-name">{disciplineLabel(disc, rh)}</p>
                    <ul className="ro-helper-search__items">
                      {rows.map((h) => (
                        <li
                          key={`${h.discipline}-${h.category}-${h.slug}`}
                          role="option"
                          aria-selected="false"
                        >
                          <Link
                            className="ro-helper-search__item"
                            to={roHelperPath(locale, h.discipline, h.category, h.slug)}
                            onClick={closeWithReset}
                          >
                            <span className="ro-helper-search__item-title">{h.title}</span>
                            <span className="ro-helper-search__item-meta">
                              {categoryLabel(h.category, rh)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
