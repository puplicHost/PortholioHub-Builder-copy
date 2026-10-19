/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, Search, Image as ImageIcon, Loader2, Upload } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

// Public bucket for portfolio images. Created once in the Supabase dashboard
// (Storage → New bucket → name: portfolio-media, Public: ON).
// Uploads also need an INSERT policy for the anon role (see final report).
const BUCKET = 'portfolio-media'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

interface StoredFile {
  name: string
  url: string
}

export function MediaPicker({
  userId,
  onClose,
  onSelect,
}: {
  userId?: string
  onClose: () => void
  onSelect: (item: any) => void
}) {
  const [files, setFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [externalTitle, setExternalTitle] = useState('')
  const [mode, setMode] = useState<'library' | 'external'>('library')
  const [reloadKey, setReloadKey] = useState(0)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = 'media-picker-title'

  // Modal a11y (UI/UX #3): lock background scroll, close on Escape, restore
  // focus to the previously focused control on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus?.()
    }
  }, [onClose])

  useEffect(() => {
    const load = async () => {
      const supabase = getBrowserClient()
      if (!supabase) {
        setError('Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).')
        setLoading(false)
        return
      }
      const prefix = userId ? `${userId}/` : ''
      const { data, error: listError } = await supabase.storage.from(BUCKET).list(prefix)
      if (listError) {
        setError(`Could not list bucket "${BUCKET}": ${listError.message}`)
        setLoading(false)
        return
      }
      const items: StoredFile[] = (data || [])
        .filter((f) => f.name && !f.name.startsWith('.'))
        .map((f) => {
          const path = `${prefix}${f.name}`
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
          return { name: f.name, url: urlData.publicUrl }
        })
      setFiles(items)
      setLoading(false)
    }
    load()
  }, [userId, reloadKey])

  const handleUpload = async (file: File) => {
    const supabase = getBrowserClient()
    if (!supabase) return
    setUploading(true)
    setError(null)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${userId ? `${userId}/` : ''}${Date.now()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const entry = { name: safeName, url: urlData.publicUrl }
      setFiles((prev) => [entry, ...prev])
      onSelect({ type: 'external_image', imageUrl: entry.url, title: safeName })
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSelectFile = (file: StoredFile) => {
    onSelect({ type: 'external_image', imageUrl: file.url, title: file.name })
    onClose()
  }

  const handleAddExternal = () => {
    if (!externalUrl) return
    onSelect({ type: 'external_link', externalUrl, title: externalTitle || externalUrl })
    onClose()
  }

  const filtered = files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-[var(--color-surface)] rounded-xl w-full max-w-2xl max-h-[85dvh] flex flex-col shadow-2xl overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 id={titleId} className="text-lg font-semibold">Add Media to Project</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-1 hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div role="tablist" aria-label="Media source" className="flex border-b border-[var(--color-border)]">
          <button
            role="tab"
            aria-selected={mode === 'library'}
            onClick={() => setMode('library')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${
              mode === 'library' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            Media Library
          </button>
          <button
            role="tab"
            aria-selected={mode === 'external'}
            onClick={() => setMode('external')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${
              mode === 'external' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
            }`}
          >
            External Link
          </button>
        </div>

        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          {mode === 'library' ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <Input
                  type="search"
                  placeholder="Search your uploads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[var(--color-surface)]"
                />
              </div>
              <div className="relative overflow-hidden shrink-0">
                <Button variant="secondary" className="h-10 px-3" disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-1 text-xs">{uploading ? 'Uploading...' : 'Upload'}</span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file)
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">Add a link to an external article, video, or website.</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {mode === 'external' ? (
            <div className="space-y-4 max-w-md mx-auto py-8">
              <div>
                <label htmlFor="media-external-url" className="text-sm font-medium mb-1 block">URL</label>
                <Input id="media-external-url" type="url" inputMode="url" autoComplete="off" placeholder="https://..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
              </div>
              <div>
                <label htmlFor="media-external-title" className="text-sm font-medium mb-1 block">Title (Optional)</label>
                <Input id="media-external-title" placeholder="My Guest Post" value={externalTitle} onChange={(e) => setExternalTitle(e.target.value)} />
              </div>
              <Button variant="primary" className="w-full" onClick={handleAddExternal} disabled={!externalUrl}>
                Add Link
              </Button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading media library...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-center text-[var(--color-danger)]">{error}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setError(null)
                  setLoading(true)
                  setReloadKey((k) => k + 1)
                }}
              >
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">No uploads yet. Use Upload to add your first image.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((file) => (
                <button
                  key={file.url}
                  onClick={() => handleSelectFile(file)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  title={file.name}
                  aria-label={`Select ${file.name}`}
                >
                  <img src={file.url} alt={file.name} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.name}
                  </span>
                  <span className="absolute right-1 top-1 rounded bg-[var(--color-surface)] p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
