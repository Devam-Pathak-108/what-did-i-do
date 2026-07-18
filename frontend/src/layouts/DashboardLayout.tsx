import { useMemo } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { Sidebar } from '../components/layout/Sidebar'
import { SidebarNav } from '../components/layout/SidebarNav'
import { UserProfile } from '../components/profile/UserProfile'
import { ChatHistoryList } from '../components/history/ChatHistoryList'
import { AboutApp } from '../components/about/AboutApp'
import { AuthDialog } from '../components/auth/AuthDialog'
import { Button } from '../components/ui/Button'
import { useDashboard } from '../context/useDashboard'
import { groupConversationsByDate } from '../lib/chatSessions'

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    session,
    isLoggedIn,
    conversations,
    conversationsLoading,
    openAuth,
    closeAuth,
    authOpen,
    authMode,
    handleAuthenticated,
    handleLogout,
  } = useDashboard()

  const historyGroups = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations],
  )

  const activeChatId = location.pathname.startsWith('/chat/')
    ? decodeURIComponent(location.pathname.slice('/chat/'.length)) || null
    : null

  const isProtectedRoute =
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/summary')

  if (!isLoggedIn && isProtectedRoute) {
    return (
      <>
        <Navigate to="/" replace state={{ from: location.pathname }} />
        <AuthDialog
          open
          initialMode="login"
          onClose={() => {
            closeAuth()
            navigate('/')
          }}
          onAuthenticated={(next) => {
            handleAuthenticated(next)
            navigate(location.pathname)
          }}
        />
      </>
    )
  }

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            header={
              isLoggedIn && session ? (
                <UserProfile name={session.username} subtitle={session.email} />
              ) : (
                <div>
                  <p className="text-sm font-semibold text-text">What Did I Do?</p>
                  <p className="text-xs text-text-muted">Personal memory</p>
                </div>
              )
            }
            footer={
              isLoggedIn ? (
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    handleLogout()
                    navigate('/')
                  }}
                >
                  Log out
                </Button>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => openAuth('login')}
                >
                  Log in
                </Button>
              )
            }
          >
            {isLoggedIn ? (
              <>
                <SidebarNav />
                <ChatHistoryList
                  groups={historyGroups}
                  loading={conversationsLoading}
                  activeId={activeChatId}
                  onSelect={(id) => {
                    navigate(`/chat/${id}`)
                  }}
                />
              </>
            ) : (
              <AboutApp onLoginClick={() => openAuth('login')} />
            )}
          </Sidebar>
        }
      >
        <Outlet />
      </AppShell>

      <AuthDialog
        open={authOpen}
        initialMode={authMode}
        onClose={closeAuth}
        onAuthenticated={(next) => {
          handleAuthenticated(next)
          const from =
            typeof location.state === 'object' &&
            location.state &&
            'from' in location.state &&
            typeof (location.state as { from?: unknown }).from === 'string'
              ? (location.state as { from: string }).from
              : '/chat'
          navigate(from)
        }}
      />
    </>
  )
}
