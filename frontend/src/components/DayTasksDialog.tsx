import { format } from 'date-fns'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { EventApi } from '@/lib/api'

type DayTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: Date | null
  tasks: EventApi[]
  onSelectTask: (task: EventApi) => void
}

export function DayTasksDialog({
  open,
  onOpenChange,
  day,
  tasks,
  onSelectTask,
}: DayTasksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{day ? format(day, 'EEEE, MMMM d') : 'Tasks'}</DialogTitle>
        <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          {tasks.map((ev) => (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectTask(ev)
                  onOpenChange(false)
                }}
                className="w-full cursor-pointer truncate rounded-sm px-2 py-1.5 text-left text-[13px] leading-tight text-[#e3e3e3] hover:brightness-110"
                style={{
                  backgroundColor: `${ev.calendar.color}33`,
                  borderLeft: `3px solid ${ev.calendar.color}`,
                }}
                title={ev.title}
              >
                {ev.title}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
