export type Conversation = {
  id: string
  title: string
  createdAt: string // ISO
}

export type ChatDayGroup = {
  dateLabel: string
  items: Conversation[]
}

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string // ISO
}
