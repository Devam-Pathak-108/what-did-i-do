import type { ReactNode } from 'react'

type ChatHistoryGroupProps = {
  dateLabel: string
  children: ReactNode
}

export function ChatHistoryGroup({ dateLabel, children }: ChatHistoryGroupProps) {
  return (
    <section className="mb-4 last:mb-0">
      <h3 className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {dateLabel}
      </h3>
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  )
}
