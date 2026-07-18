import { useState } from 'react'
import { IconButton } from '../ui/IconButton'

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 15a3.5 3.5 0 0 0 3.5-3.5V7a3.5 3.5 0 1 0-7 0v4.5A3.5 3.5 0 0 0 12 15Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3M9.5 20h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type SpeakButtonProps = {
  enabled?: boolean
  onRequireAuth?: () => void
  onToggle?: (listening: boolean) => void
}

export function SpeakButton({
  enabled = true,
  onRequireAuth,
  onToggle,
}: SpeakButtonProps) {
  const [listening, setListening] = useState(false)

  function handleClick() {
    if (!enabled) {
      onRequireAuth?.()
      return
    }

    setListening((prev) => {
      const next = !prev
      onToggle?.(next)
      return next
    })
  }

  return (
    <IconButton
      label={
        !enabled
          ? 'Log in to speak'
          : listening
            ? 'Stop listening'
            : 'Click to speak'
      }
      size="xl"
      pressed={enabled ? listening : false}
      onClick={handleClick}
      className={[
        enabled && listening
          ? 'bg-accent text-white shadow-sm'
          : 'bg-accent-soft text-accent hover:bg-accent hover:text-white',
      ].join(' ')}
    >
      <MicIcon className="h-10 w-10" />
    </IconButton>
  )
}
