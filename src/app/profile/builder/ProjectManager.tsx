/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MediaPicker } from './MediaPicker'
import { uploadToCloudinary } from '@/lib/cloudinary'

export function ProjectManager({ profile, updateProfile, isCardMode = false, allProjectPages = [] }: { profile: any, updateProfile: any, isCardMode?: boolean, allProjectPages?: any[] }) {
  const projects = profile.projectPages || []
  const currentPage = isCardMode ? null : (projects[0] || null)
  const displayItems = isCardMode ? projects : (currentPage?.items || [])

  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  // ─── Card Mode (home page): manages project pages ─────────────────
  const handleAddCard = () => {
    const newProject = {
      id: `new-${Date.now()}`,
      title: 'New Project',
      description: '',
      coverImage: '',
      tags: [],
      sortOrder: projects.length + 1,
      items: [],
      linkType: 'none',
      externalLink: '',
      linkLabel: 'View Project',
      linkedPageSlug: '',
    }
    updateProfile((p: any) => ({
      ...p,
      projectPages: [...(p.projectPages || []), newProject]
    }))
    setEditingItem(newProject)
    setEditingIndex(null)
  }

  const handleDeleteCard = (id: string) => {
    updateProfile((p: any) => ({
      ...p,
      projectPages: p.projectPages.filter((proj: any) => proj.id !== id)
    }))
    if (editingItem?.id === id) {
      setEditingItem(null)
      setEditingIndex(null)
    }
  }

  const updateEditingCard = (field: string, value: any) => {
    setEditingItem((prev: any) => ({ ...prev, [field]: value }))
    updateProfile((p: any) => ({
      ...p,
      projectPages: p.projectPages.map((proj: any) =>
        proj.id === editingItem.id ? { ...proj, [field]: value } : proj
      )
    }))
  }

  const handleCardCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file)
      updateEditingCard('coverImage', result.url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  // ─── Item Mode (project page): manages items within the page ──────
  const handleAddItem = (item?: any) => {
    const newItem = item || {
      id: `item-${Date.now()}`,
      type: 'external',
      title: 'New Project',
      description: '',
      externalUrl: '',
      textContent: '',
      imageUrl: '',
      linkType: 'none',
      externalLink: '',
      linkLabel: 'View Project',
      linkedPageSlug: '',
    }
    updateProfile((p: any) => {
      const page = p.projectPages[0]
      if (!page) return p
      const newItems = [...(page.items || []), newItem]
      return {
        ...p,
        projectPages: p.projectPages.map((pp: any) =>
          pp.id === page.id ? { ...pp, items: newItems } : pp
        )
      }
    })
    // Set editing to the new item (it will have the临时 id)
    setEditingItem(newItem)
    setEditingIndex(null) // will be set after re-render via the list
  }

  const handleRemoveItem = (index: number) => {
    updateProfile((p: any) => {
      const page = p.projectPages[0]
      if (!page) return p
      const newItems = [...(page.items || [])]
      newItems.splice(index, 1)
      return {
        ...p,
        projectPages: p.projectPages.map((pp: any) =>
          pp.id === page.id ? { ...pp, items: newItems } : pp
        )
      }
    })
    if (editingIndex === index) {
      setEditingItem(null)
      setEditingIndex(null)
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1)
    }
  }

  const updateItemField = (index: number, field: string, value: any) => {
    setEditingItem((prev: any) => ({ ...prev, [field]: value }))
    updateProfile((p: any) => {
      const page = p.projectPages[0]
      if (!page) return p
      const newItems = [...(page.items || [])]
      newItems[index] = { ...newItems[index], [field]: value }
      return {
        ...p,
        projectPages: p.projectPages.map((pp: any) =>
          pp.id === page.id ? { ...pp, items: newItems } : pp
        )
      }
    })
  }

  const handleItemCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadToCloudinary(file)
      updateItemField(index, 'imageUrl', result.url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const startEditItem = (item: any, index: number) => {
    setEditingItem({ ...item })
    setEditingIndex(index)
  }

  // ─── Media picker callback (Supabase Storage) ─────────────────────
  const handlePickerSelect = (item: any) => {
    handleAddItem(item)
  }

  // ─── Card Mode Edit Form ──────────────────────────────────────────
  if (isCardMode && editingItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Edit Project Card</h3>
          <button onClick={() => { setEditingItem(null); setEditingIndex(null) }} className="text-xs text-[var(--color-primary)] hover:underline">Back</button>
        </div>

        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Project Title</label>
          <Input
            value={editingItem.title}
            onChange={e => updateEditingCard('title', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Cover Image</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={editingItem.coverImage || ''}
              onChange={e => updateEditingCard('coverImage', e.target.value)}
              placeholder="Image URL"
              className="flex-1"
            />
            <div className="relative overflow-hidden shrink-0">
              <Button variant="secondary" className="h-9 px-3" disabled={uploading}>
                {uploading ? '...' : 'Upload'}
              </Button>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleCardCoverUpload}
              />
            </div>
          </div>
          {editingItem.coverImage && (
            <img src={editingItem.coverImage} alt="Cover Preview" className="mt-2 w-full h-32 rounded-md object-cover border border-[var(--color-border)]" />
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">Description</label>
          <textarea
            value={editingItem.description || ''}
            onChange={e => updateEditingCard('description', e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            rows={3}
          />
        </div>

        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Tags (comma separated)</label>
          <Input
            value={(editingItem.tags || []).join(', ')}
            onChange={e => updateEditingCard('tags', e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean))}
            className="mt-1"
            placeholder="React, Design, Copywriting"
          />
        </div>

        <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Project Link
          </label>
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            {(['none', 'external', 'page'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  updateEditingCard('linkType', type)
                  if (type === 'none') {
                    updateEditingCard('externalLink', '')
                    updateEditingCard('linkLabel', '')
                    updateEditingCard('linkedPageSlug', '')
                  }
                }}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  (editingItem.linkType || 'none') === type
                    ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {type === 'none' ? 'No Link' : type === 'external' ? 'External URL' : 'Project Page'}
              </button>
            ))}
          </div>

          {(editingItem.linkType || 'none') === 'external' && (
            <>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">External URL</label>
                <Input
                  value={editingItem.externalLink || ''}
                  onChange={e => updateEditingCard('externalLink', e.target.value)}
                  className="mt-1"
                  placeholder="https://example.com/project"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Link Label</label>
                <Input
                  value={editingItem.linkLabel || 'View Project'}
                  onChange={e => updateEditingCard('linkLabel', e.target.value)}
                  className="mt-1"
                  placeholder="View Project"
                />
              </div>
            </>
          )}

          {(editingItem.linkType || 'none') === 'page' && (
            <>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Link to Page</label>
                <select
                  value={editingItem.linkedPageSlug || ''}
                  onChange={e => updateEditingCard('linkedPageSlug', e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">— Select a page —</option>
                  {allProjectPages.map((pp: any) => (
                    <option key={pp.id} value={pp.slug}>{pp.title || pp.slug}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Link Label</label>
                <Input
                  value={editingItem.linkLabel || 'View Project'}
                  onChange={e => updateEditingCard('linkLabel', e.target.value)}
                  className="mt-1"
                  placeholder="View Project"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--color-text-secondary)]">Linked Content</label>
            <Button size="sm" variant="secondary" onClick={() => setIsPickerOpen(true)} className="h-7 text-xs px-2">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {(editingItem.items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <div className="flex items-center gap-2 truncate">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[10px] font-medium capitalize">
                    {item.type?.replace('workspace_', '') || 'item'}
                  </span>
                  <span className="truncate">{item.title || item.workspaceItemId || item.externalUrl || 'Item'}</span>
                </div>
                <button onClick={() => {
                  const newItems = [...(editingItem.items || [])]
                  newItems.splice(idx, 1)
                  updateEditingCard('items', newItems)
                }} className="text-[var(--color-danger)] hover:opacity-80">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(!editingItem.items || editingItem.items.length === 0) && (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-4 border border-dashed rounded border-[var(--color-border)]">
                No content linked yet.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Item Mode Edit Form (editing an item within a project page) ──
  if (!isCardMode && editingItem && editingIndex !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Edit Project Item</h3>
          <button onClick={() => { setEditingItem(null); setEditingIndex(null) }} className="text-xs text-[var(--color-primary)] hover:underline">Back</button>
        </div>

        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Title</label>
          <Input
            value={editingItem.title || ''}
            onChange={e => updateItemField(editingIndex, 'title', e.target.value)}
            className="mt-1"
            placeholder="Project title"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">Description</label>
          <textarea
            value={editingItem.description || editingItem.textContent || ''}
            onChange={e => updateItemField(editingIndex, 'textContent', e.target.value)}
            className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            rows={3}
            placeholder="Brief description of this project"
          />
        </div>

        <div>
          <label className="text-xs text-[var(--color-text-secondary)]">Image</label>
          <div className="flex gap-2 mt-1">
            <Input
              value={editingItem.imageUrl || ''}
              onChange={e => updateItemField(editingIndex, 'imageUrl', e.target.value)}
              placeholder="Image URL"
              className="flex-1"
            />
            <div className="relative overflow-hidden shrink-0">
              <Button variant="secondary" className="h-9 px-3" disabled={uploading}>
                {uploading ? '...' : 'Upload'}
              </Button>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => handleItemCoverUpload(e, editingIndex)}
              />
            </div>
          </div>
          {editingItem.imageUrl && (
            <img src={editingItem.imageUrl} alt="Preview" className="mt-2 w-full h-32 rounded-md object-cover border border-[var(--color-border)]" />
          )}
        </div>

        <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Link
          </label>
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            {(['none', 'external', 'page'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  updateItemField(editingIndex, 'linkType', type)
                  if (type === 'none') {
                    updateItemField(editingIndex, 'externalLink', '')
                    updateItemField(editingIndex, 'linkLabel', '')
                    updateItemField(editingIndex, 'linkedPageSlug', '')
                  }
                }}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                  (editingItem.linkType || 'none') === type
                    ? 'bg-white dark:bg-[#374151] text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {type === 'none' ? 'No Link' : type === 'external' ? 'External URL' : 'Project Page'}
              </button>
            ))}
          </div>

          {(editingItem.linkType || 'none') === 'external' && (
            <>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">External URL</label>
                <Input
                  value={editingItem.externalLink || ''}
                  onChange={e => updateItemField(editingIndex, 'externalLink', e.target.value)}
                  className="mt-1"
                  placeholder="https://example.com/project"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Link Label</label>
                <Input
                  value={editingItem.linkLabel || 'View Project'}
                  onChange={e => updateItemField(editingIndex, 'linkLabel', e.target.value)}
                  className="mt-1"
                  placeholder="View Project"
                />
              </div>
            </>
          )}

          {(editingItem.linkType || 'none') === 'page' && (
            <>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Link to Page</label>
                <select
                  value={editingItem.linkedPageSlug || ''}
                  onChange={e => updateItemField(editingIndex, 'linkedPageSlug', e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="">— Select a page —</option>
                  {allProjectPages.map((pp: any) => (
                    <option key={pp.id} value={pp.slug}>{pp.title || pp.slug}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-secondary)]">Link Label</label>
                <Input
                  value={editingItem.linkLabel || 'View Project'}
                  onChange={e => updateItemField(editingIndex, 'linkLabel', e.target.value)}
                  className="mt-1"
                  placeholder="View Project"
                />
              </div>
            </>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--color-text-secondary)]">Linked Content</label>
            <Button size="sm" variant="secondary" onClick={() => setIsPickerOpen(true)} className="h-7 text-xs px-2">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {(editingItem.linkedContent || editingItem.items || []).map((lc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <div className="flex items-center gap-2 truncate">
                  <span className="px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[10px] font-medium capitalize">
                    {lc.type?.replace('workspace_', '') || 'item'}
                  </span>
                  <span className="truncate">{lc.title || lc.workspaceItemId || lc.externalUrl || 'Item'}</span>
                </div>
                <button onClick={() => {
                  const key = editingItem.linkedContent ? 'linkedContent' : 'items'
                  const newLc = [...(editingItem[key] || [])]
                  newLc.splice(idx, 1)
                  updateItemField(editingIndex, key, newLc)
                }} className="text-[var(--color-danger)] hover:opacity-80">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(!editingItem.linkedContent && !editingItem.items || (editingItem.linkedContent?.length === 0 && editingItem.items?.length === 0)) && (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-4 border border-dashed rounded border-[var(--color-border)]">
                No content linked yet.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Default List View ────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {isCardMode ? (
        // ─── Card Mode: list of project pages ────────────────────────
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Projects</h3>
            <Button size="sm" variant="primary" onClick={handleAddCard} className="h-8">
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          </div>

          <div className="space-y-3">
            {projects.map((proj: any) => (
              <div key={proj.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{proj.title || 'Untitled'}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{proj.items?.length || 0} items linked</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingItem(proj); setEditingIndex(null) }} className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)] rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeleteCard(proj.id)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-secondary)] rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-8">
                You haven't added any projects yet.
              </p>
            )}
          </div>
        </>
      ) : (
        // ─── Item Mode: list of items within the current page ────────
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Page Items</h3>
            <Button size="sm" variant="primary" onClick={() => handleAddItem()} className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>

          <div className="space-y-3">
            {displayItems.map((item: any, idx: number) => (
              <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                <div className="flex items-center gap-3 min-w-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
                      <LinkIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.title || 'Untitled'}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                      {item.type === 'workspace_strategy' && 'Strategy'}
                      {item.type === 'workspace_content' && 'Content'}
                      {item.type === 'workspace_planning' && 'Planning'}
                      {item.type === 'external' && (item.externalUrl || 'External link')}
                      {item.type === 'page_link' && `Page: ${item.linkedPageSlug || item.externalUrl || '...'}`}
                      {!item.type && 'Item'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEditItem(item, idx)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)] rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleRemoveItem(idx)} className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-secondary)] rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {displayItems.length === 0 && (
              <p className="text-xs text-[var(--color-text-muted)] text-center py-8">
                No items on this page yet. Click &quot;Add Item&quot; to get started.
              </p>
            )}
          </div>
        </>
      )}

      {isPickerOpen && (
        <MediaPicker
          userId={profile.userId}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handlePickerSelect}
        />
      )}
    </div>
  )
}
