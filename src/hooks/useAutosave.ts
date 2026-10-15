'use client'

import { useEffect, useRef, useState } from 'react'

interface UseAutosaveOptions<T> {
  data: T
  onSave: (data: T) => Promise<void>
  delay?: number
}

type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutosave<T>({ data, onSave, delay = 2000 }: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDataRef = useRef(data)

  useEffect(() => {
    if (data === prevDataRef.current) return

    prevDataRef.current = data

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(async () => {
      setStatus('saving')
      try {
        await onSave(data)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
      }
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [data, onSave, delay])

  return { status }
}
