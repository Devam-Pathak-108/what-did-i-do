import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ChatPanel } from '../components/chat/ChatPanel'
import { SpeakButton } from '../components/speak/SpeakButton'
import { mockConversations } from '../data/mockConversations'
import { useDashboard } from '../context/useDashboard'

function findConversationTitle(id: string): string {
  for (const group of mockConversations) {
    const match = group.items.find((item) => item.id === id)
    if (match) return match.title
  }
  return 'Conversation'
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const {
    session,
    isLoggedIn,
    listening,
    setListening,
    openAuth,
    handleSend,
    getMessages,
  } = useDashboard()

  const activeTitle = useMemo(
    () => (conversationId ? findConversationTitle(conversationId) : ''),
    [conversationId],
  )

  if (!isLoggedIn || !session) {
    return <Navigate to="/" replace state={{ from: '/chat' }} />
  }

  if (conversationId) {
    return (
      <ChatPanel
        title={activeTitle}
        messages={getMessages(conversationId)}
        userName={session.username}
        onSend={(text) => handleSend(conversationId, text)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
        Chats
      </p>
      <SpeakButton
        enabled
        onRequireAuth={() => openAuth('login')}
        onToggle={setListening}
      />
      <h1 className="mt-6 text-xl font-semibold text-text">
        {listening ? 'Listening…' : 'Click to speak'}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
        {listening
          ? 'Share what you did today. Tap again when you are done.'
          : 'Select a conversation from the sidebar, or start speaking here.'}
      </p>
    </div>
  )
}
