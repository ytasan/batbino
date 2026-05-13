import { Plus } from 'lucide-react'

import type { CalendarListItem } from '@/lib/api'
import { MiniCalendar } from '@/components/MiniCalendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

export function SeparatorThin() {
  return <div className="mx-4 my-6 h-px bg-[#3c4043]" />
}

type SidebarProps = {
  userName?: string | null
  monthDate: Date
  selectedDate: Date
  today: Date
  onNavigateSidebarMonth: (delta: number) => void
  onSelectMiniDay: (d: Date) => void
  calendars: CalendarListItem[]
  visibleById: Record<string, boolean>
  onToggleCalendar: (id: string, next: boolean) => void
  onCreateClick: () => void
}

export function Sidebar({
  userName,
  monthDate,
  selectedDate,
  today,
  onNavigateSidebarMonth,
  onSelectMiniDay,
  calendars,
  visibleById,
  onToggleCalendar,
  onCreateClick,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-[272px] shrink-0 flex-col overflow-y-auto border-r border-[#3c4043] bg-[#1e1f20]">
      <div className="border-b border-[#3c4043] pb-7 pl-9 pr-9 pt-[22px]">
        <button
          type="button"
          onClick={onCreateClick}
          className="flex h-14 w-[124px] max-w-full items-center justify-start gap-2 rounded-[24px] border border-transparent bg-transparent pl-7 text-[#8ab4f8] transition-colors hover:bg-[#292a2d]"
          style={{ letterSpacing: 0 }}
        >
          <span className="flex items-center rounded-full bg-gradient-to-br from-blue-400 via-orange-400 to-green-400 p-[2px]">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#131314]">
              <Plus className="h-6 w-6 text-[#8ab4f8]" strokeWidth={2} />
            </span>
          </span>
          <span className="pb-0.5 text-[17px] font-medium">Create</span>
        </button>
      </div>
      <MiniCalendar
        monthDate={monthDate}
        selectedDate={selectedDate}
        today={today}
        onNavigateMonth={onNavigateSidebarMonth}
        onSelectDay={onSelectMiniDay}
      />

      <div className="px-4 pb-10">
        <Input readOnly placeholder="Kişileri arayın" className="h-11 cursor-default" />
      </div>

      <SeparatorThin />

      <div className="px-8 pb-2 text-xs font-semibold uppercase tracking-[0.025em] text-[#bdc1c6]">
        Takvimlerim
      </div>
      <div className="flex flex-col gap-2 px-4 pb-10">
        {calendars.map((c) => {
          const checked = visibleById[c.id] ?? c.isVisibleDefault
          const color = c.color || '#4285f4'
          const label =
            c.name.toLowerCase() === 'birthdays'
              ? 'Doğum günleri'
              : userName && c.name === userName
                ? userName
                : c.name
          return (
            <label
              key={c.id}
              className="flex cursor-pointer items-center gap-3 rounded-md py-1.5 pr-2 text-[14px] text-[#e3e3e3] hover:bg-[#292a2d]/40"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => onToggleCalendar(c.id, v === true)}
              />
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
              <span className="truncate">{label}</span>
            </label>
          )
        })}
      </div>

      <SeparatorThin />

      <div className="px-8 pb-2 text-xs font-semibold uppercase tracking-[0.025em] text-[#bdc1c6]">
        Diğer takvimler
      </div>
      <div className="flex flex-col gap-2 px-4 pb-10">
        <label className="flex cursor-default items-center gap-3 py-1.5 text-[14px] text-[#80868b]">
          <Checkbox checked={false} disabled className="opacity-50" />
          <span className="truncate">Türkiye&apos;deki tatiller</span>
        </label>
      </div>
    </aside>
  )
}
