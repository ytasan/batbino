import { format } from 'date-fns'
import { useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Plus,
  Settings,
} from 'lucide-react'

import { HelpDialog } from '@/components/HelpDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TopBarProps = {
  month: Date
  today: Date
  onToday: () => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onSignOut: () => void
  onExportTasks: () => void
  onImportTasks: () => void
  onCreateClick: () => void
}

export function TopBar({
  month,
  today,
  onToday,
  onPrevMonth,
  onNextMonth,
  onSignOut,
  onExportTasks,
  onImportTasks,
  onCreateClick,
}: TopBarProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <>
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#3c4043] px-3 pl-4">
      <div className="flex min-w-0 items-center gap-1">
        <div className="mr-4 flex items-center gap-2 text-[22px] font-normal tracking-tight text-[#e3e3e3]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-2xl">
            <span className="text-[#8ab4f8]">■</span>
          </span>
          <span>batbino</span>
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
        <button
          type="button"
          onClick={onCreateClick}
          className="ml-4 flex h-11 shrink-0 items-center gap-2 rounded-[24px] border border-transparent bg-transparent pl-1 pr-4 text-[#8ab4f8] transition-colors hover:bg-[#292a2d]"
          aria-label="Create"
        >
          <span className="flex items-center rounded-full bg-gradient-to-br from-blue-400 via-orange-400 to-green-400 p-[2px]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#131314]">
              <Plus className="h-5 w-5 text-[#8ab4f8]" strokeWidth={2} />
            </span>
          </span>
          <span className="pb-0.5 text-[17px] font-medium">Create</span>
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-1 pr-2">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 text-[#bdc1c6]"
          type="button"
          onClick={onSignOut}
        >
          Sign out
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#bdc1c6]"
          aria-label="Help"
          onClick={() => setHelpOpen(true)}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-[#bdc1c6]" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onExportTasks}>Export tasks as JSON</DropdownMenuItem>
            <DropdownMenuItem onSelect={onImportTasks}>Import tasks from JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  )
}
