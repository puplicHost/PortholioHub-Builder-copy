/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect } from 'react'
import { X, Search, FileText, Image as ImageIcon, Link as LinkIcon, Loader2, LayoutList, Calendar } from 'lucide-react'
import { getAdminWorkspaceContent } from '@/lib/actions/portfolio'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function WorkspacePickerModal({ onClose, onSelect }: { onClose: () => void, onSelect: (item: any) => void }) {
  const [activeTab, setActiveTab] = useState<'strategies' | 'plans' | 'posts' | 'media' | 'external'>('strategies')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [externalTitle, setExternalTitle] = useState('')

  useEffect(() => {
    getAdminWorkspaceContent().then(res => {
      setData(res)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

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
            className="w-full flex items-center justify-between p-3 text-left border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-8 w-8 rounded bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{item.title || item.name || item.filename}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">
                  {data.workspaces.find((w:any) => w.id === item.workspaceId)?.name || 'Workspace'}
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
      <div className="bg-[var(--color-surface)] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold">Add Content to Project</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--color-surface-secondary)]">
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        </div>
        
        <div className="flex border-b border-[var(--color-border)]">
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
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-[var(--color-text-muted)]">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading workspace content...</p>
            </div>
          ) : (
            <>
              {activeTab === 'strategies' && renderList(data.strategies, 'workspace_strategy', <LayoutList className="h-4 w-4" />)}
              {activeTab === 'plans' && renderList(data.contentPlans, 'workspace_content_plan', <Calendar className="h-4 w-4" />)}
              {activeTab === 'posts' && renderList(data.posts, 'workspace_content', <FileText className="h-4 w-4" />)}
              {activeTab === 'media' && renderList(data.media, 'workspace_media', <ImageIcon className="h-4 w-4" />)}
              {activeTab === 'external' && (
                <div className="space-y-4 max-w-md mx-auto py-8">
                  <div>
                    <label className="text-sm font-medium mb-1 block">URL</label>
                    <Input placeholder="https://..." value={externalUrl} onChange={e => setExternalUrl(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title (Optional)</label>
                    <Input placeholder="My Guest Post" value={externalTitle} onChange={e => setExternalTitle(e.target.value)} />
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
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}
