import {
  createCalendarApi,
  createEventApi,
  fetchCalendars,
  fetchEvents,
  type CalendarListItem,
} from '@/lib/api'

export type TaskExportItem = {
  title: string
  description: string | null
  startAt: string
  endAt: string
  allDay: boolean
  calendarName: string
  calendarColor: string
}

export type TaskExportFile = {
  version: 1
  exportedAt: string
  tasks: TaskExportItem[]
}

const EXPORT_FROM = new Date('1970-01-01T00:00:00.000Z')
const EXPORT_TO = new Date('2100-01-01T00:00:00.000Z')

export async function exportTasksToJson(): Promise<void> {
  const tasks = await fetchEvents(EXPORT_FROM, EXPORT_TO)
  const payload: TaskExportFile = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: tasks.map((task) => ({
      title: task.title,
      description: task.description,
      startAt: task.startAt,
      endAt: task.endAt,
      allDay: task.allDay,
      calendarName: task.calendar.name,
      calendarColor: task.calendar.color,
    })),
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  anchor.href = url
  anchor.download = `batbino-tasks-${stamp}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

type ImportableTask = {
  title: string
  description?: string | null
  startAt: string
  endAt: string
  allDay?: boolean
  calendarName?: string
  calendarColor?: string
  calendarId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseImportTasks(raw: unknown): ImportableTask[] {
  if (Array.isArray(raw)) return raw.filter(isImportableTask)
  if (!isRecord(raw)) throw new Error('Invalid JSON format')

  if (Array.isArray(raw.tasks)) return raw.tasks.filter(isImportableTask)
  throw new Error('JSON must contain a tasks array')
}

function isImportableTask(value: unknown): value is ImportableTask {
  if (!isRecord(value)) return false
  return (
    typeof value.title === 'string' &&
    typeof value.startAt === 'string' &&
    typeof value.endAt === 'string'
  )
}

async function resolveCalendarId(
  task: ImportableTask,
  calendars: CalendarListItem[],
): Promise<string> {
  if (task.calendarId) {
    const byId = calendars.find((c) => c.id === task.calendarId)
    if (byId) return byId.id
  }

  const name = task.calendarName?.trim() || 'Imported'
  const existing = calendars.find((c) => c.name.toLowerCase() === name.toLowerCase())
  if (existing) return existing.id

  const created = await createCalendarApi({
    name,
    color: task.calendarColor?.trim() || '#8ab4f8',
  })
  calendars.push(created)
  return created.id
}

export async function importTasksFromJsonFile(file: File): Promise<number> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('File is not valid JSON')
  }

  const items = parseImportTasks(parsed)
  if (!items.length) throw new Error('No tasks found in file')

  const calendars = await fetchCalendars()
  let imported = 0

  for (const item of items) {
    const title = item.title.trim()
    if (!title) continue

    const startAt = new Date(item.startAt)
    const endAt = new Date(item.endAt)
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new Error(`Invalid dates for task "${title}"`)
    }

    const calendarId = await resolveCalendarId(item, calendars)
    await createEventApi({
      calendarId,
      title,
      description: item.description ?? null,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      allDay: Boolean(item.allDay),
    })
    imported += 1
  }

  return imported
}
