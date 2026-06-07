import { isSameDay, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'

import type { CalendarListItem, EventApi } from '@/lib/api'
import { deleteEventApi, updateEventApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function allDayRange(day: Date): { start: Date; end: Date } {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function isLegacyTimedTask(task: EventApi): boolean {
  if (task.allDay) return false
  const start = parseISO(task.startAt)
  const end = parseISO(task.endAt)
  return (
    isSameDay(start, end) &&
    start.getHours() === 9 &&
    start.getMinutes() === 0 &&
    end.getHours() === 10 &&
    end.getMinutes() === 0
  )
}

type TaskDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: EventApi | null
  calendars: CalendarListItem[]
  onUpdated: () => void
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  calendars,
  onUpdated,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState('')
  const [calendarId, setCalendarId] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [description, setDescription] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open || !task) return
    setTitle(task.title)
    setCalendarId(task.calendarId)
    setDescription(task.description ?? '')
    setError(null)

    const start = parseISO(task.startAt)
    const useAllDay = task.allDay || isLegacyTimedTask(task)
    setAllDay(useAllDay)

    if (useAllDay) {
      const { start: dayStart, end: dayEnd } = allDayRange(start)
      setStartLocal(toLocalDatetimeValue(dayStart))
      setEndLocal(toLocalDatetimeValue(dayEnd))
    } else {
      setStartLocal(toLocalDatetimeValue(start))
      setEndLocal(toLocalDatetimeValue(parseISO(task.endAt)))
    }
  }, [open, task])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!task) return

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    const start = new Date(startLocal)
    const end = new Date(endLocal)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError('Invalid date/time')
      return
    }
    if (end <= start) {
      setError('End must be after start')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateEventApi(task.id, {
        title: title.trim(),
        calendarId,
        description: description.trim() || null,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        allDay,
      })
      onUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  async function remove() {
    if (!task) return
    if (!window.confirm('Delete this task?')) return

    setDeleting(true)
    setError(null)
    try {
      await deleteEventApi(task.id)
      onUpdated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    } finally {
      setDeleting(false)
    }
  }

  if (!task) return null

  const selectedCalendar = calendars.find((c) => c.id === calendarId) ?? task.calendar

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="flex items-center gap-3 pr-8">
          <span
            className="h-4 w-4 shrink-0 rounded-full"
            style={{ backgroundColor: selectedCalendar.color }}
            aria-hidden
          />
          <DialogTitle>Edit task</DialogTitle>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(x) => setTitle(x.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-cal">Calendar</Label>
            <select
              id="task-cal"
              className="h-11 rounded-lg border border-[#3c4043] bg-[#131314] px-3 text-[15px] text-[#e3e3e3] outline-none focus-visible:border-[#8ab4f8]"
              value={calendarId}
              onChange={(x) => setCalendarId(x.target.value)}
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="task-allday"
              checked={allDay}
              onCheckedChange={(v) => {
                const next = v === true
                setAllDay(next)
                if (next) {
                  const start = new Date(startLocal)
                  const { start: dayStart, end: dayEnd } = allDayRange(start)
                  setStartLocal(toLocalDatetimeValue(dayStart))
                  setEndLocal(toLocalDatetimeValue(dayEnd))
                } else {
                  const d = new Date(startLocal)
                  d.setHours(9, 0, 0, 0)
                  const e = new Date(d)
                  e.setHours(10, 0, 0, 0)
                  setStartLocal(toLocalDatetimeValue(d))
                  setEndLocal(toLocalDatetimeValue(e))
                }
              }}
            />
            <Label htmlFor="task-allday" className="cursor-pointer font-normal">
              All day
            </Label>
          </div>

          {allDay ? (
            <div className="grid gap-2">
              <Label htmlFor="task-date">Date</Label>
              <Input
                id="task-date"
                type="date"
                value={startLocal.slice(0, 10)}
                onChange={(x) => {
                  const day = new Date(`${x.target.value}T00:00:00`)
                  const { start: dayStart, end: dayEnd } = allDayRange(day)
                  setStartLocal(toLocalDatetimeValue(dayStart))
                  setEndLocal(toLocalDatetimeValue(dayEnd))
                }}
              />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="task-start">Start</Label>
                <Input
                  id="task-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(x) => setStartLocal(x.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-end">End</Label>
                <Input
                  id="task-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(x) => setEndLocal(x.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="task-desc">Description</Label>
            <textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(x) => setDescription(x.target.value)}
              className={cn(
                'w-full min-w-0 resize-y rounded-lg border border-[#3c4043] bg-[#1e1f20] px-3 py-2 text-[15px] text-[#e3e3e3] outline-none placeholder:text-[#80868b] focus-visible:border-[#8ab4f8]',
              )}
              placeholder="Optional notes"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="default"
              className="min-w-[88px] text-[#f28b82] hover:text-[#f28b82]"
              disabled={loading || deleting}
              onClick={() => void remove()}
            >
              {deleting ? '…' : 'Delete'}
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="default"
                className="min-w-[88px]"
                disabled={loading || deleting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="min-w-[112px]" disabled={loading || deleting}>
                {loading ? '…' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
