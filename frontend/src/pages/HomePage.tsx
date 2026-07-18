import { SpeakButton } from '../components/speak/SpeakButton'
import { useDashboard } from '../context/useDashboard'

export function HomePage() {
  const {
    session,
    isLoggedIn,
    showWelcome,
    setShowWelcome,
    listening,
    setListening,
    openAuth,
  } = useDashboard()

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      {isLoggedIn && session && showWelcome ? (
        <div className="mb-8 max-w-md rounded-2xl border border-border bg-surface px-5 py-4 text-left">
          <p className="text-sm font-semibold text-text">
            Welcome, {session.username}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            You are signed in. Open My Profile, pick a chat, or tap the mic to
            start speaking about your day.
          </p>
          <button
            type="button"
            className="mt-3 text-xs font-medium text-accent hover:text-accent-hover"
            onClick={() => setShowWelcome(false)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
        What Did I Do?
      </p>
      <SpeakButton
        enabled={isLoggedIn}
        onRequireAuth={() => openAuth('login')}
        onToggle={setListening}
      />
      <h1 className="mt-6 text-xl font-semibold text-text">
        {!isLoggedIn
          ? 'Click to speak'
          : listening
            ? 'Listening…'
            : 'Click to speak'}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
        {!isLoggedIn
          ? 'Log in first to start a conversation. Tap the mic to open sign-in.'
          : listening
            ? 'Share what you did today. Tap again when you are done.'
            : 'Select a chat from history, or talk here to begin.'}
      </p>
    </div>
  )
}
