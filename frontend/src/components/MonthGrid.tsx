import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'

// yt note: DayTasksDialog = 1 gune sigmayan gorev listesinin yeni model win'de gosterimi 
import { DayTasksDialog } from '@/components/DayTasksDialog'
import { TaskContextMenu } from '@/components/TaskContextMenu'
import type { EventApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const TASK_DRAG_TYPE = 'application/x-batbino-task-id'
const TASK_GAP_PX = 2 // gap-0.5
const MIN_VISIBLE_TASKS = 1

function useMaxVisibleTasksPerDay(gridRef: RefObject<HTMLDivElement | null>, weekCount: number) {
  const taskMeasureRef = useRef<HTMLDivElement>(null)
  const moreMeasureRef = useRef<HTMLDivElement>(null)
  const [maxVisible, setMaxVisible] = useState(3)

  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const update = () => {
      const dayCell = grid.querySelector('[data-day-cell]') as HTMLElement | null
      const taskEl = taskMeasureRef.current
      const moreEl = moreMeasureRef.current
      if (!dayCell || !taskEl || !moreEl) return

      const header = dayCell.querySelector('[data-day-header]') as HTMLElement | null
      const taskH = taskEl.offsetHeight
      const moreH = moreEl.offsetHeight
      if (!taskH) return

      const styles = getComputedStyle(dayCell)
      const paddingY = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
      const headerH = header?.offsetHeight ?? 0
      const available = dayCell.clientHeight - headerH - paddingY
      const withMore = Math.floor((available - moreH) / (taskH + TASK_GAP_PX))

      setMaxVisible(Math.max(MIN_VISIBLE_TASKS, withMore))
    }

    const ro = new ResizeObserver(update)
    ro.observe(grid)
    update()
    return () => ro.disconnect()
  }, [gridRef, weekCount])

  return { maxVisible, taskMeasureRef, moreMeasureRef }
}

function chunkDays<T>(days: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < days.length; i += size) {
    out.push(days.slice(i, i + size))
  }
  return out
}

type MonthGridProps = {
  month: Date
  today: Date
  selectedDate: Date
  onSelectDay: (d: Date) => void
  onSelectTask: (task: EventApi) => void
  onMoveTask: (taskId: string, targetDay: Date) => void
  onMarkDone: (task: EventApi) => void
  onDeleteTask: (task: EventApi) => void
  /** Tasks to render in day cells (prop name matches API: events). */
  events: EventApi[]
  visibleCalendarIds: Set<string>
}

