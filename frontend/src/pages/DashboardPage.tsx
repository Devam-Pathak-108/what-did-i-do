import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Sidebar } from '../components/layout/Sidebar'
import { SidebarNav } from '../components/layout/SidebarNav'
import { UserProfile } from '../components/profile/UserProfile'
import { ProfilePanel } from '../components/profile/ProfilePanel'
import { ChatHistoryList } from '../components/history/ChatHistoryList'
import { SpeakButton } from '../components/speak/SpeakButton'
import { AboutApp } from '../components/about/AboutApp'
import { AuthDialog } from '../components/auth/AuthDialog'
import { ChatPanel } from '../components/chat/ChatPanel'
import { Button } from '../components/ui/Button'
import { mockConversations } from '../data/mockConversations'
import { mockMessagesByConversation } from '../data/mockMessages'
import { getProfile, type ProfileResponse } from '../lib/api'
import { clearSession, loadSession, saveSession } from '../lib/session'
import { useToast } from '../components/ui/toast-context'
import type { AuthMode, AuthSession } from '../types/auth'
import type { ChatMessage } from '../types/chat'

type MainView = 'home' | 'chat' | 'profile'

function findConversationTitle(id: string): string {
  for (const group of mockConversations) {
    const match = group.items.find((item) => item.id === id)
    if (match) return match.title
  }
  return 'Conversation'
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function applyProfileToSession(
  session: AuthSession,
  profile: ProfileResponse,
): AuthSession {
  return {
    ...session,
    userId: profile.user_id,
    username: profile.username,
    email: profile.email,
  }
}

export function DashboardPage() {
  const toast = useToast()
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [mainView, setMainView] = useState<MainView>('home')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [messagesById, setMessagesById] = useState<Record<string, ChatMessage[]>>(
    () => structuredClone(mockMessagesByConversation),
  )

  const isLoggedIn = session !== null
  const activeMessages = activeId ? (messagesById[activeId] ?? []) : []
  const activeTitle = useMemo(
    () => (activeId ? findConversationTitle(activeId) : ''),
    [activeId],
  )

  const handleProfileLoaded = useCallback((profile: ProfileResponse) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = applyProfileToSession(prev, profile)
      saveSession(next)
      return next
    })
  }, [])

  // Load profile whenever the user is logged in (including session restore).
  useEffect(() => {
    if (!session?.accessToken) return
    const token: string = session.accessToken

    let cancelled = false

    async function load() {
      try {
        const profile = await getProfile(token)
        if (cancelled) return
        handleProfileLoaded(profile)
      } catch {
        // Keep existing session details if profile fetch fails.
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [session?.accessToken, handleProfileLoaded])

  function openAuth(mode: AuthMode = 'login') {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  function handleAuthenticated(next: AuthSession) {
    saveSession(next)
    setSession(next)
    setShowWelcome(true)
    setActiveId(null)
    setListening(false)
    setMainView('home')
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setShowWelcome(false)
    setListening(false)
    setActiveId(null)
    setMainView('home')
    toast.info('You have been signed out.', 'Logged out')
  }

  function handleSend(text: string) {
    if (!activeId) return

    const now = new Date().toISOString()
    const userMessage: ChatMessage = {
      id: createId('user'),
      role: 'user',
      content: text,
      createdAt: now,
    }
    const assistantMessage: ChatMessage = {
      id: createId('assistant'),
      role: 'assistant',
      content: 'Got it — I have added that to this conversation.',
      createdAt: new Date().toISOString(),
    }

    setMessagesById((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), userMessage, assistantMessage],
    }))
  }

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            header={
              isLoggedIn ? (
                <UserProfile
                  name={session.username}
                  subtitle={session.email}
                />
              ) : (
                <div>
                  <p className="text-sm font-semibold text-text">What Did I Do?</p>
                  <p className="text-xs text-text-muted">Personal memory</p>
                </div>
              )
            }
            footer={
              isLoggedIn ? (
                <Button variant="ghost" fullWidth onClick={handleLogout}>
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
                <SidebarNav
                  active={mainView === 'profile' ? 'profile' : 'chats'}
                  onProfileClick={() => {
                    setMainView('profile')
                    setActiveId(null)
                    setShowWelcome(false)
                    setListening(false)
                  }}
                  onChatsClick={() => {
                    setMainView('home')
                    setActiveId(null)
                    setListening(false)
                  }}
                />
                <ChatHistoryList
                  groups={mockConversations}
                  activeId={mainView === 'chat' ? activeId : null}
                  onSelect={(id) => {
                    setActiveId(id)
                    setMainView('chat')
                    setShowWelcome(false)
                    setListening(false)
                  }}
                />
              </>
            ) : (
              <AboutApp onLoginClick={() => openAuth('login')} />
            )}
          </Sidebar>
        }
      >
        {isLoggedIn && mainView === 'profile' ? (
          <ProfilePanel
            token={session.accessToken}
            onProfileLoaded={handleProfileLoaded}
          />
        ) : isLoggedIn && mainView === 'chat' && activeId ? (
          <ChatPanel
            title={activeTitle}
            messages={activeMessages}
            userName={session.username}
            onSend={handleSend}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            {isLoggedIn && showWelcome ? (
              <div className="mb-8 max-w-md rounded-2xl border border-border bg-surface px-5 py-4 text-left">
                <p className="text-sm font-semibold text-text">
                  Welcome, {session.username}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  You are signed in. Open My Profile, pick a chat, or tap the mic
                  to start speaking about your day.
                </p>
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-accent hover:text-accent-hover"
                  onClick={() => setShowWelcome(false)}
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
              What Did I Do?
            </p>
            <SpeakButton
              enabled={isLoggedIn}
              onRequireAuth={() => openAuth('login')}
              onToggle={setListening}
            />
            <h1 className="mt-6 text-xl font-semibold text-text">
              {!isLoggedIn
                ? 'Click to speak'
                : listening
                  ? 'Listening…'
                  : 'Click to speak'}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
              {!isLoggedIn
                ? 'Log in first to start a conversation. Tap the mic to open sign-in.'
                : listening
                  ? 'Share what you did today. Tap again when you are done.'
                  : 'Select a chat from history, or talk here to begin.'}
            </p>
          </div>
        )}
      </AppShell>

      <AuthDialog
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </>
  )
}
