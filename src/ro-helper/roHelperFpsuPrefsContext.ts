import { createContext } from 'react'

export type RoHelperFpsuContextValue = {
  showFpsuLayer: boolean
  setShowFpsuLayer: (v: boolean) => void
}

export const RoHelperFpsuContext = createContext<RoHelperFpsuContextValue | null>(null)
