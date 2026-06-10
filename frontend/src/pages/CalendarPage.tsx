import {
  endOfMonth,
  endOfWeek,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth as startOfMo,
  startOfWeek,
} from 'date-fns'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { CreateEventDialog } from '@/components/CreateEventDialog'
import { TaskDetailDialog } from '@/components/TaskDetailDialog'
import { MonthGrid } from '@/components/MonthGrid'
import {
  MonthSlideTransition,
  type MonthSlideDirection,
} from '@/components/MonthSlideTransition'
import { RightSidebar } from '@/components/RightSidebar'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { usePersistedBoolean } from '@/lib/usePersistedBoolean'
import { cn, isTypingTarget } from '@/lib/utils'
import {
  deleteEventApi,
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
import { exportTasksToJson, importTasksFromJsonFile } from '@/lib/taskExportImport'

export function CalendarPage() {
  const { token, logout, user } = useAuth()
  const today = new Date()
  const [month, setMonth] = useState(() => startOfMo(new Date()))
  const [slideDirection, setSlideDirection] = useState<MonthSlideDirection | null>(null)
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
  const importInputRef = useRef<HTMLInputElement>(null)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = usePersistedBoolean(
    'batbino.rightSidebar.collapsed',
    false,
  )

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

  const onPrevMonth = useCallback(() => {
    setSlideDirection('right')
    setMonth((prev) => {
      const d = startOfMo(prev)
      d.setMonth(d.getMonth() - 1)
      return startOfMo(d)
    })
  }, [])

  const onNextMonth = useCallback(() => {
    setSlideDirection('left')
    setMonth((prev) => {
      const d = startOfMo(prev)
      d.setMonth(d.getMonth() + 1)
      return startOfMo(d)
    })
  }, [])

  useEffect(() => {
    if (!token) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (createOpen || taskDetailOpen) return
      if (isTypingTarget(e.target)) return

      e.preventDefault()
      if (e.key === 'ArrowLeft') onPrevMonth()
      else onNextMonth()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [token, createOpen, taskDetailOpen, onPrevMonth, onNextMonth])

  if (!token) return <Navigate to="/login" replace />

  function onToday() {
    const n = new Date()
    setMonth(startOfMo(n))
    setSelectedDate(n)
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

  async function onDeleteTask(task: EventApi) {
    setLoadErr(null)
    try {
      await deleteEventApi(task.id)
      void reloadEvents()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  async function onMarkDone(task: EventApi) {
    setLoadErr(null)
    try {
      await updateEventApi(task.id, { done: !task.done })
      void reloadEvents()
    } catch (e) {
      setLoadErr(
        e instanceof Error
          ? e.message
          : task.done
            ? 'Failed to mark task as undone'
            : 'Failed to mark task as done',
      )
    }
  }

  async function onMoveTask(taskId: string, targetDay: Date) {
    const task = events.find((e) => e.id === taskId)
    if (!task) return

    const start = parseISO(task.startAt)
    const end = parseISO(task.endAt)
    const target = startOfDay(targetDay)
    if (isSameDay(startOfDay(start), target)) return

    const durationMs = end.getTime() - start.getTime()
    const newStart = new Date(target)
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
      const message = e instanceof Error ? e.message : 'Failed to move task'
      setLoadErr(message)
      throw new Error(message)
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

  async function onExportTasks() {
    setLoadErr(null)
    try {
      await exportTasksToJson()
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to export tasks')
    }
  }

  function onImportTasks() {
    importInputRef.current?.click()
  }

  async function onImportFileSelected(file: File | undefined) {
    if (!file) return
    setLoadErr(null)
    try {
      const count = await importTasksFromJsonFile(file)
      await refreshLists()
      await reloadEvents()
      window.alert(`Imported ${count} task${count === 1 ? '' : 's'}.`)
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to import tasks')
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#131314] text-[#e3e3e3]">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => void onImportFileSelected(e.target.files?.[0])}
      />
      <TopBar
        month={month}
        today={today}
        onToday={onToday}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onSignOut={() => logout()}
        onExportTasks={() => void onExportTasks()}
        onImportTasks={onImportTasks}
        onCreateClick={() => setCreateOpen(true)}
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
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchResults={debouncedSearch ? events : []}
          onSelectSearchResult={onSelectSearchResult}
        />

        <div
          className={cn(
            'relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#131314]',
            rightSidebarCollapsed ? 'pr-0' : 'pr-14',
          )}
        >
          <div
            className={cn(
              'flex min-h-0 flex-1 flex-col overflow-hidden pl-14',
              rightSidebarCollapsed ? 'pr-4' : 'pr-[52px]',
            )}
          >
            <MonthSlideTransition
              month={month}
              direction={slideDirection}
              onTransitionComplete={() => setSlideDirection(null)}
            >
              {(displayMonth) => (
                <MonthGrid
                  month={displayMonth}
                  today={today}
                  selectedDate={selectedDate}
                  onSelectDay={onSelectDay}
                  onSelectTask={(task) => {
                    setSelectedTask(task)
                    setTaskDetailOpen(true)
                  }}
                  onMoveTask={(taskId, targetDay) => void onMoveTask(taskId, targetDay)}
                  onMarkDone={(task) => void onMarkDone(task)}
                  onDeleteTask={(task) => void onDeleteTask(task)}
                  events={events}
                  visibleCalendarIds={visibleCalendarIds}
                />
              )}
            </MonthSlideTransition>
          </div>
          <RightSidebar
            collapsed={rightSidebarCollapsed}
            onCollapsedChange={setRightSidebarCollapsed}
          />
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
        onMoveTask={onMoveTask}
      />
    </div>
  )
}
