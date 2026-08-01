/**
 * Екранні кнопки навігації над планом і 3D: панорама стрілками, крок зуму, повернення до огляду.
 * З тачпада та миші панорама раніше була доступна лише жестами, про які ніде не написано.
 */
export type ViewNavPadLabels = {
  aria: string
  panUp: string
  panDown: string
  panLeft: string
  panRight: string
  zoomIn: string
  zoomOut: string
  reset: string
}

type ViewNavPadProps = {
  labels: ViewNavPadLabels
  /** Частка кадру за одне натискання стрілки. */
  step?: number
  /** Панорама не має сенсу, поки видно всю площадку. */
  panDisabled?: boolean
  onPan: (dxFraction: number, dyFraction: number) => void
  onZoom: (direction: 1 | -1) => void
  onReset: () => void
  className?: string
}

const DEFAULT_STEP = 0.25

function Chevron({ rotateDeg }: { rotateDeg: number }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotateDeg}deg)` }}
      aria-hidden="true"
    >
      <path d="M6 15l6-6 6 6" />
    </svg>
  )
}

export function ViewNavPad({
  labels,
  step = DEFAULT_STEP,
  panDisabled = false,
  onPan,
  onZoom,
  onReset,
  className,
}: ViewNavPadProps) {
  return (
    <div
      className={className ? `app__view-nav ${className}` : 'app__view-nav'}
      role="toolbar"
      aria-label={labels.aria}
    >
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--up"
        aria-label={labels.panUp}
        title={labels.panUp}
        disabled={panDisabled}
        onClick={() => onPan(0, step)}
      >
        <Chevron rotateDeg={0} />
      </button>
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--left"
        aria-label={labels.panLeft}
        title={labels.panLeft}
        disabled={panDisabled}
        onClick={() => onPan(-step, 0)}
      >
        <Chevron rotateDeg={-90} />
      </button>
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--reset"
        aria-label={labels.reset}
        title={labels.reset}
        onClick={onReset}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      </button>
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--right"
        aria-label={labels.panRight}
        title={labels.panRight}
        disabled={panDisabled}
        onClick={() => onPan(step, 0)}
      >
        <Chevron rotateDeg={90} />
      </button>
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--down"
        aria-label={labels.panDown}
        title={labels.panDown}
        disabled={panDisabled}
        onClick={() => onPan(0, -step)}
      >
        <Chevron rotateDeg={180} />
      </button>
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--zoom-in"
        aria-label={labels.zoomIn}
        title={labels.zoomIn}
        onClick={() => onZoom(1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        type="button"
        className="app__view-nav-btn app__view-nav-btn--zoom-out"
        aria-label={labels.zoomOut}
        title={labels.zoomOut}
        onClick={() => onZoom(-1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
