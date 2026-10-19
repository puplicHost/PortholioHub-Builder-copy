/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, FileText, Image as ImageIcon, Link as LinkIcon, Loader2, LayoutList, Calendar } from 'lucide-react'
import { getAdminWorkspaceContent } from '@/lib/actions/portfolio'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function WorkspacePickerModal({ onClose, onSelect }: { onClose: () => void, onSelect: (item: any) => void }) {
  const [activeTab, setActiveTab] = useState<'strategies' | 'plans' | 'posts' | 'media' | 'external'>('strategies')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [externalTitle, setExternalTitle] = useState('')

  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = 'workspace-picker-title'

  // Modal a11y (UI/UX #3): lock background scroll, close on Escape, and
  // restore focus to the previously focused control on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Focus trap: keep Tab cycling inside the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        const list = Array.from(nodes).filter((el) => el.offsetParent !== null)
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (!active || active === first || !dialogRef.current.contains(active)) {
            e.preventDefault()
            last.focus()
          }
        } else if (!active || active === last || !dialogRef.current.contains(active)) {
          e.preventDefault()
          first.focus()
        }
      }
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
    getAdminWorkspaceContent().then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setError('Could not load workspace content. Please try again.')
      setLoading(false)
    })
  }, [reloadKey])

  const handleSelect = (type: string, id: string, title: string, extra?: any) => {
    onSelect({
      type,
      workspaceItemId: id,
      title,
      ...extra
    })
    onClose()
  }

  const handleAddExternal = () => {
    if (!externalUrl) return
    onSelect({
      type: 'external_link',
      externalUrl,
      title: externalTitle || externalUrl
    })
    onClose()
  }

  const renderList = (items: any[], type: string, icon: any) => {
    const filtered = items.filter(i => (i.title || i.name || i.filename || '').toLowerCase().includes(search.toLowerCase()))
    
    if (filtered.length === 0) {
      return <p className="text-sm text-center py-8 text-[var(--color-text-muted)]">No items found.</p>
    }

    return (
      <div className="space-y-2">
        {filtered.map(item => (
          <button 
            key={item.id}
            onClick={() => handleSelect(type, item.id, item.title || item.name || item.filename, { imageUrl: item.url })}
            className="group w-full flex items-center justify-between p-3 text-left border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 rounded bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{item.title || item.name || item.filename}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {data?.workspaces?.find((w:any) => w.id === item.workspaceId)?.name || 'Workspace'}
                  {item.platform && ` • ${item.platform}`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100">Select</span>
          </button>
        ))}
      </div>
    )
  }

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
          <h2 id={titleId} className="text-lg font-semibold">Add Content to Project</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-1 hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        </div>
        
        <div role="tablist" aria-label="Content source" className="flex border-b border-[var(--color-border)]">
          <Tab active={activeTab === 'strategies'} onClick={() => setActiveTab('strategies')}>Strategies</Tab>
          <Tab active={activeTab === 'plans'} onClick={() => setActiveTab('plans')}>Plans</Tab>
          <Tab active={activeTab === 'posts'} onClick={() => setActiveTab('posts')}>Posts</Tab>
          <Tab active={activeTab === 'media'} onClick={() => setActiveTab('media')}>Media</Tab>
          <Tab active={activeTab === 'external'} onClick={() => setActiveTab('external')}>External Link</Tab>
        </div>

        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          {activeTab !== 'external' ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input 
                type="search"
                aria-label="Search across your workspaces"
                placeholder="Search across your workspaces..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-[var(--color-surface)]"
              />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">Add a link to an external article, video, or website.</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div role="status" className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading workspace content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <p role="alert" className="text-sm text-center text-[var(--color-danger)]">{error}</p>
              <Button variant="secondary" size="sm" onClick={() => { setError(null); setLoading(true); setReloadKey((k) => k + 1) }}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              {activeTab === 'strategies' && renderList(data?.strategies || [], 'workspace_strategy', <LayoutList className="h-4 w-4" />)}
              {activeTab === 'plans' && renderList(data?.contentPlans || [], 'workspace_content_plan', <Calendar className="h-4 w-4" />)}
              {activeTab === 'posts' && renderList(data?.posts || [], 'workspace_content', <FileText className="h-4 w-4" />)}
              {activeTab === 'media' && renderList(data?.media || [], 'workspace_media', <ImageIcon className="h-4 w-4" />)}
              {activeTab === 'external' && (
                <div className="space-y-4 max-w-md mx-auto py-8">
                  <div>
                    <label htmlFor="ws-external-url" className="text-sm font-medium mb-1 block">URL</label>
                    <Input id="ws-external-url" type="url" inputMode="url" autoComplete="off" placeholder="https://..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="ws-external-title" className="text-sm font-medium mb-1 block">Title (Optional)</label>
                    <Input id="ws-external-title" placeholder="My Guest Post" value={externalTitle} onChange={e => setExternalTitle(e.target.value)} />
                  </div>
                  <Button variant="primary" className="w-full" onClick={handleAddExternal} disabled={!externalUrl}>
                    Add Link
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Tab({ active, onClick, children }: any) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${
        active ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}
