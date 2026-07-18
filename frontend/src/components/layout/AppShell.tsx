import type { ReactNode } from 'react'

type AppShellProps = {
  sidebar: ReactNode
  children: ReactNode
}

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-0 bg-bg">
      <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-surface">
        {sidebar}
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
