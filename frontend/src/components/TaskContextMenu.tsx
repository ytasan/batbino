import { addDays, parseISO, startOfDay } from 'date-fns'
import { useEffect, useRef } from 'react'

import type { EventApi } from '@/lib/api'

type TaskContextMenuProps = {
  x: number
  y: number
  task: EventApi
  onMoveTask: (taskId: string, targetDay: Date) => void
  onClose: () => void
}

export function TaskContextMenu({
  x,
  y,
  task,
  onMoveTask,
  onClose,
}: TaskContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node)) return
      onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  function moveToNextDay() {
    const nextDay = addDays(startOfDay(parseISO(task.startAt)), 1)
    onMoveTask(task.id, nextDay)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      data-task-context-menu
      className="absolute z-10 min-w-[180px] rounded-md border border-[#3c4043] bg-[#292a2d] py-1 shadow-lg"
      style={{ left: x, top: y }}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        role="menuitem"
        className="w-full px-3 py-2 text-left text-[13px] text-[#e3e3e3] hover:bg-[#3c4043]"
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          moveToNextDay()
        }}
      >
        Move to next day
      </button>
    </div>
  )
}
