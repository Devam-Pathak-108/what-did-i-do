type AboutAppProps = {
  onLoginClick?: () => void
}

export function AboutApp({ onLoginClick }: AboutAppProps) {
  return (
    <div className="space-y-4 px-1">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          About
        </p>
        <h2 className="mt-1 text-base font-semibold text-text">What Did I Do?</h2>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Your AI personal memory assistant. Speak about your day and we help
          you store, recall, and reflect on what you did.
        </p>
      </div>

      <ul className="space-y-2.5 text-sm text-text-muted">
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>Speech-to-text conversations about your day</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>History organized by date for easy recall</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>Daily and weekly summaries of your activities</span>
        </li>
        <li className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
          <span>Gentle insights to support better habits</span>
        </li>
      </ul>

      {onLoginClick ? (
        <p className="text-xs leading-relaxed text-text-muted">
          Sign in to start speaking and keep your conversation history.
        </p>
      ) : null}
    </div>
  )
}
