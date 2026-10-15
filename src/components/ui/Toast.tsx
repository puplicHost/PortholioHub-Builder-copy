'use client'

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { tStatic } from '@/components/I18nProvider'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export type ToastPosition =
  | 'top-center'
  | 'top-right'
  | 'top-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  type: ToastType
  message: string
  action?: ToastAction
}

export interface ToastContextType {
  toast: (type: ToastType, message: string, action?: ToastAction) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error(tStatic('useToast must be used within ToastProvider'))
  return ctx
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const colorMap = {
  success: 'text-[var(--color-success)]',
  error: 'text-[var(--color-danger)]',
  info: 'text-[var(--color-info)]',
  warning: 'text-[var(--color-warning)]',
}

const bgMap = {
  success: 'bg-[var(--color-success)]/10 border-[var(--color-success)]/20',
  error: 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20',
  info: 'bg-[var(--color-info)]/10 border-[var(--color-info)]/20',
  warning: 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20',
}

const positionClasses: Record<ToastPosition, string> = {
  'top-center': 'top-6 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-6 right-6 items-end',
  'top-left': 'top-6 left-6 items-start',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-6 right-6 items-end',
  'bottom-left': 'bottom-6 left-6 items-start',
}

export interface ToastProviderProps {
  children?: ReactNode
  position?: ToastPosition
  visibleToasts?: number
  duration?: number
}

export function ToastProvider({
  children,
  position = 'top-center',
  visibleToasts = 1,
  duration = 3000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    const timer = timerRefs.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timerRefs.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (type: ToastType, message: string, action?: ToastAction) => {
      const id = Math.random().toString(36).slice(2)
      const newToast: Toast = { id, type, message, action }

      setToasts((prev) => {
        if (visibleToasts === 1) {
          timerRefs.current.forEach((timer) => clearTimeout(timer))
          timerRefs.current.clear()
          return [newToast]
        }
        const updated = [...prev, newToast]
        if (visibleToasts > 1 && updated.length > visibleToasts) {
          const removed = updated.slice(0, updated.length - visibleToasts)
          removed.forEach((t) => {
            const timer = timerRefs.current.get(t.id)
            if (timer) {
              clearTimeout(timer)
              timerRefs.current.delete(t.id)
            }
          })
          return updated.slice(-visibleToasts)
        }
        return updated
      })

      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      timerRefs.current.set(id, timer)
    },
    [duration, visibleToasts, removeToast],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className={`fixed z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none ${
          positionClasses[position] || positionClasses['top-center']
        }`}
      >
        {toasts.map((t) => {
          const Icon = iconMap[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] border p-4 shadow-[var(--shadow-md)] w-full ${bgMap[t.type]}`}
            >
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colorMap[t.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--color-text-primary)]">
                  {t.message}
                </p>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick()
                      removeToast(t.id)
                    }}
                    className="mt-1.5 text-xs font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function Toaster(props?: Partial<ToastProviderProps>) {
  void props
  return null
}
