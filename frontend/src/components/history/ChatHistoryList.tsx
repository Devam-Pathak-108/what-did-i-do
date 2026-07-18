import type { ChatDayGroup } from '../../types/chat'
import { ChatHistoryGroup } from './ChatHistoryGroup'
import { ChatHistoryItem } from './ChatHistoryItem'

type ChatHistoryListProps = {
  groups: ChatDayGroup[]
  activeId?: string | null
  onSelect?: (id: string) => void
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ChatHistoryList({
  groups,
  activeId = null,
  onSelect,
}: ChatHistoryListProps) {
  return (
    <div>
      <h2 className="mb-3 px-2.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Chat History
      </h2>

      {groups.length === 0 ? (
        <p className="px-2.5 py-2 text-sm text-text-muted">
          No conversations yet. Tap the mic to begin.
        </p>
      ) : (
        <nav aria-label="Chat history">
          {groups.map((group) => (
            <ChatHistoryGroup key={group.dateLabel} dateLabel={group.dateLabel}>
              {group.items.map((item) => (
                <ChatHistoryItem
                  key={item.id}
                  title={item.title}
                  timeLabel={formatTime(item.createdAt)}
                  active={item.id === activeId}
                  onClick={() => onSelect?.(item.id)}
                />
              ))}
            </ChatHistoryGroup>
          ))}
        </nav>
      )}
    </div>
  )
}
