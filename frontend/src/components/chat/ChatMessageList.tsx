import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types/chat'
import { ChatMessageBubble } from './ChatMessageBubble'

type ChatMessageListProps = {
  messages: ChatMessage[]
  userName?: string
}

export function ChatMessageList({ messages, userName }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="max-w-sm text-center text-sm text-text-muted">
          No messages yet. Type below or use the mic to start this conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
      {messages.map((message) => (
        <ChatMessageBubble
          key={message.id}
          message={message}
          userName={userName}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
