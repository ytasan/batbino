import { format } from 'date-fns'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Search,
  Settings,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

type TopBarProps = {
  month: Date
  today: Date
  onToday: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function TopBar({ month, today, onToday, onPrevMonth, onNextMonth }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#3c4043] px-3 pl-4">
      <div className="flex min-w-0 items-center gap-1">
        <div className="mr-4 flex items-center gap-2 text-[22px] font-normal tracking-tight text-[#e3e3e3]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl">
            <span className="text-[#8ab4f8]">■</span>
          </span>
          <span>Batbino</span>
        </div>
        <Button variant="default" size="sm" className="font-medium" onClick={onToday}>
          Today
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="iconSm" className="text-[#bdc1c6]" onClick={onPrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="iconSm" className="text-[#bdc1c6]" onClick={onNextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="shrink-0 text-[54px] font-medium leading-none tracking-wide text-[#e3e3e3]">
          {format(today, 'd')}
        </div>
        <h1 className="truncate pl-2 text-[22px] font-normal capitalize text-[#e3e3e3]">
          {format(month, 'LLLL yyyy')}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-1 pr-2">
        <Button variant="ghost" size="icon" className="text-[#bdc1c6]" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#bdc1c6]" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#bdc1c6]" aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
        <Button
          variant="default"
          size="sm"
          className="ml-3 gap-1 border border-transparent font-medium capitalize"
          disabled
        >
          Month
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
