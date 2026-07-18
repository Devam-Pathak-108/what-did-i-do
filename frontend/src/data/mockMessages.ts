import type { ChatMessage } from '../types/chat'

/** Seed messages per conversation id for the chat panel. */
export const mockMessagesByConversation: Record<string, ChatMessage[]> = {
  c1: [
    {
      id: 'm1-1',
      role: 'assistant',
      content:
        'Good morning. What did you get up to today? I am ready to note it down.',
      createdAt: '2026-07-18T09:15:00.000Z',
    },
    {
      id: 'm1-2',
      role: 'user',
      content:
        'Had standup at 9, then a coffee walk with the team around the block.',
      createdAt: '2026-07-18T09:16:10.000Z',
    },
    {
      id: 'm1-3',
      role: 'assistant',
      content:
        'Noted — morning standup and a coffee walk. Anything else from this morning?',
      createdAt: '2026-07-18T09:16:20.000Z',
    },
  ],
  c2: [
    {
      id: 'm2-1',
      role: 'user',
      content: 'Spent the late morning planning the week with the product team.',
      createdAt: '2026-07-18T11:40:00.000Z',
    },
    {
      id: 'm2-2',
      role: 'assistant',
      content:
        'Captured: project planning for the week. Want a short summary later?',
      createdAt: '2026-07-18T11:40:15.000Z',
    },
  ],
  c3: [
    {
      id: 'm3-1',
      role: 'user',
      content: 'Dinner with friends at that new place downtown. Really fun night.',
      createdAt: '2026-07-17T19:20:00.000Z',
    },
    {
      id: 'm3-2',
      role: 'assistant',
      content: 'Sounds lovely. I saved dinner with friends to yesterday evening.',
      createdAt: '2026-07-17T19:20:12.000Z',
    },
  ],
  c4: [
    {
      id: 'm4-1',
      role: 'assistant',
      content: 'How was your evening workout?',
      createdAt: '2026-07-17T17:05:00.000Z',
    },
    {
      id: 'm4-2',
      role: 'user',
      content: 'Gym for about an hour, then a short stretch at home.',
      createdAt: '2026-07-17T17:06:00.000Z',
    },
  ],
  c5: [
    {
      id: 'm5-1',
      role: 'user',
      content: 'Focused deep work on the frontend dashboard UI most of the afternoon.',
      createdAt: '2026-07-15T14:30:00.000Z',
    },
    {
      id: 'm5-2',
      role: 'assistant',
      content: 'Logged deep work on the frontend UI. Nice stretch of focus.',
      createdAt: '2026-07-15T14:30:20.000Z',
    },
  ],
  c6: [
    {
      id: 'm6-1',
      role: 'assistant',
      content: 'Ready for your weekly reflection whenever you are.',
      createdAt: '2026-07-15T20:10:00.000Z',
    },
  ],
  c7: [
    {
      id: 'm7-1',
      role: 'user',
      content: 'Team sync this morning — covered blockers and next milestones.',
      createdAt: '2026-07-12T10:00:00.000Z',
    },
    {
      id: 'm7-2',
      role: 'assistant',
      content: 'Saved: team sync and notes from this morning.',
      createdAt: '2026-07-12T10:00:18.000Z',
    },
  ],
  c8: [
    {
      id: 'm8-1',
      role: 'user',
      content: 'Kept Sunday quiet — reset, light chores, early night.',
      createdAt: '2026-07-12T16:45:00.000Z',
    },
    {
      id: 'm8-2',
      role: 'assistant',
      content: 'Quiet Sunday reset noted. Rest days matter too.',
      createdAt: '2026-07-12T16:45:14.000Z',
    },
  ],
}
