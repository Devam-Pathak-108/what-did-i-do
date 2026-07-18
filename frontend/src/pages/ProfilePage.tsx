import { Navigate } from 'react-router-dom'
import { ProfilePanel } from '../components/profile/ProfilePanel'
import { useDashboard } from '../context/useDashboard'

export function ProfilePage() {
  const { session, isLoggedIn, handleProfileLoaded } = useDashboard()

  if (!isLoggedIn || !session) {
    return <Navigate to="/" replace state={{ from: '/profile' }} />
  }

  return (
    <ProfilePanel
      token={session.accessToken}
      onProfileLoaded={handleProfileLoaded}
    />
  )
}
