import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ApiError,
  createSummary,
  listSummaries,
  resolveApiUrl,
  type SummaryItem,
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

function formatCreatedAt(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function SummaryCard({
  item,
  active,
  onSelect,
}: {
  item: SummaryItem
  active?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'w-full rounded-xl border px-4 py-3 text-left transition-colors',
        active
          ? 'border-accent bg-accent-soft/40'
          : 'border-border hover:bg-surface-muted/60',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-text">
          {item.start_date} → {item.end_date}
        </p>
        <p className="text-xs text-text-muted">
          {formatCreatedAt(item.created_at)}
        </p>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
        {item.reply}
      </p>
      <p className="mt-2 text-xs text-text-muted">
        Score{' '}
        <span className="font-medium text-text">{item.score.toFixed(1)}</span>
      </p>
    </button>
  )
}

function SummaryDetail({ item }: { item: SummaryItem }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-text">Summary</h2>
        <p className="text-xs text-text-muted">
          {item.start_date} → {item.end_date}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">
        {item.reply}
      </p>

      <p className="text-sm text-text-muted">
        Productivity score:{' '}
        <span className="font-medium text-text">{item.score.toFixed(1)}</span>
      </p>

      {item.gif_url ? (
        <img
          src={resolveApiUrl(item.gif_url)}
          alt=""
          className="mt-2 max-h-48 rounded-xl object-contain"
        />
      ) : null}
    </div>
  )
}

export function SummaryPage() {
  const { error: showError, success: showSuccess } = useToast()
  const { session, isLoggedIn } = useDashboard()
  const token = session?.accessToken

  const [startDate, setStartDate] = useState(todayIsoDate)
  const [endDate, setEndDate] = useState(todayIsoDate)
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(Boolean(token))
  const [summaries, setSummaries] = useState<SummaryItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const derived = useMemo(() => {
    if (!startDate) return null
    return parseYearMonth(startDate)
  }, [startDate])

  const selected = useMemo(
    () => summaries.find((item) => item.summary_id === selectedId) ?? null,
    [summaries, selectedId],
  )

  useEffect(() => {
    if (!token) return
    const accessToken = token

    let cancelled = false

    async function loadHistory() {
      try {
        const data = await listSummaries(accessToken, {
          page: 1,
          limit: 20,
        })
        if (cancelled) return
        setSummaries(data.summaries)
        setSelectedId((prev) => {
          if (prev && data.summaries.some((item) => item.summary_id === prev)) {
            return prev
          }
          return data.summaries[0]?.summary_id ?? null
        })
      } catch (err) {
        if (!cancelled) {
          showError(errorMessage(err), 'Could not load summaries')
        }
      } finally {
        if (!cancelled) setHistoryLoading(false)
      }
    }

    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [token, showError])

  if (!isLoggedIn || !session) {
    return <Navigate to="/" replace state={{ from: '/summary' }} />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!session?.accessToken) return

    if (!startDate || !endDate) {
      showError('Please choose both From and To dates.')
      return
    }
    if (startDate > endDate) {
      showError('From date must be on or before To date.')
      return
    }

    const { month, year } = parseYearMonth(startDate)
    setLoading(true)

    try {
      const summary = await createSummary(session.accessToken, {
        type: 'date_range',
        start_date: startDate,
        end_date: endDate,
        month,
        year,
      })

      const asItem: SummaryItem = {
        summary_id: summary.summary_id,
        type: summary.type,
        start_date: summary.start_date,
        end_date: summary.end_date,
        month,
        year,
        reply: summary.reply,
        score: summary.score,
        gif_url: summary.gif_url,
        created_at: new Date().toISOString(),
      }

      setSummaries((prev) => [
        asItem,
        ...prev.filter((item) => item.summary_id !== asItem.summary_id),
      ])
      setSelectedId(asItem.summary_id)
      showSuccess('Your summary is ready.', 'Summary created')
    } catch (err) {
      showError(errorMessage(err), 'Could not create summary')
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
          Pick a date range to generate a summary, or browse ones you already
          created.
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
              Using month{' '}
              <span className="font-medium text-text">{derived.month}</span>
              {' · '}
              year <span className="font-medium text-text">{derived.year}</span>{' '}
              from the From date.
            </p>
          ) : null}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Generating…' : 'Generate summary'}
          </Button>
        </form>

        {selected ? (
          <div className="mt-10 space-y-4 border-t border-border pt-8">
            <SummaryDetail item={selected} />
          </div>
        ) : null}

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-base font-semibold text-text">Summary history</h2>
          <p className="mt-1 text-sm text-text-muted">
            Past summaries from your chats.
          </p>

          {historyLoading ? (
            <p className="mt-4 text-sm text-text-muted">Loading history…</p>
          ) : summaries.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">
              No summaries yet. Generate one above to get started.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {summaries.map((item) => (
                <SummaryCard
                  key={item.summary_id}
                  item={item}
                  active={item.summary_id === selectedId}
                  onSelect={() => setSelectedId(item.summary_id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
