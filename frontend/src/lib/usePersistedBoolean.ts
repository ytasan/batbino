import { useCallback, useState } from 'react'

export function usePersistedBoolean(key: string, defaultValue = false) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored === 'true') return true
      if (stored === 'false') return false
    } catch {
      /* ignore */
    }
    return defaultValue
  })

  const set = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        try {
          localStorage.setItem(key, String(resolved))
        } catch {
          /* ignore */
        }
        return resolved
      })
    },
    [key],
  )

  return [value, set] as const
}
