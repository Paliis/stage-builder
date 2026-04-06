import { create } from 'zustand'
import { defaultStageBriefing, type StageBriefing } from '../domain/stageBriefing'

export type BriefingState = StageBriefing & {
  setBriefing: (patch: Partial<StageBriefing>) => void
}

const base = defaultStageBriefing()

export const useBriefingStore = create<BriefingState>((set) => ({
  ...base,
  setBriefing: (patch) => set((s) => ({ ...s, ...patch })),
}))
