'use client'

import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react'
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

export type ToastDir = 'ltr' | 'rtl'

export interface ToastContextType {
  toast: (type: ToastType, message: string, action?: ToastAction) => void
  /**
   * Scoped direction for the toaster. Defaults to `ltr` (app default); the
   * builder sets it while mounted and restores it on unmount so RTL never
   * leaks onto public pages.
   */
  setDir: (dir: ToastDir) => void
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

const toastStyles: Record<ToastType, { container: string; icon: string; text: string; close: string }> = {
  success: {
    container: 'bg-[#16a34a] border-[#16a34a] dark:border-[rgba(255,255,255,0.1)] shadow-[var(--shadow-md)]',
    icon: 'text-white',
    text: 'text-white',
    close: 'text-white/80 hover:text-white',
  },
  error: {
    container: 'bg-[#dc2626] border-[#dc2626] dark:border-[rgba(255,255,255,0.1)] shadow-[var(--shadow-md)]',
    icon: 'text-white',
    text: 'text-white',
    close: 'text-white/80 hover:text-white',
  },
  info: {
    container: 'bg-[var(--color-surface)] border-[var(--color-border)] dark:border-[rgba(255,255,255,0.1)] shadow-[var(--shadow-md)]',
    icon: 'text-[var(--color-info)]',
    text: 'text-[var(--color-text-primary)]',
    close: 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
  },
  warning: {
    container: 'bg-[#d97706] border-[#d97706] dark:border-[rgba(255,255,255,0.1)] shadow-[var(--shadow-md)]',
    icon: 'text-white',
    text: 'text-white',
    close: 'text-white/80 hover:text-white',
  },
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
  const [dir, setDir] = useState<ToastDir>('ltr')
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

  const contextValue = useMemo(() => ({ toast, setDir }), [toast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        dir={dir}
        className={`fixed z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none ${
          positionClasses[position] || positionClasses['top-center']
        }`}
      >
        {toasts.map((t) => {
          const Icon = iconMap[t.type]
          const s = toastStyles[t.type]
          const isSolid = t.type === 'success' || t.type === 'error' || t.type === 'warning'
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] border border-solid p-4 w-full ${s.container}`}
              style={{ backgroundColor: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : t.type === 'warning' ? '#d97706' : undefined }}
            >
              <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${s.icon}`} aria-hidden="true" />
              <div className="flex-1 min-w-0 text-start">
                <p className={`text-sm font-medium ${s.text}`}>
                  {t.message}
                </p>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick()
                      removeToast(t.id)
                    }}
                    className={`mt-1.5 min-h-[44px] text-xs font-medium hover:underline cursor-pointer ${isSolid ? 'text-white underline-offset-2' : 'text-[var(--color-primary)]'}`}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md cursor-pointer transition-colors shrink-0 ${s.close}`}
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