export function MonthGrid({
  month,
  today,
  selectedDate,
  onSelectDay,
  onSelectTask,
  onMoveTask,
  onMarkDone,
  onDeleteTask,
  events,
  visibleCalendarIds,
}: MonthGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)
  const [moreTasksDay, setMoreTasksDay] = useState<Date | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    task: EventApi
  } | null>(null)
  const dragActiveRef = useRef(false)
  const suppressTaskClickRef = useRef(false)

  const { weeks, weekdays } = useMemo(() => {
    const moStart = startOfMonth(month)
    const moEnd = endOfMonth(month)
    const gridStart = startOfWeek(moStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(moEnd, { weekStartsOn: 1 })
    const flat = eachDayOfInterval({ start: gridStart, end: gridEnd })
    const wn = chunkDays(flat, 7)
    return {
      weeks: wn,
      weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    }
  }, [month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventApi[]>()
    for (const ev of events) {
      if (!visibleCalendarIds.has(ev.calendarId)) continue
      const start = parseISO(ev.startAt)
      const key = format(start, 'yyyy-MM-dd')
      const list = map.get(key) ?? []
      list.push(ev)
      map.set(key, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime())
    }
    return map
  }, [events, visibleCalendarIds])

  const { maxVisible, taskMeasureRef, moreMeasureRef } = useMaxVisibleTasksPerDay(
    gridRef,
    weeks.length,
  )

  function endDrag() {
    window.setTimeout(() => {
      dragActiveRef.current = false
    }, 0)
  }

  return (
    <div
      ref={gridRef}
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#131314]"
    >
      <div className="pointer-events-none absolute opacity-0" aria-hidden>
        <div
          ref={taskMeasureRef}
          className="truncate rounded-sm px-1 py-0.5 text-[12px] leading-tight"
        >
          Measure
        </div>
        <div ref={moreMeasureRef} className="px-1 text-[11px]">
          +0 more
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-[#3c4043] text-center text-[11px] font-medium text-[#bdc1c6]">
        <div />
        {weekdays.map((d) => (
          <div key={d} className="border-l border-[#3c4043] py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {weeks.map((weekDays) => {
          const isoWeek = getISOWeek(weekDays[0])
          return (
            <div
              key={weekDays[0].toISOString()}
              data-week-row
              className="grid min-h-0 flex-1 grid-cols-[40px_repeat(7,minmax(0,1fr))]"
            >
              <div className="flex h-full items-start justify-center border-b border-[#3c4043] pt-4 text-[11px] text-[#80868b]">
                <span>W{isoWeek}</span>
              </div>
              {weekDays.map((d) => {
                const dayKey = format(d, 'yyyy-MM-dd')
                const dayEvts = eventsByDay.get(dayKey) ?? []
                const inMonth = isSameMonth(d, month)
                const sel = isSameDay(d, selectedDate)
                const isTodayCell = isSameDay(d, today)
                const isDropTarget = dropTargetKey === dayKey
                const topShow = dayEvts.slice(0, maxVisible)
                const hiddenCount = dayEvts.length - maxVisible
                return (
                  <div
                    key={d.toISOString()}
                    data-day-cell
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (dragActiveRef.current) return
                      onSelectDay(d)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelectDay(d)
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDropTargetKey(dayKey)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setDropTargetKey((prev) => (prev === dayKey ? null : prev))
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const taskId = e.dataTransfer.getData(TASK_DRAG_TYPE)
                      if (taskId) onMoveTask(taskId, d)
                      setDropTargetKey(null)
                      endDrag()
                    }}
                    className={cn(
                      'relative h-full min-h-0 cursor-pointer border-b border-l border-[#3c4043] p-1 text-left align-top transition-colors hover:bg-[#1f1f1f]',
                      sel && 'ring-2 ring-[#8ab4f8] ring-offset-[-2px]',
                      isDropTarget && 'bg-[#292a2d] ring-2 ring-[#8ab4f8] ring-offset-[-2px]',
                    )}
                  >
                    <div data-day-header className="mb-2 flex justify-end px-1">
                      <span
                        className={cn(
                          'flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-[13px] leading-none tabular-nums',
                          !inMonth && 'text-[#80868b]',
                          inMonth && 'text-[#e3e3e3]',
                          isTodayCell && 'bg-[#8ab4f8] font-medium text-[#202124]',
                        )}
                      >
                        {format(d, 'd')}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      {topShow.map((ev) => (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => {
                            dragActiveRef.current = true
                            e.dataTransfer.setData(TASK_DRAG_TYPE, ev.id)
                            e.dataTransfer.effectAllowed = 'move'
                            e.stopPropagation()
                          }}
                          onDragEnd={() => {
                            setDropTargetKey(null)
                            endDrag()
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (dragActiveRef.current) return
                            if (suppressTaskClickRef.current) {
                              suppressTaskClickRef.current = false
                              return
                            }
                            onSelectTask(ev)
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            suppressTaskClickRef.current = true
                            const rect = gridRef.current?.getBoundingClientRect()
                            if (!rect) return
                            setContextMenu({
                              x: e.clientX - rect.left,
                              y: e.clientY - rect.top,
                              task: ev,
                            })
                          }}
                          className={cn(
                            'cursor-pointer truncate rounded-sm px-1 py-0.5 text-left text-[12px] leading-tight text-black active:cursor-grabbing',
                            ev.done && 'line-through opacity-60',
                          )}
                          style={{
                            backgroundColor: ev.calendar.color,
                          }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {hiddenCount > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMoreTasksDay(d)
                          }}
                          className="cursor-pointer px-1 text-left text-[11px] text-[#8ab4f8] hover:underline"
                        >
                          +{hiddenCount} more
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <DayTasksDialog
        open={moreTasksDay !== null}
        onOpenChange={(open) => {
          if (!open) setMoreTasksDay(null)
        }}
        day={moreTasksDay}
        tasks={
          moreTasksDay
            ? (eventsByDay.get(format(moreTasksDay, 'yyyy-MM-dd')) ?? [])
            : []
        }
        onSelectTask={onSelectTask}
        onMoveTask={onMoveTask}
        onMarkDone={onMarkDone}
        onDeleteTask={onDeleteTask}
      />

      {contextMenu ? (
        <TaskContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          task={contextMenu.task}
          onMoveTask={onMoveTask}
          onMarkDone={onMarkDone}
          onEdit={onSelectTask}
          onDelete={onDeleteTask}
          onClose={() => setContextMenu(null)}
        />
      ) : null}
    </div>
  )
}
