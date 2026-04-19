import { useContext } from 'react'
import { RoHelperFpsuContext, type RoHelperFpsuContextValue } from './roHelperFpsuPrefsContext'

export function useRoHelperFpsuPrefs(): RoHelperFpsuContextValue {
  const v = useContext(RoHelperFpsuContext)
  if (!v) throw new Error('useRoHelperFpsuPrefs must be used under RoHelperFpsuPrefsProvider')
  return v
}
