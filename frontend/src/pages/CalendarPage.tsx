import {
  endOfMonth,
  endOfWeek,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth as startOfMo,
  startOfWeek,
} from 'date-fns'
import { CheckSquare, MapPin, NotebookPen, Plus, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { CreateEventDialog } from '@/components/CreateEventDialog'
import { TaskDetailDialog } from '@/components/TaskDetailDialog'
import { MonthGrid } from '@/components/MonthGrid'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import {
  fetchCalendars,
  fetchEvents,
  updateEventApi,
  type CalendarListItem,
  type EventApi,
} from '@/lib/api'
import {
  readCalendarVisibility,
  writeCalendarVisibility,
} from '@/lib/calendarVisibility'
import { useAuth } from '@/context/AuthContext'

export function CalendarPage() {
  const { token, logout, user } = useAuth()
  const today = new Date()
  const [month, setMonth] = useState(() => startOfMo(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [calendars, setCalendars] = useState<CalendarListItem[]>([])
  const [visibleById, setVisibleById] = useState<Record<string, boolean>>({})
  // Tasks loaded from /events (EventApi).
  const [events, setEvents] = useState<EventApi[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<EventApi | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const visibleCalendarIds = useMemo(() => {
    const ids = new Set<string>()
    for (const c of calendars) {
      const v = visibleById[c.id] ?? c.isVisibleDefault
      if (v) ids.add(c.id)
    }
    return ids
  }, [calendars, visibleById])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const refreshLists = useCallback(async () => {
    if (!token) return
    setLoadErr(null)
    try {
      const calList = await fetchCalendars()
      setCalendars(calList)
      setVisibleById((prev) => {
        const stored = user?.id ? readCalendarVisibility(user.id) : {}
        const next = { ...prev }
        for (const c of calList) {
          if (next[c.id] === undefined) next[c.id] = stored[c.id] ?? c.isVisibleDefault
        }
        return next
      })
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load calendars')
    }
  }, [token, user?.id])

  const reloadEvents = useCallback(async () => {
    if (!token) return
    const moStart = startOfMo(month)
    const moEnd = endOfMonth(month)
    const gridStart = startOfWeek(moStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(moEnd, { weekStartsOn: 1 })
    const from = startOfDay(gridStart)
    const toExclusive = new Date(startOfDay(gridEnd).getTime() + 86400000)

    try {
      const activeIds = Array.from(visibleCalendarIds)
      const list = await fetchEvents(
        from,
        toExclusive,
        activeIds.length ? activeIds : undefined,
        debouncedSearch || undefined,
      )
      setEvents(list)
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load events')
    }
  }, [token, month, calendars, visibleCalendarIds, debouncedSearch])

  useEffect(() => {
    void refreshLists()
  }, [refreshLists])

  useEffect(() => {
    void reloadEvents()
  }, [reloadEvents])

  if (!token) return <Navigate to="/login" replace />

  function onToday() {
    const n = new Date()
    setMonth(startOfMo(n))
    setSelectedDate(n)
  }

  function onPrevMonth() {
    const d = startOfMo(month)
    d.setMonth(d.getMonth() - 1)
    setMonth(startOfMo(d))
  }

  function onNextMonth() {
    const d = startOfMo(month)
    d.setMonth(d.getMonth() + 1)
    setMonth(startOfMo(d))
  }

  function onNavigateSidebarMonth(delta: number) {
    const d = startOfMo(month)
    d.setMonth(d.getMonth() + delta)
    setMonth(startOfMo(d))
  }

  function onToggleCalendar(id: string, next: boolean) {
    setVisibleById((prev) => {
      const updated = { ...prev, [id]: next }
      if (user?.id) writeCalendarVisibility(user.id, updated)
      return updated
    })
  }

  function onSelectDay(d: Date) {
    setSelectedDate(d)
    setCreateOpen(true)
  }

  async function onMoveTask(taskId: string, targetDay: Date) {
    const task = events.find((e) => e.id === taskId)
    if (!task) return

    const start = parseISO(task.startAt)
    const end = parseISO(task.endAt)
    if (isSameDay(start, targetDay)) return

    const durationMs = end.getTime() - start.getTime()
    const newStart = new Date(targetDay)
    newStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0)
    const newEnd = new Date(newStart.getTime() + durationMs)

    setLoadErr(null)
    try {
      await updateEventApi(taskId, {
        startAt: newStart.toISOString(),
        endAt: newEnd.toISOString(),
      })
      void reloadEvents()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to move task')
    }
  }

  const calendarOptionsForModal = calendars.filter(
    (c) => visibleById[c.id] ?? c.isVisibleDefault,
  ).length
    ? calendars.filter((c) => visibleById[c.id] ?? c.isVisibleDefault)
    : calendars

  function onSelectSearchResult(task: EventApi) {
    const taskDay = parseISO(task.startAt)
    setSelectedDate(taskDay)
    setMonth(startOfMo(taskDay))
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#131314] text-[#e3e3e3]">
      <TopBar
        month={month}
        today={today}
        onToday={onToday}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onSignOut={() => logout()}
      />
      {loadErr ? (
        <div className="border-b border-[#3c4043] bg-[#2d2e31] px-4 py-3 text-[14px] text-[#f28b82]">
          {loadErr}
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <Sidebar
          monthDate={month}
          selectedDate={selectedDate}
          today={today}
          onNavigateSidebarMonth={onNavigateSidebarMonth}
          onSelectMiniDay={(d) => {
            setSelectedDate(d)
            setMonth(startOfMo(d))
          }}
          calendars={calendars}
          visibleById={visibleById}
          onToggleCalendar={onToggleCalendar}
          onCreateClick={() => setCreateOpen(true)}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchResults={debouncedSearch ? events : []}
          onSelectSearchResult={onSelectSearchResult}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#131314] pr-14">
          <div className="flex min-h-0 flex-1 flex-col pl-14 pr-[52px]">
            <MonthGrid
              month={month}
              today={today}
              selectedDate={selectedDate}
              onSelectDay={onSelectDay}
              onSelectTask={(task) => {
                setSelectedTask(task)
                setTaskDetailOpen(true)
              }}
              onMoveTask={(taskId, targetDay) => void onMoveTask(taskId, targetDay)}
              events={events}
              visibleCalendarIds={visibleCalendarIds}
            />
          </div>
          <aside className="absolute right-6 top-[120px] flex w-[56px] flex-col items-center gap-10 px-3 text-[#bdc1c6]">
            <NavIcon ariaLabel="Notebook">
              <NotebookPen className="h-[28px] w-[28px]" strokeWidth={1.5} />
            </NavIcon>
            <NavIcon ariaLabel="Tasks">
              <CheckSquare className="h-[28px] w-[28px]" strokeWidth={1.5} />
            </NavIcon>
            <NavIcon ariaLabel="Contacts">
              <UserRound className="h-[28px] w-[28px]" strokeWidth={1.5} />
            </NavIcon>
            <NavIcon ariaLabel="Maps">
              <MapPin className="h-[28px] w-[28px]" strokeWidth={1.5} />
            </NavIcon>
            <button
              type="button"
              className="mt-3 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-[#5f6368] text-[#bdc1c6] transition-colors hover:border-[#8ab4f8] hover:text-[#8ab4f8]"
              aria-label="Add shortcut"
            >
              <Plus className="h-8 w-8" strokeWidth={1.5} />
            </button>
          </aside>
        </div>
      </div>

      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        calendars={calendarOptionsForModal}
        defaultDay={selectedDate}
        onCreated={() => {
          void refreshLists()
          void reloadEvents()
        }}
      />

      <TaskDetailDialog
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        task={selectedTask}
        calendars={calendarOptionsForModal}
        onUpdated={() => void reloadEvents()}
      />
    </div>
  )
}

function NavIcon({ children, ariaLabel }: { children: ReactNode; ariaLabel: string }) {
  return (
    <button
      type="button"
      className="flex h-12 w-12 items-center justify-center rounded-[10px] text-[#bdc1c6] hover:bg-[#292a2d]"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
