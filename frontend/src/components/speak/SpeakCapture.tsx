import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ApiError,
  createChatSession,
  sendChatMessage,
  type ChatMessageItem,
} from '../../lib/api'
import { getSpeechRecognition, type SpeechRecognitionLike } from '../../lib/speech'
import { useDashboard } from '../../context/useDashboard'
import { useToast } from '../ui/toast-context'
import { IconButton } from '../ui/IconButton'
import type { ChatMessage } from '../../types/chat'

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

function mapApiMessages(items: ChatMessageItem[]): ChatMessage[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime(),
    )
    .map((item) => ({
      id: item.message_id,
      role: item.type === 'asked' ? 'user' : 'assistant',
      content: item.message,
      createdAt:
        typeof item.datetime === 'string'
          ? item.datetime
          : new Date(item.datetime).toISOString(),
    }))
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

function titleFromTranscript(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= 48) return trimmed || 'New conversation'
  return `${trimmed.slice(0, 48)}…`
}

export function SpeakCapture() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    session,
    addConversation,
    setConversationMessages,
    refreshConversations,
  } = useDashboard()

  const [listening, setListening] = useState(false)
  const [value, setValue] = useState('')
  const [sending, setSending] = useState(false)

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
      toast.error(
        'Speech recognition is not available in this browser.',
        'Microphone unavailable',
      )
      return
    }

    baseValueRef.current = value

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

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
        baseValueRef.current =
          `${baseValueRef.current}${baseValueRef.current ? ' ' : ''}${finalChunk.trim()}`
      }
      const next = `${baseValueRef.current}${
        interim
          ? `${baseValueRef.current ? ' ' : ''}${interim.trim()}`
          : ''
      }`
      setValue(next.trimStart())
    }

    recognition.onerror = () => {
      setListening(false)
      recognitionRef.current = null
      toast.error('Could not capture speech. Please try again.')
    }

    recognition.onend = () => {
      setListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function handleMicClick() {
    if (sending) return
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  async function handleSend() {
    const rawData = value.trim()
    if (!rawData || !session?.accessToken || sending) return

    if (listening) stopListening()

    setSending(true)
    try {
      const created = await createChatSession(session.accessToken)
      const chat = await sendChatMessage(session.accessToken, {
        raw_data: rawData,
        session_id: created.session_id,
      })

      const messages = mapApiMessages(chat.messages)
      setConversationMessages(chat.session_id, messages)
      addConversation({
        id: chat.session_id,
        title: titleFromTranscript(rawData),
        createdAt: created.created_at,
      })
      void refreshConversations()

      toast.success('Your message was sent.', 'Conversation started')
      setValue('')
      baseValueRef.current = ''
      navigate(`/chat/${chat.session_id}`)
    } catch (err) {
      toast.error(errorMessage(err), 'Could not start chat')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
        Chats
      </p>

      <IconButton
        label={listening ? 'Stop listening' : 'Click to speak'}
        size="xl"
        pressed={listening}
        disabled={sending}
        onClick={handleMicClick}
        className={
          listening
            ? 'bg-accent text-white shadow-sm'
            : 'bg-accent-soft text-accent hover:bg-accent hover:text-white'
        }
      >
        <MicIcon className="h-10 w-10" />
      </IconButton>

      <h1 className="mt-6 text-xl font-semibold text-text">
        {listening ? 'Listening…' : 'Click to speak'}
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
        {listening
          ? 'Your words appear in the field below. Send anytime from the button on the right.'
          : 'Tap the mic to start. You can send from the bar below without stopping.'}
      </p>

      <div className="mt-6 w-full max-w-xl">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-transparent px-2 py-2 text-left">
          <textarea
            rows={1}
            value={value}
            disabled={sending}
            onChange={(event) => {
              setValue(event.target.value)
              if (!listening) {
                baseValueRef.current = event.target.value
              }
            }}
            placeholder={
              listening
                ? 'Listening… your speech appears here'
                : 'Your message will appear here…'
            }
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none"
          />

          <IconButton
            label={sending ? 'Sending…' : 'Send conversation'}
            size="md"
            disabled={sending || !value.trim()}
            onClick={() => {
              void handleSend()
            }}
            className="shrink-0 bg-accent text-white hover:bg-accent-hover disabled:bg-surface-muted disabled:text-text-muted"
          >
            <SendIcon className="h-5 w-5" />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
