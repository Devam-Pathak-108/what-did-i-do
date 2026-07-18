const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let detail = response.statusText || 'Request failed'
  try {
    const data = (await response.json()) as { detail?: unknown }
    if (typeof data.detail === 'string') {
      detail = data.detail
    } else if (Array.isArray(data.detail)) {
      detail = data.detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg)
          }
          return JSON.stringify(item)
        })
        .join(', ')
    }
  } catch {
    // keep statusText
  }
  return new ApiError(response.status, detail)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type RegisterResponse = {
  message: string
  user_id: string
  email: string
  is_verified: boolean
}

export type TokenResponse = {
  access_token: string
  token_type: string
  user_id: string
  username: string
  email: string
  is_verified: boolean
}

export type MessageResponse = {
  message: string
}

export type ProfileResponse = {
  user_id: string
  username: string
  email: string
  is_verified: boolean
  tell_me_about_your_life: string
}

export function register(payload: {
  username: string
  email: string
  password: string
}) {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function sendOtp(userId: string) {
  return request<MessageResponse>('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  })
}

export function verifyOtp(userId: string, otp: string) {
  return request<MessageResponse>('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, otp }),
  })
}

export function login(payload: { identifier: string; password: string }) {
  return request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getProfile(token: string) {
  return request<ProfileResponse>('/api/profile', { method: 'GET' }, token)
}

export function updateProfile(token: string, tellMeAboutYourLife: string) {
  return request<ProfileResponse>(
    '/api/profile',
    {
      method: 'PUT',
      body: JSON.stringify({ tell_me_about_your_life: tellMeAboutYourLife }),
    },
    token,
  )
}
