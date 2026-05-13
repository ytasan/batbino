import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type MiniCalendarProps = {
  monthDate: Date
  selectedDate: Date
  today: Date
  onNavigateMonth: (delta: number) => void
  onSelectDay: (d: Date) => void
}

export function MiniCalendar({
  monthDate,
  selectedDate,
  today,
  onNavigateMonth,
  onSelectDay,
}: MiniCalendarProps) {
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)
  const gridStart = startOfWeek(start, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(end, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm leading-none tracking-wide text-[#e3e3e3]">
          <span>{format(monthDate, 'LLLL yyyy').replace('.', '')}</span>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="iconSm"
            className="text-[#bdc1c6]"
            aria-label="Previous month"
            onClick={() => onNavigateMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="iconSm"
            className="text-[#bdc1c6]"
            aria-label="Next month"
            onClick={() => onNavigateMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(7,1fr)] gap-y-3 text-[11px] font-medium uppercase text-[#bdc1c6]">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
          <div key={d} className="flex justify-center">
            {d}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1 text-center text-xs">
        {days.map((d) => {
          const inMonth = isSameMonth(d, monthDate)
          const isSel = isSameDay(d, selectedDate)
          const isToday = isSameDay(d, today)
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDay(d)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-[13px] leading-none',
                !inMonth && 'text-[#80868b]',
                inMonth && 'text-[#e3e3e3]',
                isToday && !isSel && 'text-[#8ab4f8]',
                isSel && 'bg-[#8ab4f8] font-medium text-[#202124]',
              )}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
