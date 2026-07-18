import type { AuthSession } from '../types/auth'

const SESSION_KEY = 'wdid_auth_session'

export function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (
      !parsed?.accessToken ||
      !parsed?.userId ||
      !parsed?.username ||
      !parsed?.email
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
