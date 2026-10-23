'use client'

import { forwardRef, useRef, type ReactNode } from 'react'

export interface FileButtonProps {
  accept?: string
  multiple?: boolean
  capture?: boolean | 'user' | 'environment'
  disabled?: boolean
  onFiles: (files: FileList | null) => void
  className?: string
  children: ReactNode
  'aria-label'?: string
  title?: string
  id?: string
}

/**
 * Styled button that opens the native file picker. The real `<input>` stays
 * visually hidden but remains the only element that can trigger the OS dialog,
 * so keyboard, screen-reader, and mobile camera behaviour stay native.
 */
export const FileButton = forwardRef<HTMLButtonElement, FileButtonProps>(function FileButton(
  { accept, multiple, capture, disabled, onFiles, className = '', children, ...aria },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <button
        ref={ref}
        type="button"
        id={aria.id}
        disabled={disabled}
        aria-label={aria['aria-label']}
        title={aria.title}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-[13px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
      >
        {children}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        capture={capture}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(event) => {
          onFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </>
  )
})
