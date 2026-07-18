export type AuthUser = {
  username: string
  email: string
  password: string
}

export type AuthSession = {
  username: string
  email: string
}

export type AuthMode = 'login' | 'signup'
export type AuthStep = 'credentials' | 'otp'
