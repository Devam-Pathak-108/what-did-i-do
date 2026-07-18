import { useToast, type ToastVariant } from './toast-context'

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-accent/30 bg-surface text-text',
  error: 'border-red-200 bg-surface text-text',
  info: 'border-border bg-surface text-text',
}

const accentStyles: Record<ToastVariant, string> = {
  success: 'bg-accent',
  error: 'bg-red-500',
  info: 'bg-text-muted',
}

export function ToastViewport() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-2 sm:px-0"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === 'error' ? 'alert' : 'status'}
          className={[
            'pointer-events-auto flex gap-3 rounded-xl border px-3.5 py-3 shadow-md',
            variantStyles[toast.variant],
          ].join(' ')}
        >
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${accentStyles[toast.variant]}`}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            {toast.title ? (
              <p className="text-sm font-semibold text-text">{toast.title}</p>
            ) : null}
            <p className="text-sm leading-relaxed text-text-muted">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismiss(toast.id)}
            className="shrink-0 rounded-md px-1.5 text-sm text-text-muted hover:bg-surface-muted hover:text-text"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
