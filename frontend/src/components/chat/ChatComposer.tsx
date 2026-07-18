import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { IconButton } from '../ui/IconButton'

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionEventLike = {
  resultIndex: number
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
}

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

type ChatComposerProps = {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatComposer({ onSend, disabled = false }: ChatComposerProps) {
  const [value, setValue] = useState('')
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const baseValueRef = useRef('')

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  function stopListening() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setListening(false)
  }

  function startListening() {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      // Fallback: no browser STT — keep UI toggle only
      setListening(true)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    baseValueRef.current = value

    recognition.onresult = (event) => {
      let interim = ''
      let finalChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) {
          finalChunk += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (finalChunk) {
        baseValueRef.current = `${baseValueRef.current}${baseValueRef.current ? ' ' : ''}${finalChunk.trim()}`
      }
      const next = `${baseValueRef.current}${interim ? (baseValueRef.current ? ' ' : '') + interim.trim() : ''}`
      setValue(next.trimStart())
    }

    recognition.onerror = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function toggleListening() {
    if (disabled) return
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    if (listening) stopListening()
    onSend(trimmed)
    setValue('')
    baseValueRef.current = ''
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="shrink-0 px-4 pb-4 pt-2"
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-transparent px-2 py-2">
        <IconButton
          label={listening ? 'Stop speaking' : 'Speak into message'}
          size="md"
          pressed={listening}
          disabled={disabled}
          onClick={toggleListening}
          className={
            listening
              ? 'shrink-0 bg-accent text-white'
              : 'shrink-0 text-accent hover:bg-accent-soft'
          }
        >
          <MicIcon className="h-5 w-5" />
        </IconButton>

        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            listening
              ? 'Listening… speak now'
              : 'Message What Did I Do… (Enter to send)'
          }
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-1 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none"
        />

        <IconButton
          type="submit"
          label="Send message"
          size="md"
          disabled={disabled || !value.trim()}
          className="shrink-0 bg-accent text-white hover:bg-accent-hover disabled:bg-surface-muted disabled:text-text-muted"
        >
          <SendIcon className="h-5 w-5" />
        </IconButton>
      </div>
      {listening && !getSpeechRecognition() ? (
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-text-muted">
          Speech recognition is not available in this browser. You can still type.
        </p>
      ) : null}
    </form>
  )
}
