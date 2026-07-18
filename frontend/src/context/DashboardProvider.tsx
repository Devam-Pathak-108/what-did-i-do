import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  getChatMessages,
  getProfile,
  listChatSessions,
  sendChatMessage,
  type ChatMessageItem,
  type ProfileResponse,
} from '../lib/api'
import { mapSessionToConversation } from '../lib/chatSessions'
import { clearSession, loadSession, saveSession } from '../lib/session'
import type { AuthMode, AuthSession } from '../types/auth'
import type { ChatMessage, Conversation } from '../types/chat'
import { useToast } from '../components/ui/toast-context'
import {
  DashboardContext,
  type DashboardContextValue,
} from './dashboard-context'

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

function mapApiMessages(items: ChatMessageItem[]): ChatMessage[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    )
    .map((item) => ({
      id: item.message_id,
      role: item.type === 'asked' ? 'user' : 'assistant',
      content: item.message,
      createdAt:
        typeof item.datetime === 'string'
          ? item.datetime
          : new Date(item.datetime).toISOString(),
    }))
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { error: showError, info: showInfo } = useToast()
  const [session, setSession] = useState<AuthSession | null>(() => loadSession())
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [listening, setListening] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(
    () => Boolean(loadSession()?.accessToken),
  )
  const [messagesById, setMessagesById] = useState<Record<string, ChatMessage[]>>(
    {},
  )

  const handleProfileLoaded = useCallback((profile: ProfileResponse) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = applyProfileToSession(prev, profile)
      saveSession(next)
      return next
    })
  }, [])

  const refreshConversations = useCallback(async () => {
    const token = session?.accessToken
    if (!token) {
      setConversations([])
      setConversationsLoading(false)
      return
    }

    try {
      const data = await listChatSessions(token, { page: 1, limit: 50 })
      setConversations(data.sessions.map(mapSessionToConversation))
    } catch (err) {
      showError(
        err instanceof Error ? err.message : 'Could not load chat history',
        'Chat history',
      )
    }
  }, [session?.accessToken, showError])

  useEffect(() => {
    if (!session?.accessToken) return
    const token: string = session.accessToken
    let cancelled = false

    async function loadProfile() {
      try {
        const profile = await getProfile(token)
        if (cancelled) return
        handleProfileLoaded(profile)
      } catch {
        // Keep existing session details if profile fetch fails.
      }
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [session?.accessToken, handleProfileLoaded])

  useEffect(() => {
    if (!session?.accessToken) {
      return
    }

    let cancelled = false
    const token = session.accessToken

    async function loadSessions() {
      try {
        const data = await listChatSessions(token, { page: 1, limit: 50 })
        if (cancelled) return
        setConversations(data.sessions.map(mapSessionToConversation))
      } catch (err) {
        if (!cancelled) {
          showError(
            err instanceof Error ? err.message : 'Could not load chat history',
            'Chat history',
          )
        }
      } finally {
        if (!cancelled) setConversationsLoading(false)
      }
    }

    void loadSessions()
    return () => {
      cancelled = true
    }
  }, [session?.accessToken, showError])

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
    setConversationsLoading(true)
  }, [])

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
    setShowWelcome(false)
    setListening(false)
    setConversations([])
    setConversationsLoading(false)
    setMessagesById({})
    showInfo('You have been signed out.', 'Logged out')
  }, [showInfo])

  const setConversationMessages = useCallback(
    (conversationId: string, messages: ChatMessage[]) => {
      setMessagesById((prev) => ({
        ...prev,
        [conversationId]: messages,
      }))
    },
    [],
  )

  const addConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const without = prev.filter((item) => item.id !== conversation.id)
      return [conversation, ...without]
    })
  }, [])

  const loadConversationMessages = useCallback(
    async (conversationId: string) => {
      const token = session?.accessToken
      if (!token) return

      try {
        const data = await getChatMessages(token, {
          session_id: conversationId,
          page: 1,
          limit: 50,
        })
        setConversationMessages(conversationId, mapApiMessages(data.messages))
      } catch (err) {
        showError(
          err instanceof Error ? err.message : 'Could not load messages',
          'Chat',
        )
      }
    },
    [session?.accessToken, setConversationMessages, showError],
  )

  const handleSend = useCallback(
    async (conversationId: string, text: string) => {
      const token = session?.accessToken
      const rawData = text.trim()
      if (!token || !rawData) return

      try {
        const chat = await sendChatMessage(token, {
          raw_data: rawData,
          session_id: conversationId,
        })
        const incoming = mapApiMessages(chat.messages)
        setMessagesById((prev) => {
          const existing = prev[conversationId] ?? []
          const seen = new Set(existing.map((item) => item.id))
          const toAdd = incoming.filter((item) => !seen.has(item.id))
          return {
            ...prev,
            [conversationId]: [...existing, ...toAdd],
          }
        })
        void refreshConversations()
      } catch (err) {
        showError(
          err instanceof Error ? err.message : 'Could not send message',
          'Chat',
        )
        throw err
      }
    },
    [session?.accessToken, refreshConversations, showError],
  )

  const getMessages = useCallback(
    (conversationId: string) => messagesById[conversationId] ?? [],
    [messagesById],
  )

  const value = useMemo<DashboardContextValue>(
    () => ({
      session,
      isLoggedIn: session !== null,
      conversations,
      conversationsLoading,
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
      setConversationMessages,
      addConversation,
      refreshConversations,
      loadConversationMessages,
    }),
    [
      session,
      conversations,
      conversationsLoading,
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
      setConversationMessages,
      addConversation,
      refreshConversations,
      loadConversationMessages,
    ],
  )

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  )
}
