/** Мінімальний інтервал між показами банера «доступна нова версія» (не спамити). */
export const PWA_UPDATE_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000

export const PWA_UPDATE_LAST_PROMPT_KEY = 'stage-builder-pwa-update-prompt-at'

export const PWA_UPDATE_AVAILABLE_EVENT = 'stage-builder:pwa-update-available'

type ApplyUpdate = (reloadPage?: boolean) => Promise<void>

let applyUpdateRef: ApplyUpdate | null = null

export function setPwaApplyUpdate(fn: ApplyUpdate): void {
  applyUpdateRef = fn
}

export async function applyPwaUpdate(): Promise<void> {
  if (applyUpdateRef) await applyUpdateRef(true)
}

export function canShowPwaUpdatePrompt(): boolean {
  try {
    const raw = localStorage.getItem(PWA_UPDATE_LAST_PROMPT_KEY)
    const last = raw ? Number(raw) : 0
    if (!Number.isFinite(last) || last <= 0) return true
    return Date.now() - last >= PWA_UPDATE_PROMPT_COOLDOWN_MS
  } catch {
    return true
  }
}

export function markPwaUpdatePromptShown(): void {
  try {
    localStorage.setItem(PWA_UPDATE_LAST_PROMPT_KEY, String(Date.now()))
  } catch {
    // private mode / quota
  }
}

/**
 * Викликається з onNeedRefresh (новий service worker готовий).
 * Показує UI не частіше ніж раз на {@link PWA_UPDATE_PROMPT_COOLDOWN_MS}.
 */
export function notifyPwaUpdateAvailable(): void {
  if (!canShowPwaUpdatePrompt()) return
  window.dispatchEvent(new Event(PWA_UPDATE_AVAILABLE_EVENT))
}
