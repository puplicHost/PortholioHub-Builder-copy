'use client'

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  forwardRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectOptionGroup {
  label: string
  options: SelectOption[]
}

export type SelectItem = SelectOption | SelectOptionGroup

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectItem[]
  placeholder?: string
  disabled?: boolean
  id?: string
  name?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

function isGroup(item: SelectItem): item is SelectOptionGroup {
  return Array.isArray((item as SelectOptionGroup).options)
}

interface FlatOption {
  option: SelectOption
  globalIndex: number
}

/** Flattened list of selectable options, in render order. */
function flatten(items: SelectItem[]): FlatOption[] {
  const out: FlatOption[] = []
  let index = 0
  for (const item of items) {
    if (isGroup(item)) {
      for (const option of item.options) {
        out.push({ option, globalIndex: index })
        index += 1
      }
    } else {
      out.push({ option: item, globalIndex: index })
      index += 1
    }
  }
  return out
}

const subscribeNoop = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { value, onChange, options, placeholder, disabled, id, name, className = '', ...aria },
  ref,
) {
  const uid = useId()
  const buttonId = id || `select-${uid}`
  const listboxId = `${buttonId}-listbox`
  const isClient = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot)

  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const typeaheadRef = useRef({ query: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [rect, setRect] = useState<CSSProperties>({})

  useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement)

  const flat = flatten(options)
  const selectedFlat = flat.find((entry) => entry.option.value === value)
  const selectedLabel = selectedFlat?.option.label
  const display = selectedLabel ?? placeholder ?? ''

  const position = useCallback(() => {
    const node = buttonRef.current
    if (!node) return
    const r = node.getBoundingClientRect()
    const spaceBelow = window.innerHeight - r.bottom
    const maxHeight = Math.min(280, Math.max(120, spaceBelow - 12))
    const flipUp = spaceBelow < 140 && r.top > spaceBelow
    setRect({
      position: 'fixed',
      left: r.left,
      width: r.width,
      top: flipUp ? undefined : r.bottom + 6,
      bottom: flipUp ? window.innerHeight - r.top + 6 : undefined,
      maxHeight,
      zIndex: 80,
    })
  }, [])

  const openList = useCallback(() => {
    if (disabled) return
    position()
    const currentIndex = flat.findIndex((entry) => entry.option.value === value && !entry.option.disabled)
    setActiveIndex(currentIndex >= 0 ? currentIndex : flat.findIndex((entry) => !entry.option.disabled))
    setOpen(true)
  }, [disabled, flat, position, value])

  const closeList = useCallback((restoreFocus = true) => {
    setOpen(false)
    setActiveIndex(-1)
    if (restoreFocus) buttonRef.current?.focus()
  }, [])

  const choose = useCallback(
    (entry: FlatOption) => {
      if (entry.option.disabled) return
      onChange(entry.option.value)
      closeList()
    },
    [closeList, onChange],
  )

  const moveActive = useCallback(
    (direction: 1 | -1) => {
      if (flat.length === 0) return
      const enabled = flat.map((entry, i) => ({ entry, i })).filter(({ entry }) => !entry.option.disabled)
      if (enabled.length === 0) return
      const currentPos = enabled.findIndex(({ i }) => i === activeIndex)
      const nextPos =
        currentPos === -1
          ? direction === 1
            ? 0
            : enabled.length - 1
          : (currentPos + direction + enabled.length) % enabled.length
      setActiveIndex(enabled[nextPos].i)
    },
    [activeIndex, flat],
  )

  const typeahead = useCallback(
    (char: string) => {
      const now = Date.now()
      if (now - typeaheadRef.current.at > 600) typeaheadRef.current.query = ''
      typeaheadRef.current.at = now
      typeaheadRef.current.query += char.toLowerCase()
      const query = typeaheadRef.current.query
      const match = flat.find(
        (entry) => !entry.option.disabled && entry.option.label.toLowerCase().startsWith(query),
      )
      if (match) setActiveIndex(match.globalIndex)
    },
    [flat],
  )

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) openList()
        else moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) openList()
        else moveActive(-1)
        break
      case 'Home':
        if (!open) return
        event.preventDefault()
        setActiveIndex(flat.findIndex((entry) => !entry.option.disabled))
        break
      case 'End': {
        if (!open) return
        event.preventDefault()
        const reversed = [...flat].reverse()
        const found = reversed.find((entry) => !entry.option.disabled)
        setActiveIndex(found ? found.globalIndex : -1)
        break
      }
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) openList()
        else if (activeIndex >= 0 && flat[activeIndex]) choose(flat[activeIndex])
        break
      case 'Escape':
        if (!open) return
        event.preventDefault()
        closeList()
        break
      case 'Tab':
        if (open) closeList(false)
        break
      default:
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
          if (!open) openList()
          typeahead(event.key)
        }
    }
  }

  useEffect(() => {
    if (!open) return
    const update = () => position()
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || listRef.current?.contains(target)) return
      closeList(false)
    }
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [closeList, open, position])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    const node = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)
    if (node instanceof HTMLElement) node.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const activeOption = activeIndex >= 0 ? flat[activeIndex]?.option : undefined

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${buttonId}-option-${activeIndex}` : undefined
        }
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby']}
        disabled={disabled}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={onKeyDown}
        className={`flex h-[44px] w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-start text-[15px] text-[var(--color-text-primary)] transition-colors duration-150 ease-out hover:border-[var(--color-primary)]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
          open ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : ''
        }`}
      >
        <span
          className={`min-w-0 flex-1 truncate ${
            selectedLabel ? '' : 'text-[var(--color-text-muted)]'
          }`}
        >
          {display}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {name && <input type="hidden" name={name} value={value} />}

      {open &&
        isClient &&
        createPortal(
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-labelledby={buttonId}
            aria-activedescendant={
              activeIndex >= 0 ? `${buttonId}-option-${activeIndex}` : undefined
            }
            style={rect}
            className="overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-[var(--shadow-md)]"
          >
            {flat.length === 0 && (
              <li className="px-3 py-2 text-[13px] text-[var(--color-text-muted)]">—</li>
            )}
            {options.map((item, itemIndex) =>
              isGroup(item) ? (
                <li key={`group-${item.label}-${itemIndex}`} role="presentation">
                  <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {item.label}
                  </div>
                  <ul role="group" aria-label={item.label}>
                    {item.options.map((option) => (
                      <OptionRow
                        key={option.value}
                        option={option}
                        buttonId={buttonId}
                        index={flat.findIndex((entry) => entry.option === option)}
                        selected={option.value === value}
                        active={flat.findIndex((entry) => entry.option === option) === activeIndex}
                        onChoose={choose}
                        onHover={setActiveIndex}
                        flat={flat}
                      />
                    ))}
                  </ul>
                </li>
              ) : (
                <OptionRow
                  key={item.value}
                  option={item}
                  buttonId={buttonId}
                  index={flat.findIndex((entry) => entry.option === item)}
                  selected={item.value === value}
                  active={flat.findIndex((entry) => entry.option === item) === activeIndex}
                  onChoose={choose}
                  onHover={setActiveIndex}
                  flat={flat}
                />
              ),
            )}
          </ul>,
          document.body,
        )}

      {open && activeOption && (
        <span className="sr-only" aria-live="polite">
          {activeOption.label}
        </span>
      )}
    </div>
  )
})

function OptionRow({
  option,
  buttonId,
  index,
  selected,
  active,
  onChoose,
  onHover,
  flat,
}: {
  option: SelectOption
  buttonId: string
  index: number
  selected: boolean
  active: boolean
  onChoose: (entry: FlatOption) => void
  onHover: (index: number) => void
  flat: FlatOption[]
}) {
  return (
    <li
      id={`${buttonId}-option-${index}`}
      role="option"
      aria-selected={selected}
      aria-disabled={option.disabled || undefined}
      data-index={index}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        const entry = flat[index]
        if (entry) onChoose(entry)
      }}
      onMouseEnter={() => {
        if (!option.disabled) onHover(index)
      }}
      className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-start text-[13px] ${
        option.disabled
          ? 'cursor-not-allowed text-[var(--color-text-muted)] opacity-50'
          : active
            ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />}
    </li>
  )
}
