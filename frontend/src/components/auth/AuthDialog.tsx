import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { AuthMode, AuthSession, AuthStep } from '../../types/auth'
import {
  registerUser,
  TEMP_OTP,
  verifyCredentials,
  verifyOtp,
} from '../../data/tempAuthStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { OtpInput } from '../ui/OtpInput'

type AuthDialogProps = {
  open: boolean
  initialMode?: AuthMode
  onClose: () => void
  onAuthenticated: (session: AuthSession) => void
}

export function AuthDialog({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}: AuthDialogProps) {
  const titleId = useId()
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<AuthStep>('credentials')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    if (!open) return
    setMode(initialMode)
    setStep('credentials')
    setUsername('')
    setEmail('')
    setPassword('')
    setOtp('')
    setError('')
    setPendingSession(null)
  }, [open, initialMode])

  useEffect(() => {
    if (open && step === 'credentials') {
      const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50)
      return () => window.clearTimeout(timer)
    }
  }, [open, step, mode])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function switchMode(next: AuthMode) {
    setMode(next)
    setStep('credentials')
    setError('')
    setOtp('')
    setPendingSession(null)
  }

  function handleCredentialsSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (mode === 'signup') {
      const result = registerUser({ username, email, password })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setPendingSession({
        username: username.trim(),
        email: email.trim().toLowerCase(),
      })
      setStep('otp')
      return
    }

    const result = verifyCredentials(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPendingSession({
      username: result.user.username,
      email: result.user.email,
    })
    setStep('otp')
  }

  function handleOtpSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (otp.length !== 6) {
      setError('Please enter all 6 digits.')
      return
    }

    if (!verifyOtp(otp)) {
      setError('Invalid code. Use 123456 for now.')
      return
    }

    if (!pendingSession) {
      setError('Something went wrong. Please try again.')
      setStep('credentials')
      return
    }

    onAuthenticated(pendingSession)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/30 px-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {step === 'credentials' ? (
          <>
            <div className="mb-5 flex gap-1 rounded-lg bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={[
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'login'
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-text-muted hover:text-text',
                ].join(' ')}
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={[
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'signup'
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-text-muted hover:text-text',
                ].join(' ')}
              >
                Sign up
              </button>
            </div>

            <h2 id={titleId} className="text-lg font-semibold text-text">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              {mode === 'login'
                ? 'Log in to continue speaking and view your history.'
                : 'Sign up to start saving your daily conversations.'}
            </p>

            <form className="mt-5 space-y-3.5" onSubmit={handleCredentialsSubmit}>
              {mode === 'signup' ? (
                <Input
                  ref={firstFieldRef}
                  label="Username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              ) : null}
              <Input
                ref={mode === 'login' ? firstFieldRef : undefined}
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="ghost" fullWidth onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth>
                  Continue
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 id={titleId} className="text-lg font-semibold text-text">
              Verify your email
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Enter the code sent to{' '}
              <span className="font-medium text-text">
                {pendingSession?.email}
              </span>
              . For now, use <span className="font-medium text-text">{TEMP_OTP}</span>.
            </p>

            <form className="mt-5 space-y-3.5" onSubmit={handleOtpSubmit}>
              <div className="space-y-2">
                <span className="block text-xs font-medium text-text">
                  One-time code
                </span>
                <OtpInput
                  value={otp}
                  onChange={(next) => {
                    setOtp(next)
                    if (error) setError('')
                  }}
                  autoFocus
                  hasError={Boolean(error)}
                />
              </div>

              {error ? (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setStep('credentials')
                    setOtp('')
                    setError('')
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={otp.length !== 6}
                >
                  Verify
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
