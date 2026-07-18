type ChatHistoryItemProps = {
  title: string
  timeLabel?: string
  active?: boolean
  onClick?: () => void
}

export function ChatHistoryItem({
  title,
  timeLabel,
  active = false,
  onClick,
}: ChatHistoryItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-text hover:bg-surface-muted',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="truncate text-sm font-medium">{title}</span>
      {timeLabel ? (
        <span
          className={[
            'text-xs',
            active ? 'text-accent/80' : 'text-text-muted',
          ].join(' ')}
        >
          {timeLabel}
        </span>
      ) : null}
    </button>
  )
}
