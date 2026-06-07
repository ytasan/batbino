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
import { useMemo, useRef, useState } from 'react'

import type { EventApi } from '@/lib/api'
import { cn } from '@/lib/utils'

const TASK_DRAG_TYPE = 'application/x-batbino-task-id'

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
  onMoveTask: (taskId: string, targetDay: Date) => void
  /** Tasks to render in day cells (prop name matches API: events). */
  events: EventApi[]
  visibleCalendarIds: Set<string>
}

export function MonthGrid({
  month,
  today,
  selectedDate,
  onSelectDay,
  onMoveTask,
  events,
  visibleCalendarIds,
}: MonthGridProps) {
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)
  const dragActiveRef = useRef(false)

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

  function endDrag() {
    window.setTimeout(() => {
      dragActiveRef.current = false
    }, 0)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#131314]">
      <div className="grid shrink-0 grid-cols-[40px_repeat(7,minmax(0,1fr))] border-b border-[#3c4043] text-center text-[11px] font-medium text-[#bdc1c6]">
        <div />
        {weekdays.map((d) => (
          <div key={d} className="border-l border-[#3c4043] py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {weeks.map((weekDays) => {
          const isoWeek = getISOWeek(weekDays[0])
          return (
            <div
              key={weekDays[0].toISOString()}
              className="grid grid-cols-[40px_repeat(7,minmax(0,1fr))]"
            >
              <div className="flex items-start justify-center border-b border-[#3c4043] py-4 text-[11px] text-[#80868b]">
                <span>W{isoWeek}</span>
              </div>
              {weekDays.map((d) => {
                const dayKey = format(d, 'yyyy-MM-dd')
                const dayEvts = eventsByDay.get(dayKey) ?? []
                const inMonth = isSameMonth(d, month)
                const sel = isSameDay(d, selectedDate)
                const isTodayCell = isSameDay(d, today)
                const isDropTarget = dropTargetKey === dayKey
                const topShow = dayEvts.slice(0, 3)
                return (
                  <div
                    key={d.toISOString()}
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
                      'relative min-h-[104px] cursor-pointer border-b border-l border-[#3c4043] p-1 text-left align-top transition-colors hover:bg-[#1f1f1f]',
                      sel && 'ring-2 ring-[#8ab4f8] ring-offset-[-2px]',
                      isDropTarget && 'bg-[#292a2d] ring-2 ring-[#8ab4f8] ring-offset-[-2px]',
                    )}
                  >
                    <div className="mb-2 flex justify-end px-1">
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
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-grab truncate rounded-sm px-1 py-0.5 text-left text-[12px] leading-tight text-[#e3e3e3] active:cursor-grabbing"
                          style={{
                            backgroundColor: `${ev.calendar.color}33`,
                            borderLeft: `3px solid ${ev.calendar.color}`,
                          }}
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvts.length > 3 ? (
                        <span className="px-1 text-[11px] text-[#8ab4f8]">
                          +{dayEvts.length - 3} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
