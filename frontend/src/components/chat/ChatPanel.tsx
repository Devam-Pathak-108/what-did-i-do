import type { ChatMessage } from '../../types/chat'
import { ChatMessageList } from './ChatMessageList'
import { ChatComposer } from './ChatComposer'

type ChatPanelProps = {
  title: string
  messages: ChatMessage[]
  userName: string
  onSend: (text: string) => void
}

export function ChatPanel({
  title,
  messages,
  userName,
  onSend,
}: ChatPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-bg">
      <header className="shrink-0 border-b border-border bg-surface px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Conversation
        </p>
        <h1 className="mt-0.5 truncate text-base font-semibold text-text">
          {title}
        </h1>
      </header>

      <ChatMessageList messages={messages} userName={userName} />
      <ChatComposer onSend={onSend} />
    </div>
  )
}
