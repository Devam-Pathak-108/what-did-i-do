import { Avatar } from '../ui/Avatar'

type UserProfileProps = {
  name: string
  subtitle?: string
  avatarSrc?: string
}

export function UserProfile({
  name,
  subtitle = 'Personal memory',
  avatarSrc,
}: UserProfileProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={avatarSrc} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text">{name}</p>
        <p className="truncate text-xs text-text-muted">{subtitle}</p>
      </div>
    </div>
  )
}
