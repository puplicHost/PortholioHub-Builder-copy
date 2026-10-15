'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

// Persistent state backed by localStorage (SSR-safe, no hydration mismatch).
// State is kept in a ref store; every update is written through to localStorage.
export function useStoredState<T>(
  key: string,
  fallback: T,
  clamp: (value: T) => T,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const storeRef = useRef<T>(fallback)
  const listenersRef = useRef(new Set<() => void>())
  const clamped = useCallback((value: T) => clamp(value), [clamp])

  const getSnapshot = useCallback(() => storeRef.current, [])

  const subscribe = useCallback(
    (listener: () => void) => {
      listenersRef.current.add(listener)
      const onStorage = (e: StorageEvent) => {
        if (e.key === key && e.newValue !== null) {
          try {
            storeRef.current = clamped(JSON.parse(e.newValue))
            listenersRef.current.forEach((l) => l())
          } catch {
            // Ignore malformed external writes
          }
        }
      }
      window.addEventListener('storage', onStorage)
      return () => {
        listenersRef.current.delete(listener)
        window.removeEventListener('storage', onStorage)
      }
    },
    [key, clamped],
  )

  const state = useSyncExternalStore(subscribe, getSnapshot, () => fallback)

  const setState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      storeRef.current = clamped(typeof updater === 'function' ? (updater as (prev: T) => T)(storeRef.current) : updater)
      try {
        window.localStorage.setItem(key, JSON.stringify(storeRef.current))
      } catch {
        // Storage unavailable
      }
      listenersRef.current.forEach((l) => l())
    },
    [key, clamped],
  )

  // Hydrate once from localStorage after mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) {
        storeRef.current = clamped(JSON.parse(raw))
        listenersRef.current.forEach((l) => l())
      }
    } catch {
      // Ignore malformed storage
    }
  }, [key, clamped])

  return [state, setState]
}
