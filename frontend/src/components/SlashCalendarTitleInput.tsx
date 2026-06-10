import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import type { CalendarListItem } from '@/lib/api'
import {
  applySlashCalendarSelection,
  filterCalendarsBySlashQuery,
  getSlashCalendarState,
} from '@/lib/slashCalendar'
import { cn } from '@/lib/utils'

type SlashCalendarTitleInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  calendarId: string
  onCalendarIdChange: (id: string) => void
  calendars: CalendarListItem[]
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SlashCalendarTitleInput({
  id,
  value,
  onChange,
  calendarId,
  onCalendarIdChange,
  calendars,
  placeholder = 'Task title — type / for calendar',
  autoFocus,
  className,
}: SlashCalendarTitleInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [cursor, setCursor] = useState(0)
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const slash = open ? getSlashCalendarState(value, cursor) : null
  const suggestions = slash ? filterCalendarsBySlashQuery(calendars, slash.query) : []

  useEffect(() => {
    if (!open) return
    setHighlight(0)
  }, [slash?.query, open])

  useEffect(() => {
    if (!open || highlight < suggestions.length) return
    setHighlight(Math.max(0, suggestions.length - 1))
  }, [highlight, open, suggestions.length])

  function syncCursor() {
    const pos = inputRef.current?.selectionStart ?? value.length
    setCursor(pos)
    const state = getSlashCalendarState(value, pos)
    setOpen(state !== null)
  }

  function selectCalendar(cal: CalendarListItem) {
    if (!slash) return
    const next = applySlashCalendarSelection(value, slash.slashIndex, cursor)
    onChange(next.title)
    onCalendarIdChange(cal.id)
    setOpen(false)
    requestAnimationFrame(() => {
      const el = inputRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(next.cursor, next.cursor)
      setCursor(next.cursor)
    })
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => (i + 1) % suggestions.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => (i - 1 + suggestions.length) % suggestions.length)
      return
    }
    if ((e.key === 'Enter' && !e.ctrlKey && !e.metaKey) || e.key === 'Tab') {
      e.preventDefault()
      selectCalendar(suggestions[highlight])
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const selectedCalendar = calendars.find((c) => c.id === calendarId)

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          const pos = e.target.selectionStart ?? e.target.value.length
          setCursor(pos)
          setOpen(getSlashCalendarState(e.target.value, pos) !== null)
        }}
        onClick={syncCursor}
        onKeyUp={syncCursor}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null
          if (listRef.current?.contains(next)) return
          window.setTimeout(() => setOpen(false), 120)
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={className}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={open ? `${id}-slash-list` : undefined}
      />

      {selectedCalendar ? (
        <div className="mt-1.5 flex items-center gap-2 text-[12px] text-[#bdc1c6]">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: selectedCalendar.color }}
          />
          <span className="truncate">{selectedCalendar.name}</span>
        </div>
      ) : null}

      {open && suggestions.length > 0 && slash ? (
        <ul
          ref={listRef}
          id={`${id}-slash-list`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[#3c4043] bg-[#1e1f20] py-1 shadow-lg"
        >
          {suggestions.map((cal, index) => (
            <li key={cal.id} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectCalendar(cal)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[#e3e3e3] hover:bg-[#292a2d]',
                  index === highlight && 'bg-[#292a2d]',
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: cal.color }}
                />
                <span className="min-w-0 flex-1 truncate">{cal.name}</span>
                {slash.query ? (
                  <span className="shrink-0 text-[11px] text-[#80868b]">/{slash.query}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
