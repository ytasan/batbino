import { startOfMonth } from 'date-fns'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type MonthSlideDirection = 'left' | 'right'

type ActiveTransition = {
  outgoingMonth: Date
  incomingMonth: Date
  direction: MonthSlideDirection
}

type MonthSlideTransitionProps = {
  month: Date
  direction: MonthSlideDirection | null
  onTransitionComplete?: () => void
  children: (month: Date) => ReactNode
}

const SLIDE_DURATION_MS = 300

export function MonthSlideTransition({
  month,
  direction,
  onTransitionComplete,
  children,
}: MonthSlideTransitionProps) {
  const normalizedMonth = startOfMonth(month)
  const prevMonthRef = useRef(normalizedMonth)
  const [transition, setTransition] = useState<ActiveTransition | null>(null)

  useEffect(() => {
    const prev = startOfMonth(prevMonthRef.current)
    const next = normalizedMonth
    if (prev.getTime() === next.getTime()) return

    if (direction) {
      setTransition({
        outgoingMonth: prev,
        incomingMonth: next,
        direction,
      })
    }

    prevMonthRef.current = next
  }, [normalizedMonth, direction])

  useEffect(() => {
    if (!transition) return
    const timer = window.setTimeout(() => {
      setTransition(null)
      onTransitionComplete?.()
    }, SLIDE_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [transition, onTransitionComplete])

  if (!transition) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children(normalizedMonth)}
      </div>
    )
  }

  const { outgoingMonth, incomingMonth, direction: dir } = transition

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'absolute inset-0 flex min-h-0 flex-col bg-[#131314]',
          dir === 'left' ? 'month-slide-out-left' : 'month-slide-out-right',
        )}
      >
        {children(outgoingMonth)}
      </div>
      <div
        className={cn(
          'absolute inset-0 flex min-h-0 flex-col bg-[#131314]',
          dir === 'left' ? 'month-slide-in-from-right' : 'month-slide-in-from-left',
        )}
      >
        {children(incomingMonth)}
      </div>
    </div>
  )
}
