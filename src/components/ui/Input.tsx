'use client'

import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full h-12 rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent ${error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--color-danger)] mt-0.5">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
