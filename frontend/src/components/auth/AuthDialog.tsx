import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { AuthMode, AuthSession, AuthStep } from '../../types/auth'
import {
  ApiError,
  login,
  register,
  sendOtp,
  verifyOtp,
} from '../../lib/api'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { OtpInput } from '../ui/OtpInput'
import { useToast } from '../ui/toast-context'

type PendingAuth = {
  userId: string
  email: string
  username: string
  password: string
}

type AuthDialogProps = {
  open: boolean
  initialMode?: AuthMode
  onClose: () => void
  onAuthenticated: (session: AuthSession) => void
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export function AuthDialog({
  open,
  initialMode = 'login',
  onClose,
  onAuthenticated,
}: AuthDialogProps) {
  // Mount fresh each time the dialog opens so form state resets without an effect.
  if (!open) return null

  return (
    <AuthDialogPanel
      key={initialMode}
      initialMode={initialMode}
      onClose={onClose}
      onAuthenticated={onAuthenticated}
    />
  )
}

type AuthDialogPanelProps = {
  initialMode: AuthMode
  onClose: () => void
  onAuthenticated: (session: AuthSession) => void
}

function AuthDialogPanel({
  initialMode,
  onClose,
  onAuthenticated,
}: AuthDialogPanelProps) {
  const toast = useToast()
  const titleId = useId()
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<AuthStep>('credentials')
  const [username, setUsername] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [pending, setPending] = useState<PendingAuth | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (step !== 'credentials') return
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50)
    return () => window.clearTimeout(timer)
  }, [step, mode])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, submitting])

  function switchMode(next: AuthMode) {
    if (submitting) return
    setMode(next)
    setStep('credentials')
    setOtp('')
    setPending(null)
  }

  function finishWithToken(token: {
    access_token: string
    user_id: string
    username: string
    email: string
  }) {
    onAuthenticated({
      userId: token.user_id,
      username: token.username,
      email: token.email,
      accessToken: token.access_token,
    })
    toast.success(`Welcome back, ${token.username}.`, 'Signed in')
    onClose()
  }

  async function beginOtpStep(next: PendingAuth) {
    await sendOtp(next.userId)
    setPending(next)
    setOtp('')
    setStep('otp')
    toast.info(`A verification code was sent to ${next.email}.`, 'Check your email')
  }

  async function handleCredentialsSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)

    try {
      if (mode === 'signup') {
        const registered = await register({
          username: username.trim(),
          email: identifier.trim().toLowerCase(),
          password,
        })

        toast.success('Account created. Verify with the code we sent.', 'Signed up')
        await beginOtpStep({
          userId: registered.user_id,
          email: registered.email,
          username: username.trim(),
          password,
        })
        return
      }

      const token = await login({
        identifier: identifier.trim(),
        password,
      })

      finishWithToken(token)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleOtpSubmit(event: FormEvent) {
    event.preventDefault()

    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits.', 'Invalid code')
      return
    }

    if (!pending) {
      toast.error('Something went wrong. Please try again.')
      setStep('credentials')
      return
    }

    setSubmitting(true)
    try {
      await verifyOtp(pending.userId, otp)
      toast.success('Email verified successfully.', 'Verified')

      const token = await login({
        identifier: pending.email,
        password: pending.password,
      })

      finishWithToken(token)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResendOtp() {
    if (!pending || submitting) return
    setSubmitting(true)
    try {
      await sendOtp(pending.userId)
      setOtp('')
      toast.success('A new code was sent to your email.', 'Code resent')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-text/30 px-4"
      role="presentation"
      onClick={() => {
        if (!submitting) onClose()
      }}
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
                  disabled={submitting}
                />
              ) : null}
              <Input
                ref={mode === 'login' ? firstFieldRef : undefined}
                label={mode === 'login' ? 'Email or username' : 'Email'}
                name={mode === 'login' ? 'identifier' : 'email'}
                type={mode === 'login' ? 'text' : 'email'}
                autoComplete={mode === 'login' ? 'username' : 'email'}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                required
                disabled={submitting}
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
                disabled={submitting}
              />

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={submitting}
                >
                  {submitting ? 'Please wait…' : 'Continue'}
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
              <span className="font-medium text-text">{pending?.email}</span>.
            </p>

            <form className="mt-5 space-y-3.5" onSubmit={handleOtpSubmit}>
              <div className="space-y-2">
                <span className="block text-xs font-medium text-text">
                  One-time code
                </span>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  autoFocus
                  disabled={submitting}
                />
              </div>

              <button
                type="button"
                className="text-xs font-medium text-accent hover:text-accent-hover disabled:opacity-50"
                onClick={handleResendOtp}
                disabled={submitting}
              >
                Resend code
              </button>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  disabled={submitting}
                  onClick={() => {
                    setStep('credentials')
                    setOtp('')
                  }}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? 'Verifying…' : 'Verify'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
