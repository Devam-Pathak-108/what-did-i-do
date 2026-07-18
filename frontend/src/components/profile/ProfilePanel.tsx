import { useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  getProfile,
  updateProfile,
  type ProfileResponse,
} from '../../lib/api'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { useToast } from '../ui/toast-context'

type ProfilePanelProps = {
  token: string
  onProfileLoaded?: (profile: ProfileResponse) => void
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export function ProfilePanel({ token, onProfileLoaded }: ProfilePanelProps) {
  const toast = useToast()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [about, setAbout] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadFailed(false)
      setIsEditing(false)
      try {
        const data = await getProfile(token)
        if (cancelled) return
        setProfile(data)
        setAbout(data.tell_me_about_your_life ?? '')
        onProfileLoaded?.(data)
      } catch (err) {
        if (!cancelled) {
          setLoadFailed(true)
          toast.error(errorMessage(err), 'Could not load profile')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [token, onProfileLoaded, toast.error])

  function handleEdit() {
    setIsEditing(true)
  }

  function handleCancel() {
    setAbout(profile?.tell_me_about_your_life ?? '')
    setIsEditing(false)
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await updateProfile(token, about.trim())
      setProfile(updated)
      setAbout(updated.tell_me_about_your_life ?? '')
      setIsEditing(false)
      onProfileLoaded?.(updated)
      toast.success('Your profile details were updated.', 'Profile saved')
    } catch (err) {
      toast.error(errorMessage(err), 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const dirty =
    profile !== null && about.trim() !== (profile.tell_me_about_your_life ?? '').trim()

  const aboutDisplay = about.trim()
    ? about
    : 'No description yet. Click Edit to tell us about your life.'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-6 py-6">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Account
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">My Profile</h1>
        <p className="mt-1 text-sm text-text-muted">
          View your details and tell us a bit about your life.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-text-muted">Loading profile…</p>
        ) : loadFailed && !profile ? (
          <p className="mt-8 text-sm text-text-muted">
            Unable to load your profile right now. Try again in a moment.
          </p>
        ) : profile ? (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={profile.username} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-text">
                  {profile.username}
                </p>
                <p className="truncate text-sm text-text-muted">{profile.email}</p>
              </div>
            </div>

            <dl className="grid gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-text-muted">Username</dt>
                <dd className="text-text">{profile.username}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-text-muted">Email</dt>
                <dd className="text-text">{profile.email}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs font-medium text-text-muted">Status</dt>
                <dd className="text-text">
                  {profile.is_verified ? 'Verified' : 'Not verified'}
                </dd>
              </div>
            </dl>

            <form className="space-y-3" onSubmit={handleSave}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-text">
                  Tell me about your life
                </span>
                {!isEditing ? (
                  <Button type="button" variant="outline" onClick={handleEdit}>
                    Edit
                  </Button>
                ) : null}
              </div>

              {isEditing ? (
                <textarea
                  rows={6}
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  disabled={saving}
                  autoFocus
                  placeholder="Share routines, goals, or anything that helps personalize your memory assistant…"
                  className="w-full resize-y rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-text placeholder:text-text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                />
              ) : (
                <p
                  className={[
                    'rounded-lg border border-border px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
                    about.trim() ? 'text-text' : 'text-text-muted',
                  ].join(' ')}
                >
                  {aboutDisplay}
                </p>
              )}

              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={saving || !dirty}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              ) : null}
            </form>
          </div>
        ) : null}
      </div>
    </div>
  )
}

