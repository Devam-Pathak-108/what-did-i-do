type AvatarSize = 'sm' | 'md' | 'lg'

type AvatarProps = {
  name: string
  src?: string
  size?: AvatarSize
  className?: string
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={[
          'shrink-0 rounded-full object-cover',
          sizeClasses[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-medium text-accent',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {initials}
    </div>
  )
}
