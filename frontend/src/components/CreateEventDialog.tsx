import { useEffect, useState } from 'react'

import type { CalendarListItem } from '@/lib/api'
import { createEventApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function toLocalDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || calendars.length === 0) return
    const d = new Date(defaultDay)
    d.setHours(9, 0, 0, 0)
    const e = new Date(d)
    e.setHours(10, 0, 0, 0)
    setStartLocal(toLocalDatetimeValue(d))
    setEndLocal(toLocalDatetimeValue(e))
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
        allDay: false,
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
        <DialogTitle>Yeni etkinlik</DialogTitle>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="evt-title">Başlık</Label>
            <Input
              id="evt-title"
              value={title}
              onChange={(x) => setTitle(x.target.value)}
              placeholder="Etkinlik başlığı"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="evt-cal">Takvim</Label>
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
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="evt-start">Başlangıç</Label>
              <Input
                id="evt-start"
                type="datetime-local"
                value={startLocal}
                onChange={(x) => setStartLocal(x.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="evt-end">Bitiş</Label>
              <Input
                id="evt-end"
                type="datetime-local"
                value={endLocal}
                onChange={(x) => setEndLocal(x.target.value)}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="default" className="min-w-[88px]" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="min-w-[112px]"
              disabled={loading}
            >
              {loading ? '…' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
