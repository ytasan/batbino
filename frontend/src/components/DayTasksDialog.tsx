import { format } from 'date-fns'
import { useRef, useState } from 'react'

import { TaskContextMenu } from '@/components/TaskContextMenu'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { EventApi } from '@/lib/api'
import { cn } from '@/lib/utils'

type DayTasksDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: Date | null
  tasks: EventApi[]
  onSelectTask: (task: EventApi) => void
  onMoveTask: (taskId: string, targetDay: Date) => void
  onMarkDone: (task: EventApi) => void
  onDeleteTask: (task: EventApi) => void
}

export function DayTasksDialog({
  open,
  onOpenChange,
  day,
  tasks,
  onSelectTask,
  onMoveTask,
  onMarkDone,
  onDeleteTask,
}: DayTasksDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    task: EventApi
  } | null>(null)
  const suppressTaskClickRef = useRef(false)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setContextMenu(null)
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md overflow-hidden">
        <div ref={contentRef} className="relative min-w-0 w-full">
          <DialogTitle>{day ? format(day, 'EEEE, MMMM d') : 'Tasks'}</DialogTitle>
          <ul className="flex max-h-[60vh] min-w-0 w-full flex-col gap-1 overflow-y-auto">
            {tasks.map((ev) => (
              <li key={ev.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (suppressTaskClickRef.current) {
                      suppressTaskClickRef.current = false
                      return
                    }
                    onSelectTask(ev)
                    onOpenChange(false)
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    suppressTaskClickRef.current = true
                    const rect = contentRef.current?.getBoundingClientRect()
                    if (!rect) return
                    setContextMenu({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      task: ev,
                    })
                  }}
                  className={cn(
                    'block w-full min-w-0 max-w-full cursor-pointer truncate rounded-sm px-2 py-1.5 text-left text-[13px] leading-tight text-black hover:brightness-110',
                    ev.done && 'line-through opacity-60',
                  )}
                  style={{
                    backgroundColor: ev.calendar.color,
                  }}
                  title={ev.title}
                >
                  {ev.title}
                </button>
              </li>
            ))}
          </ul>
          {contextMenu ? (
            <TaskContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              task={contextMenu.task}
              onMoveTask={onMoveTask}
              onMarkDone={onMarkDone}
              onEdit={(task) => {
                onSelectTask(task)
                onOpenChange(false)
              }}
              onDelete={onDeleteTask}
              onClose={() => setContextMenu(null)}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
