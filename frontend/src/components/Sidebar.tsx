import { format, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { CalendarListItem, EventApi } from '@/lib/api'
import { MiniCalendar } from '@/components/MiniCalendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { usePersistedBoolean } from '@/lib/usePersistedBoolean'
import { cn } from '@/lib/utils'

type SidebarProps = {
  monthDate: Date
  selectedDate: Date
  today: Date
  onNavigateSidebarMonth: (delta: number) => void
  onSelectMiniDay: (d: Date) => void
  calendars: CalendarListItem[]
  visibleById: Record<string, boolean>
  onToggleCalendar: (id: string, next: boolean) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  searchResults: EventApi[]
  onSelectSearchResult: (task: EventApi) => void
}

export function Sidebar({
  monthDate,
  selectedDate,
  today,
  onNavigateSidebarMonth,
  onSelectMiniDay,
  calendars,
  visibleById,
  onToggleCalendar,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onSelectSearchResult,
}: SidebarProps) {
  const [collapsed, setCollapsed] = usePersistedBoolean('batbino.leftSidebar.collapsed', false)

  return (
    <aside
      className={cn(
        'relative flex h-full shrink-0 flex-col overflow-hidden border-r border-[#3c4043] bg-[#1e1f20] transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-14' : 'w-[272px]',
      )}
    >
      {!collapsed ? (
        <>
          <div className="pt-[22px]">
          <MiniCalendar
            monthDate={monthDate}
            selectedDate={selectedDate}
            today={today}
            onNavigateMonth={onNavigateSidebarMonth}
            onSelectDay={onSelectMiniDay}
          />
          </div>

          <div className="px-4 pb-3">
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search"
              className="h-11"
              aria-label="Search tasks"
            />
            {searchQuery.trim() ? (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-[#3c4043] bg-[#131314]">
                {searchResults.length ? (
                  searchResults.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onSelectSearchResult(task)}
                      className="flex w-full items-start gap-2 border-b border-[#3c4043] px-3 py-2 text-left last:border-b-0 hover:bg-[#292a2d]"
                    >
                      <span
                        className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                        style={{ backgroundColor: task.calendar.color || '#4285f4' }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn('block truncate text-[13px] text-[#e3e3e3]', task.done && 'line-through opacity-60')}>{task.title}</span>
                        <span className="block truncate text-[11px] text-[#80868b]">
                          {format(parseISO(task.startAt), 'MMM d, yyyy')}
                          {task.description ? ` · ${task.description}` : ''}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-[12px] text-[#80868b]">No matching tasks</div>
                )}
              </div>
            ) : null}
          </div>

          <div className="px-8 pb-2 pt-1 text-xs font-semibold uppercase tracking-[0.025em] text-[#bdc1c6]">
            Calendars
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-10">
            {calendars.map((c) => {
              const checked = visibleById[c.id] ?? c.isVisibleDefault
              const color = c.color || '#4285f4'
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
                  <span className="truncate">{c.name}</span>
                </label>
              )
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center" />
      )}

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#3c4043] bg-[#1e1f20] text-[#80868b] transition-colors hover:bg-[#292a2d] hover:text-[#bdc1c6]',
          collapsed ? '-right-3' : '-right-3',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>
    </aside>
  )
}
