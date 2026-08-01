import { useId, useState, type FormEvent } from 'react'
import { getSupabase } from '../../lib/supabaseClient'
import type { MessageTree } from '../../i18n/messages'

type Props = { p: MessageTree['portal'] }

/** Same floor as the sign-up form; keep in sync with the Supabase password policy. */
const MIN_PASSWORD_LEN = 8

/**
 * Where a recovery link lands: the email puts the visitor here with a live session, and this is the
 * only place to actually set the new password. Doubles as «change my password» for everyone else.
 */
export function AccountPasswordSection({ p }: Props) {
  const fieldId = useId()
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (next.length < MIN_PASSWORD_LEN) {
      setMessage(p.portalCompactAuthPasswordTooShort)
      return
    }
    if (next !== repeat) {
      setMessage(p.accountPasswordMismatch)
      return
    }
    setBusy(true)
    try {
      const { error } = await getSupabase().auth.updateUser({ password: next })
      if (error) {
        setMessage(error.message)
        return
      }
      setNext('')
      setRepeat('')
      setMessage(p.accountPasswordSaved)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="portal-account__section" aria-labelledby={`${fieldId}-heading`}>
      <h3 id={`${fieldId}-heading`} className="portal-account__section-title">
        {p.accountPasswordHeading}
      </h3>
      <form className="portal-compact-auth__form" onSubmit={(ev) => void handleSubmit(ev)}>
        <div className="portal-compact-auth__field">
          <label className="portal-compact-auth__label" htmlFor={`${fieldId}-new`}>
            {p.accountPasswordNewLabel}
          </label>
          <input
            id={`${fieldId}-new`}
            className="portal-compact-auth__input"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(ev) => setNext(ev.target.value)}
            required
            minLength={MIN_PASSWORD_LEN}
            maxLength={128}
            disabled={busy}
          />
          <p className="portal-compact-auth__field-hint">{p.portalCompactAuthPasswordHint}</p>
        </div>
        <div className="portal-compact-auth__field">
          <label className="portal-compact-auth__label" htmlFor={`${fieldId}-repeat`}>
            {p.accountPasswordRepeatLabel}
          </label>
          <input
            id={`${fieldId}-repeat`}
            className="portal-compact-auth__input"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(ev) => setRepeat(ev.target.value)}
            required
            minLength={MIN_PASSWORD_LEN}
            maxLength={128}
            disabled={busy}
          />
        </div>
        <div className="portal-compact-auth__submit-wrap">
          <button
            type="submit"
            className="portal-btn portal-btn--primary portal-btn--compact portal-btn--block-xs"
            disabled={busy}
          >
            {busy ? '…' : p.accountPasswordSubmit}
          </button>
        </div>
      </form>
      {message ?
        <p role="status" className="portal-compact-auth__message">
          {message}
        </p>
      : null}
    </section>
  )
}
