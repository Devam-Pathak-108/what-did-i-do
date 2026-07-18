import { useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ApiError,
  createSummary,
  type SummaryCreateResponse,
} from '../lib/api'
import { useDashboard } from '../context/useDashboard'
import { useToast } from '../components/ui/toast-context'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseYearMonth(isoDate: string): { month: number; year: number } {
  const [year, month] = isoDate.split('-').map(Number)
  return { year, month }
}

export function SummaryPage() {
  const toast = useToast()
  const { session, isLoggedIn } = useDashboard()

  const [startDate, setStartDate] = useState(todayIsoDate)
  const [endDate, setEndDate] = useState(todayIsoDate)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SummaryCreateResponse | null>(null)

  const derived = useMemo(() => {
    if (!startDate) return null
    return parseYearMonth(startDate)
  }, [startDate])

  if (!isLoggedIn || !session) {
    return <Navigate to="/" replace state={{ from: '/summary' }} />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session?.accessToken) return

    if (!startDate || !endDate) {
      toast.error('Please choose both From and To dates.')
      return
    }
    if (startDate > endDate) {
      toast.error('From date must be on or before To date.')
      return
    }

    const { month, year } = parseYearMonth(startDate)
    setLoading(true)
    setResult(null)

    try {
      const summary = await createSummary(session.accessToken, {
        type: 'date_range',
        start_date: startDate,
        end_date: endDate,
        month,
        year,
      })
      setResult(summary)
      toast.success('Your summary is ready.', 'Summary created')
    } catch (err) {
      toast.error(errorMessage(err), 'Could not create summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-6 py-6">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Insights
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">Chat Summary</h1>
        <p className="mt-1 text-sm text-text-muted">
          Pick a date range to generate a summary of what you did.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="From"
              name="start_date"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              required
              disabled={loading}
            />
            <Input
              label="To"
              name="end_date"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              required
              disabled={loading}
            />
          </div>

          {derived ? (
            <p className="text-xs text-text-muted">
              Using month <span className="font-medium text-text">{derived.month}</span>
              {' · '}
              year <span className="font-medium text-text">{derived.year}</span>
              {' '}from the From date.
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Generating…' : 'Generate summary'}
          </Button>
        </form>

        {result ? (
          <div className="mt-10 space-y-4 border-t border-border pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-text">Your summary</h2>
              <p className="text-xs text-text-muted">
                {result.start_date} → {result.end_date}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">
              {result.reply}
            </p>

            <div className="flex items-center gap-3 text-sm text-text-muted">
              <span>
                Productivity score:{' '}
                <span className="font-medium text-text">
                  {result.score.toFixed(1)}
                </span>
              </span>
            </div>

            {result.gif_url ? (
              <img
                src={result.gif_url}
                alt=""
                className="mt-2 max-h-48 rounded-xl object-contain"
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
