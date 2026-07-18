export type AuthSession = {
  userId: string
  username: string
  email: string
  accessToken: string
}

export type AuthMode = 'login' | 'signup'
export type AuthStep = 'credentials' | 'otp'
