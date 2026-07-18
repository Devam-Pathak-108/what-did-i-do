import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-muted hover:text-text focus-visible:ring-accent',
  outline:
    'bg-surface text-text border border-border hover:bg-surface-muted focus-visible:ring-accent',
}

export function Button({
  children,
  variant = 'outline',
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
