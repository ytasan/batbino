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
import { useMemo } from 'react'

import type { EventApi } from '@/lib/api'
import { cn } from '@/lib/utils'

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
  events: EventApi[]
  visibleCalendarIds: Set<string>
}

export function MonthGrid({
  month,
  today,
  selectedDate,
  onSelectDay,
  events,
  visibleCalendarIds,
}: MonthGridProps) {
  const { weeks, weekdays } = useMemo(() => {
    const moStart = startOfMonth(month)
    const moEnd = endOfMonth(month)
    const gridStart = startOfWeek(moStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(moEnd, { weekStartsOn: 1 })
    const flat = eachDayOfInterval({ start: gridStart, end: gridEnd })
    const wn = chunkDays(flat, 7)
    return {
      weeks: wn,
      weekdays: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
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
                const topShow = dayEvts.slice(0, 3)
                return (
                  <button
                    type="button"
                    key={d.toISOString()}
                    onClick={() => onSelectDay(d)}
                    className={cn(
                      'relative min-h-[104px] border-b border-l border-[#3c4043] p-1 text-left align-top transition-colors hover:bg-[#1f1f1f]',
                      sel && 'ring-2 ring-[#8ab4f8] ring-offset-[-2px]',
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
                          className="truncate rounded-sm px-1 py-0.5 text-left text-[12px] leading-tight text-[#e3e3e3]"
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
                          +{dayEvts.length - 3} daha
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
