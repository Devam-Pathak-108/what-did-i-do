import { createContext } from 'react'
import type { ProfileResponse } from '../lib/api'
import type { AuthMode, AuthSession } from '../types/auth'
import type { ChatMessage, Conversation } from '../types/chat'

export type DashboardContextValue = {
  session: AuthSession | null
  isLoggedIn: boolean
  conversations: Conversation[]
  messagesById: Record<string, ChatMessage[]>
  showWelcome: boolean
  setShowWelcome: (value: boolean) => void
  listening: boolean
  setListening: (value: boolean) => void
  authOpen: boolean
  authMode: AuthMode
  openAuth: (mode?: AuthMode) => void
  closeAuth: () => void
  handleAuthenticated: (session: AuthSession) => void
  handleLogout: () => void
  handleProfileLoaded: (profile: ProfileResponse) => void
  handleSend: (conversationId: string, text: string) => void
  getMessages: (conversationId: string) => ChatMessage[]
  setConversationMessages: (
    conversationId: string,
    messages: ChatMessage[],
  ) => void
  addConversation: (conversation: Conversation) => void
}

export const DashboardContext = createContext<DashboardContextValue | null>(null)
