import { useMemo, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { Sidebar } from '../components/layout/Sidebar'
import { UserProfile } from '../components/profile/UserProfile'
import { ChatHistoryList } from '../components/history/ChatHistoryList'
import { SpeakButton } from '../components/speak/SpeakButton'
import { AboutApp } from '../components/about/AboutApp'
import { AuthDialog } from '../components/auth/AuthDialog'
import { ChatPanel } from '../components/chat/ChatPanel'
import { Button } from '../components/ui/Button'
import { mockConversations } from '../data/mockConversations'
import { mockMessagesByConversation } from '../data/mockMessages'
import type { AuthMode, AuthSession } from '../types/auth'
import type { ChatMessage } from '../types/chat'

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

export function DashboardPage() {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
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

  function openAuth(mode: AuthMode = 'login') {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  function handleAuthenticated(next: AuthSession) {
    setSession(next)
    setShowWelcome(true)
    setActiveId(null)
    setListening(false)
  }

  function handleLogout() {
    setSession(null)
    setShowWelcome(false)
    setListening(false)
    setActiveId(null)
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
              <ChatHistoryList
                groups={mockConversations}
                activeId={activeId}
                onSelect={(id) => {
                  setActiveId(id)
                  setShowWelcome(false)
                  setListening(false)
                }}
              />
            ) : (
              <AboutApp onLoginClick={() => openAuth('login')} />
            )}
          </Sidebar>
        }
      >
        {isLoggedIn && activeId ? (
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
                  You are signed in. Open a chat from history, or tap the mic to
                  start speaking about your day.
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
