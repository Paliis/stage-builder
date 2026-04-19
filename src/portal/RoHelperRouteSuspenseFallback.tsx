import { useI18n } from '../i18n/useI18n'

/** Shown inside `PortalShell` while the RO Helper JS chunk loads. */
export function RoHelperRouteSuspenseFallback() {
  const { tree } = useI18n()
  return (
    <p className="portal-shell__route-loading" role="status">
      {tree.roHelper.loading}
    </p>
  )
}
