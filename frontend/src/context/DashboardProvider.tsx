import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getProfile, type ProfileResponse } from '../lib/api'
import { clearSession, loadSession, saveSession } from '../lib/session'
import type { AuthMode, AuthSession } from '../types/auth'
import type { ChatMessage } from '../types/chat'
import { mockMessagesByConversation } from '../data/mockMessages'
import { useToast } from '../components/ui/toast-context'
import {
  DashboardContext,
  type DashboardContextValue,
} from './dashboard-context'

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

export function DashboardProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [listening, setListening] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [messagesById, setMessagesById] = useState<Record<string, ChatMessage[]>>(
    () => structuredClone(mockMessagesByConversation),
  )

  const handleProfileLoaded = useCallback((profile: ProfileResponse) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = applyProfileToSession(prev, profile)
      saveSession(next)
      return next
    })
  }, [])

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

  const openAuth = useCallback((mode: AuthMode = 'login') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])

  const closeAuth = useCallback(() => {
    setAuthOpen(false)
  }, [])

  const handleAuthenticated = useCallback((next: AuthSession) => {
    saveSession(next)
    setSession(next)
    setShowWelcome(true)
    setListening(false)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
    setShowWelcome(false)
    setListening(false)
    toast.info('You have been signed out.', 'Logged out')
  }, [toast])

  const handleSend = useCallback((conversationId: string, text: string) => {
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
      [conversationId]: [
        ...(prev[conversationId] ?? []),
        userMessage,
        assistantMessage,
      ],
    }))
  }, [])

  const getMessages = useCallback(
    (conversationId: string) => messagesById[conversationId] ?? [],
    [messagesById],
  )

  const value = useMemo<DashboardContextValue>(
    () => ({
      session,
      isLoggedIn: session !== null,
      messagesById,
      showWelcome,
      setShowWelcome,
      listening,
      setListening,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      handleAuthenticated,
      handleLogout,
      handleProfileLoaded,
      handleSend,
      getMessages,
    }),
    [
      session,
      messagesById,
      showWelcome,
      listening,
      authOpen,
      authMode,
      openAuth,
      closeAuth,
      handleAuthenticated,
      handleLogout,
      handleProfileLoaded,
      handleSend,
      getMessages,
    ],
  )

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  )
}
