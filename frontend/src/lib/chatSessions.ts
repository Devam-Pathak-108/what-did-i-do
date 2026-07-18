import type { ChatSessionListItem } from '../lib/api'
import type { ChatDayGroup, Conversation } from '../types/chat'

function startOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function dateLabelFor(iso: string): string {
  const date = startOfDay(new Date(iso))
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

export function mapSessionToConversation(
  session: ChatSessionListItem,
): Conversation {
  const title = session.first_message?.trim() || 'New conversation'
  return {
    id: session.session_id,
    title: title.length > 48 ? `${title.slice(0, 48)}…` : title,
    createdAt: session.updated_at || session.created_at,
  }
}

export function groupConversationsByDate(
  conversations: Conversation[],
): ChatDayGroup[] {
  const groups = new Map<string, Conversation[]>()

  for (const item of conversations) {
    const label = dateLabelFor(item.createdAt)
    const existing = groups.get(label)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(label, [item])
    }
  }

  return Array.from(groups.entries()).map(([dateLabel, items]) => ({
    dateLabel,
    items,
  }))
}
