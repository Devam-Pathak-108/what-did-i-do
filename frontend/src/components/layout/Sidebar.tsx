import type { ReactNode } from 'react'

type SidebarProps = {
  header: ReactNode
  children: ReactNode
  footer: ReactNode
}

export function Sidebar({ header, children, footer }: SidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-4">{header}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">{children}</div>
      <div className="shrink-0 border-t border-border px-4 py-3">{footer}</div>
    </div>
  )
}
