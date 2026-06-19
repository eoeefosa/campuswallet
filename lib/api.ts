const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function storeUser(user: object) {
  localStorage.setItem('user', JSON.stringify(user))
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  let res: Response

  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch (networkErr) {
    console.error(`[API] Network error on ${path}:`, networkErr)
    throw new Error(
      `Cannot reach server at ${BASE}. Make sure the backend is running on port 8080.`
    )
  }

  if (!res.ok) {
    let message = `Server error (${res.status})`
    try {
      const body = await res.json()
      const detail = body.error ? ` — ${body.error}` : ''
      message = (body.message ?? message) + detail
    } catch {
      message = res.statusText || message
    }
    console.error(`[API] ${res.status} on ${path}:`, message)
    throw new Error(message)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
