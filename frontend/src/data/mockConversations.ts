import type { ChatDayGroup } from '../types/chat'

export const mockConversations: ChatDayGroup[] = [
  {
    dateLabel: 'Today',
    items: [
      {
        id: 'c1',
        title: 'Morning standup and coffee walk',
        createdAt: '2026-07-18T09:15:00.000Z',
      },
      {
        id: 'c2',
        title: 'Project planning for the week',
        createdAt: '2026-07-18T11:40:00.000Z',
      },
    ],
  },
  {
    dateLabel: 'Yesterday',
    items: [
      {
        id: 'c3',
        title: 'Dinner with friends',
        createdAt: '2026-07-17T19:20:00.000Z',
      },
      {
        id: 'c4',
        title: 'Gym and evening stretch',
        createdAt: '2026-07-17T17:05:00.000Z',
      },
    ],
  },
  {
    dateLabel: 'Jul 15',
    items: [
      {
        id: 'c5',
        title: 'Deep work on frontend UI',
        createdAt: '2026-07-15T14:30:00.000Z',
      },
      {
        id: 'c6',
        title: 'Weekly reflection check-in',
        createdAt: '2026-07-15T20:10:00.000Z',
      },
    ],
  },
  {
    dateLabel: 'Jul 12',
    items: [
      {
        id: 'c7',
        title: 'Team sync and notes',
        createdAt: '2026-07-12T10:00:00.000Z',
      },
      {
        id: 'c8',
        title: 'Quiet Sunday reset',
        createdAt: '2026-07-12T16:45:00.000Z',
      },
    ],
  },
]
