import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastInput = {
  title?: string
  message: string
  variant?: ToastVariant
  durationMs?: number
}

type ToastItem = {
  id: string
  title?: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  toasts: ToastItem[]
  show: (input: ToastInput) => void
  success: (message: string, title?: string) => void
  error: (message: string, title?: string) => void
  info: (message: string, title?: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 4000

function createId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timeoutsRef = useRef<Map<string, number>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timeoutId = timeoutsRef.current.get(id)
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
      timeoutsRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (input: ToastInput) => {
      const id = createId()
      const variant = input.variant ?? 'info'
      const durationMs = input.durationMs ?? DEFAULT_DURATION_MS

      setToasts((prev) => [
        ...prev,
        {
          id,
          title: input.title,
          message: input.message,
          variant,
        },
      ])

      const timeoutId = window.setTimeout(() => {
        dismiss(id)
      }, durationMs)
      timeoutsRef.current.set(id, timeoutId)
    },
    [dismiss],
  )

  const success = useCallback(
    (message: string, title = 'Success') => {
      show({ message, title, variant: 'success' })
    },
    [show],
  )

  const error = useCallback(
    (message: string, title = 'Something went wrong') => {
      show({ message, title, variant: 'error' })
    },
    [show],
  )

  const info = useCallback(
    (message: string, title?: string) => {
      show({ message, title, variant: 'info' })
    },
    [show],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      show,
      dismiss,
      success,
      error,
      info,
    }),
    [toasts, show, dismiss, success, error, info],
  )

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
