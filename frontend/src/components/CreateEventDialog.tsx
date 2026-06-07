// Dialog to create a task. Component and API names still use "event" internally.
import { useEffect, useState } from 'react'

import type { CalendarListItem } from '@/lib/api'
import { createEventApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

type CreateEventDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  calendars: CalendarListItem[]
  defaultDay: Date
  onCreated: () => void
}

export function CreateEventDialog({
  open,
  onOpenChange,
  calendars,
  defaultDay,
  onCreated,
}: CreateEventDialogProps) {
  const [title, setTitle] = useState('')
  const [calendarId, setCalendarId] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [allDay, setAllDay] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || calendars.length === 0) return
    const { start, end } = allDayRange(defaultDay)
    setStartLocal(toLocalDatetimeValue(start))
    setEndLocal(toLocalDatetimeValue(end))
    setAllDay(true)
    setCalendarId((id) => id || calendars[0]?.id || '')
    setTitle('')
    setError(null)
  }, [open, defaultDay, calendars])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const cal = calendars.find((c) => c.id === calendarId)
    if (!cal) {
      setError('Select a calendar')
      return
    }
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
      await createEventApi({
        calendarId: cal.id,
        title: title.trim(),
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        allDay,
      })
      onCreated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>New event</DialogTitle>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="evt-title">Title</Label>
            <Input
              id="evt-title"
              value={title}
              onChange={(x) => setTitle(x.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evt-cal">Calendar</Label>
            <select
              id="evt-cal"
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
              id="evt-allday"
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
            <Label htmlFor="evt-allday" className="cursor-pointer font-normal">
              All day
            </Label>
          </div>
          {allDay ? (
            <div className="grid gap-2">
              <Label htmlFor="evt-date">Date</Label>
              <Input
                id="evt-date"
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
                <Label htmlFor="evt-start">Start</Label>
                <Input
                  id="evt-start"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(x) => setStartLocal(x.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="evt-end">End</Label>
                <Input
                  id="evt-end"
                  type="datetime-local"
                  value={endLocal}
                  onChange={(x) => setEndLocal(x.target.value)}
                />
              </div>
            </div>
          )}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="default" className="min-w-[88px]" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-w-[112px]"
              disabled={loading}
            >
              {loading ? '…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
