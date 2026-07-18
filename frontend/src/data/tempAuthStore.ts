import type { AuthUser } from '../types/auth'

const STORAGE_KEY = 'wdid_temp_users'

function readUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AuthUser[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: AuthUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): AuthUser | undefined {
  const normalized = email.trim().toLowerCase()
  return readUsers().find((user) => user.email.toLowerCase() === normalized)
}

export function registerUser(user: AuthUser): { ok: true } | { ok: false; error: string } {
  const email = user.email.trim().toLowerCase()
  const username = user.username.trim()
  const password = user.password

  if (!username || !email || !password) {
    return { ok: false, error: 'Please fill in all fields.' }
  }

  if (findUserByEmail(email)) {
    return { ok: false, error: 'An account with this email already exists.' }
  }

  const users = readUsers()
  users.push({ username, email, password })
  writeUsers(users)
  return { ok: true }
}

export function verifyCredentials(
  email: string,
  password: string,
): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const user = findUserByEmail(email)
  if (!user) {
    return { ok: false, error: 'No account found for this email.' }
  }
  if (user.password !== password) {
    return { ok: false, error: 'Incorrect password.' }
  }
  return { ok: true, user }
}

/** Temporary OTP — always 123456 until email delivery is wired. */
export const TEMP_OTP = '123456'

export function verifyOtp(code: string): boolean {
  return code.trim() === TEMP_OTP
}
