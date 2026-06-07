const KEY_PREFIX = 'calendar_visible_'

export function readCalendarVisibility(userId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + userId)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as Record<string, boolean>
  } catch {
    return {}
  }
}

export function writeCalendarVisibility(
  userId: string,
  visibleById: Record<string, boolean>,
): void {
  localStorage.setItem(KEY_PREFIX + userId, JSON.stringify(visibleById))
}
