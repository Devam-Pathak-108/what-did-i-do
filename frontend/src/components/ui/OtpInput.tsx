import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'

const OTP_LENGTH = 6
const DIGIT_PATTERN = /^\d$/

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  disabled?: boolean
  hasError?: boolean
}

export function OtpInput({
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  hasError = false,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '')

  useEffect(() => {
    if (!autoFocus) return
    const timer = window.setTimeout(() => inputsRef.current[0]?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [autoFocus])

  function updateDigit(index: number, digit: string) {
    const next = digits.slice()
    next[index] = digit
    onChange(next.join(''))
  }

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index))
    inputsRef.current[clamped]?.focus()
    inputsRef.current[clamped]?.select()
  }

  function handleChange(index: number, event: FormEvent<HTMLInputElement>) {
    const digit = event.currentTarget.value.replace(/\D/g, '').slice(-1)

    if (!digit) {
      updateDigit(index, '')
      return
    }

    if (!DIGIT_PATTERN.test(digit)) return

    updateDigit(index, digit)
    if (index < OTP_LENGTH - 1) focusIndex(index + 1)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) {
        updateDigit(index, '')
      } else if (index > 0) {
        updateDigit(index - 1, '')
        focusIndex(index - 1)
      }
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusIndex(index - 1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusIndex(index + 1)
      return
    }

    if (
      event.key.length === 1 &&
      !DIGIT_PATTERN.test(event.key) &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)

    if (!pasted) return

    const next = Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] ?? '').join('')
    onChange(next)
    focusIndex(Math.min(pasted.length, OTP_LENGTH) - 1)
  }

  return (
    <div
      className="flex justify-between gap-2"
      role="group"
      aria-label="One-time verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
          className={[
            'h-12 w-11 rounded-lg border bg-surface text-center text-lg font-semibold text-text',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
            hasError ? 'border-red-400' : 'border-border',
            disabled ? 'opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      ))}
    </div>
  )
}
