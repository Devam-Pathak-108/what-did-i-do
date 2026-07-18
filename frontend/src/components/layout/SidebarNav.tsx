import { NavLink, useLocation } from 'react-router-dom'

function navClass(isActive: boolean) {
  return [
    'flex w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    isActive
      ? 'bg-accent-soft text-accent'
      : 'text-text hover:bg-surface-muted',
  ].join(' ')
}

export function SidebarNav() {
  const location = useLocation()
  const chatsActive = location.pathname.startsWith('/chat')

  return (
    <nav className="mb-4 space-y-1 px-1" aria-label="Main">
      <NavLink to="/profile" className={({ isActive }) => navClass(isActive)}>
        My Profile
      </NavLink>
      <NavLink to="/chat" className={() => navClass(chatsActive)}>
        Chat
      </NavLink>
      <NavLink to="/summary" className={({ isActive }) => navClass(isActive)}>
        Chat Summary
      </NavLink>
    </nav>
  )
}
