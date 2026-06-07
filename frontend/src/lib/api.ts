export type CalendarListItem = {
  id: string
  name: string
  color: string
  isVisibleDefault: boolean
}

/** API shape for a calendar task (backend model/route name: Event / /events). */
export type EventApi = {
  id: string
  calendarId: string
  title: string
  description: string | null
  startAt: string
  endAt: string
  allDay: boolean
  calendar: Pick<CalendarListItem, 'id' | 'name' | 'color'>
}

export type UserMe = {
  id: string
  email: string
  name: string
}

const TOKEN_KEY = 'calendar_token'

function getBase(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function headers(): HeadersInit {
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const t = getToken()
  if (t) base.Authorization = `Bearer ${t}`
  return base
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (body?.error && typeof body.error === 'string') return body.error
    return res.statusText
  } catch {
    return res.statusText
  }
}

export async function registerApi(data: {
  email: string
  password: string
  name: string
}): Promise<{ token: string; user: UserMe }> {
  const res = await fetch(`${getBase()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function loginApi(
  email: string,
  password: string,
): Promise<{ token: string; user: UserMe }> {
  const res = await fetch(`${getBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchCalendars(): Promise<CalendarListItem[]> {
  const res = await fetch(`${getBase()}/calendars`, { headers: headers() })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchEvents(
  from: Date,
  to: Date,
  calendarIds?: string[],
): Promise<EventApi[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  })
  if (calendarIds?.length) params.set('calendarIds', calendarIds.join(','))
  const res = await fetch(`${getBase()}/events?${params}`, { headers: headers() })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function createEventApi(payload: {
  calendarId: string
  title: string
  description?: string | null
  startAt: string
  endAt: string
  allDay?: boolean
}): Promise<EventApi> {
  const res = await fetch(`${getBase()}/events`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}
