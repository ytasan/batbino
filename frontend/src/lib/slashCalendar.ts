import type { CalendarListItem } from '@/lib/api'

export type SlashCalendarState = {
  slashIndex: number
  query: string
}

/** Active slash command at cursor: `/query` with no spaces in query. */
export function getSlashCalendarState(title: string, cursor: number): SlashCalendarState | null {
  const before = title.slice(0, cursor)
  const slashIndex = before.lastIndexOf('/')
  if (slashIndex === -1) return null

  const query = before.slice(slashIndex + 1)
  if (query.includes(' ')) return null

  return { slashIndex, query }
}

function calendarMatchScore(name: string, query: string): number {
  const n = name.toLowerCase()
  const q = query.toLowerCase()
  if (!q) return 1
  if (n === q) return 100
  if (n.startsWith(q)) return 80
  if (n.includes(q)) return 50
  return -1
}

export function filterCalendarsBySlashQuery(
  calendars: CalendarListItem[],
  query: string,
): CalendarListItem[] {
  return calendars
    .map((cal) => ({ cal, score: calendarMatchScore(cal.name, query) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || a.cal.name.localeCompare(b.cal.name))
    .map((x) => x.cal)
}

export function findBestCalendarMatch(
  calendars: CalendarListItem[],
  query: string,
): CalendarListItem | null {
  const matches = filterCalendarsBySlashQuery(calendars, query)
  return matches[0] ?? null
}

export function applySlashCalendarSelection(
  title: string,
  slashIndex: number,
  cursor: number,
): { title: string; cursor: number } {
  const before = title.slice(0, slashIndex)
  const after = title.slice(cursor)
  const trimmedAfter = after.startsWith(' ') ? after.slice(1) : after
  return { title: before + trimmedAfter, cursor: before.length }
}

/** Parse leading `/calendar` from title on submit. */
export function extractCalendarFromTitle(
  title: string,
  calendars: CalendarListItem[],
): { title: string; calendar: CalendarListItem | null } {
  const trimmed = title.trim()
  const match = trimmed.match(/^\/([^\s/]+)(?:\s+(.*))?$/)
  if (!match) return { title: trimmed, calendar: null }

  const [, query, rest = ''] = match
  const calendar = findBestCalendarMatch(calendars, query)
  if (!calendar) return { title: trimmed, calendar: null }

  return { title: rest.trim(), calendar }
}
