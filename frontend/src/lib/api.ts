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

export type ChatSessionResponse = {
  session_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ChatMessageItem = {
  message_id: string
  type: 'asked' | 'reply' | string
  message: string
  datetime: string
  session_id: string
  intent?: number | null
}

export type ChatSendResponse = {
  session_id: string
  messages: ChatMessageItem[]
}

export type ChatHistoryResponse = {
  session_id: string
  page: number
  limit: number
  total: number
  messages: ChatMessageItem[]
}

/** POST /api/chat/sessions — create a new chat session */
export function createChatSession(token: string) {
  return request<ChatSessionResponse>(
    '/api/chat/sessions',
    { method: 'POST' },
    token,
  )
}

/** POST /api/chat — send a message in a session */
export function sendChatMessage(
  token: string,
  payload: { raw_data: string; session_id: string },
) {
  return request<ChatSendResponse>(
    '/api/chat',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  )
}

/** GET /api/chat/messages — paginated history for a session */
export function getChatMessages(
  token: string,
  params: {
    session_id: string
    page?: number
    limit?: number
  },
) {
  const search = new URLSearchParams()
  search.set('session_id', params.session_id)
  if (params.page != null) search.set('page', String(params.page))
  if (params.limit != null) search.set('limit', String(params.limit))

  return request<ChatHistoryResponse>(
    `/api/chat/messages?${search.toString()}`,
    { method: 'GET' },
    token,
  )
}

export type SummaryType = 'date_range' | 'month'

export type SummaryCreatePayload =
  | {
      type: 'date_range'
      start_date: string
      end_date: string
      month?: number
      year?: number
    }
  | {
      type: 'month'
      month: number
      year: number
      start_date?: string
      end_date?: string
    }

export type SummaryCreateResponse = {
  summary_id: string
  type: SummaryType
  start_date: string
  end_date: string
  reply: string
  score: number
  gif_url: string
}

export type SummaryItem = {
  summary_id: string
  type: SummaryType
  start_date: string
  end_date: string
  month: number | null
  year: number | null
  reply: string
  score: number
  gif_url: string
  created_at: string
}

export type SummaryListResponse = {
  page: number
  limit: number
  total: number
  summaries: SummaryItem[]
}

/** POST /api/summary — create a date-range or month summary */
export function createSummary(token: string, payload: SummaryCreatePayload) {
  return request<SummaryCreateResponse>(
    '/api/summary',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token,
  )
}

/** GET /api/summary — list saved summaries (paginated) */
export function listSummaries(
  token: string,
  params?: { page?: number; limit?: number },
) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set('page', String(params.page))
  if (params?.limit != null) search.set('limit', String(params.limit))
  const qs = search.toString()

  return request<SummaryListResponse>(
    `/api/summary${qs ? `?${qs}` : ''}`,
    { method: 'GET' },
    token,
  )
}
