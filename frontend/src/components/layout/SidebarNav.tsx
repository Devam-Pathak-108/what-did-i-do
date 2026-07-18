type SidebarNavProps = {
  active: 'profile' | 'chats'
  onProfileClick: () => void
  onChatsClick: () => void
}

export function SidebarNav({
  active,
  onProfileClick,
  onChatsClick,
}: SidebarNavProps) {
  return (
    <nav className="mb-4 space-y-1 px-1" aria-label="Main">
      <button
        type="button"
        onClick={onProfileClick}
        className={[
          'flex w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          active === 'profile'
            ? 'bg-accent-soft text-accent'
            : 'text-text hover:bg-surface-muted',
        ].join(' ')}
      >
        My Profile
      </button>
      <button
        type="button"
        onClick={onChatsClick}
        className={[
          'flex w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          active === 'chats'
            ? 'bg-accent-soft text-accent'
            : 'text-text hover:bg-surface-muted',
        ].join(' ')}
      >
        Chats
      </button>
    </nav>
  )
}
