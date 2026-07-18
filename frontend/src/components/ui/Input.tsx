import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, error, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <label className="flex flex-col gap-1.5 text-left">
      <span className="text-xs font-medium text-text">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={[
          'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text',
          'placeholder:text-text-muted/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
          error ? 'border-red-400' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
})
