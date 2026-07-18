import type { ChatMessage } from '../../types/chat'
import { Avatar } from '../ui/Avatar'

type ChatMessageBubbleProps = {
  message: ChatMessage
  userName?: string
}

export function ChatMessageBubble({
  message,
  userName = 'You',
}: ChatMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={[
        'flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row',
      ].join(' ')}
    >
      <Avatar
        name={isUser ? userName : 'What Did I Do'}
        size="sm"
        className="mt-0.5"
      />
      <div
        className={[
          'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-md bg-accent text-white'
            : 'rounded-bl-md bg-surface-muted text-text',
        ].join(' ')}
      >
        {message.content}
      </div>
    </div>
  )
}
