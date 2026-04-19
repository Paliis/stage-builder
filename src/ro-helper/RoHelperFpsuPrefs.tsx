import { useCallback, useEffect, useMemo, useState } from 'react'
import { RoHelperFpsuContext } from './roHelperFpsuPrefsContext'

const LS_KEY = 'ro-helper-fpsu-layer'

function readStored(): boolean {
  try {
    return localStorage.getItem(LS_KEY) !== '0'
  } catch {
    return true
  }
}

export function RoHelperFpsuPrefsProvider({ children }: { children: React.ReactNode }) {
  const [showFpsuLayer, setShowFpsuLayerState] = useState(readStored)

  const setShowFpsuLayer = useCallback((next: boolean) => {
    try {
      localStorage.setItem(LS_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
    setShowFpsuLayerState(next)
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_KEY || e.key === null) setShowFpsuLayerState(readStored())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(
    () => ({ showFpsuLayer, setShowFpsuLayer }),
    [showFpsuLayer, setShowFpsuLayer],
  )

  return <RoHelperFpsuContext.Provider value={value}>{children}</RoHelperFpsuContext.Provider>
}
