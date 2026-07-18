import { Navigate, useParams } from 'react-router-dom'
import { ChatPanel } from '../components/chat/ChatPanel'
import { SpeakCapture } from '../components/speak/SpeakCapture'
import { useDashboard } from '../context/useDashboard'

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { session, isLoggedIn, conversations, handleSend, getMessages } =
    useDashboard()

  if (!isLoggedIn || !session) {
    return <Navigate to="/" replace state={{ from: '/chat' }} />
  }

  if (conversationId) {
    const title =
      conversations.find((item) => item.id === conversationId)?.title ??
      'Conversation'

    return (
      <ChatPanel
        title={title}
        messages={getMessages(conversationId)}
        userName={session.username}
        onSend={(text) => handleSend(conversationId, text)}
      />
    )
  }

  return <SpeakCapture />
}
