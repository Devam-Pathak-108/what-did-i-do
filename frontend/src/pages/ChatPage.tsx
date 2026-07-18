import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ChatPanel } from '../components/chat/ChatPanel'
import { SpeakCapture } from '../components/speak/SpeakCapture'
import { useDashboard } from '../context/useDashboard'

function ConversationView({
  conversationId,
  title,
  userName,
}: {
  conversationId: string
  title: string
  userName: string
}) {
  const { handleSend, getMessages, loadConversationMessages, session } =
    useDashboard()
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!session?.accessToken) return
    void loadConversationMessages(conversationId)
  }, [conversationId, session?.accessToken, loadConversationMessages])

  return (
    <ChatPanel
      title={title}
      messages={getMessages(conversationId)}
      userName={userName}
      sending={sending}
      onSend={async (text) => {
        setSending(true)
        try {
          await handleSend(conversationId, text)
        } finally {
          setSending(false)
        }
      }}
    />
  )
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { session, isLoggedIn, conversations } = useDashboard()

  if (!isLoggedIn || !session) {
    return <Navigate to="/" replace state={{ from: '/chat' }} />
  }

  if (conversationId) {
    const title =
      conversations.find((item) => item.id === conversationId)?.title ??
      'Conversation'

    return (
      <ConversationView
        key={conversationId}
        conversationId={conversationId}
        title={title}
        userName={session.username}
      />
    )
  }

  return <SpeakCapture />
}
