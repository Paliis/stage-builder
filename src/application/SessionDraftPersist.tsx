import { useEffect } from 'react'
import { subscribeSessionDraftPersist } from './sessionDraft'

/** Періодично зберігає сцену та брифінг у localStorage. */
export function SessionDraftPersist() {
  useEffect(() => subscribeSessionDraftPersist(), [])
  return null
}
