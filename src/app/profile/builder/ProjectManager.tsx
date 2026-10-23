/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, Link as LinkIcon, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MediaPicker } from './MediaPicker'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { Select } from './ui/Select'
import { FileButton } from './ui/FileButton'
import type { Prisma } from '@prisma/client'

type ProjectPageWithItems = Prisma.ProjectPageGetPayload<{ include: { items: true } }>

export function ProjectManager({ profile, updateProfile, isCardMode = false, allProjectPages = [], isFree = false }: { profile: any, updateProfile: any, isCardMode?: boolean, allProjectPages?: ProjectPageWithItems[], isFree?: boolean }) {
  const { t } = useBuilderI18n()
  const confirm = useConfirm()
  // Project pages come from the parent (`projectPages`, sorted by sortOrder).
  // A local `profile.projectPages` copy used to shadow this prop; it could
  // silently diverge from the sorted list the card/pages UI is built from.
  // Pages created from the Pages tab are content pages (`showInProjects`
  // false) and must never appear as home-page cards.
  const projects = isCardMode
    ? allProjectPages.filter((p: any) => p.showInProjects !== false)
    : allProjectPages
  const currentPage = isCardMode ? null : (projects[0] || null)
  const displayItems = isCardMode ? projects : (currentPage?.items || [])

  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const linkTypeLabel = (type: string) =>
    type === 'none' ? t('project.noLink') : type === 'external' ? t('project.externalUrl') : t('project.projectPage')

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
      showInProjects: true,
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

  const handleDeleteCard = async (id: string) => {
    const ok = await confirm({
      title: t('confirm.deleteProjectTitle'),
      message: t('confirm.deleteProjectMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
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

  const handleCardCoverUpload = async (file: File | undefined) => {
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
    setEditingItem(newItem)
    setEditingIndex(null) // will be set after re-render via the list
  }

  const handleRemoveItem = async (index: number) => {
    const ok = await confirm({
      title: t('confirm.removeItemTitle'),
      message: t('confirm.removeItemMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
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

  const handleItemCoverUpload = async (file: File | undefined, index: number) => {
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

  const removeCardLinkedContent = async (idx: number) => {
    const ok = await confirm({
      title: t('confirm.removeLinkedContentTitle'),
      message: t('confirm.removeLinkedContentMessage'),
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return
    const newItems = [...(editingItem.items || [])]
    newItems.splice(idx, 1)
    updateEditingCard('items', newItems)
  }

  // ─── Card Mode Edit Form ──────────────────────────────────────────
  if (isCardMode && editingItem) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('project.editCard')}</h3>
          <button onClick={() => { setEditingItem(null); setEditingIndex(null) }} className="text-xs text-[var(--color-primary)] hover:underline">{t('common.back')}</button>
        </div>

        <div>
          <label htmlFor="pmc-title" className="text-xs text-[var(--color-text-secondary)]">{t('project.projectTitle')}</label>
          <Input
            id="pmc-title"
            value={editingItem.title}
            onChange={e => updateEditingCard('title', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label htmlFor="pmc-cover" className="text-xs text-[var(--color-text-secondary)]">{t('project.coverImage')}</label>
          <div className="mt-1 flex gap-2">
            <Input
              id="pmc-cover"
              type="url"
              inputMode="url"
              value={editingItem.coverImage || ''}
              onChange={e => updateEditingCard('coverImage', e.target.value)}
              placeholder={t('placeholder.imageUrl')}
              className="flex-1"
            />
            <FileButton
              accept="image/*"
              disabled={uploading}
              onFiles={(files) => void handleCardCoverUpload(files?.[0])}
              aria-label={t('common.upload')}
              className="h-10 shrink-0 px-3 text-xs"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? t('common.uploading') : t('common.upload')}
            </FileButton>
          </div>
          {editingItem.coverImage && (
            <img src={editingItem.coverImage} alt={t('misc.coverPreview')} className="mt-2 h-32 w-full rounded-md border border-[var(--color-border)] object-cover" />
          )}
        </div>

        <div>
          <label htmlFor="pmc-desc" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">{t('field.description')}</label>
          <textarea
            id="pmc-desc"
            value={editingItem.description || ''}
            onChange={e => updateEditingCard('description', e.target.value)}
            className="mt-1 min-h-[120px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="pmc-tags" className="text-xs text-[var(--color-text-secondary)]">{t('project.tags')}</label>
          <Input
            id="pmc-tags"
            value={(editingItem.tags || []).join(', ')}
            onChange={e => updateEditingCard('tags', e.target.value.split(',').map((tag: string) => tag.trim()).filter(Boolean))}
            className="mt-1"
            placeholder={t('placeholder.tags')}
          />
        </div>

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <label id="pmc-link-label" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {t('project.projectLink')}
          </label>
          <div role="group" aria-labelledby="pmc-link-label" className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            {(['none', 'external', ...(isFree ? [] : ['page'])] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={(editingItem.linkType || 'none') === type}
                onClick={() => {
                  updateEditingCard('linkType', type)
                  if (type === 'none') {
                    updateEditingCard('externalLink', '')
                    updateEditingCard('linkLabel', '')
                    updateEditingCard('linkedPageSlug', '')
                  }
                }}
                className={`flex-1 cursor-pointer rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                  (editingItem.linkType || 'none') === type
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {linkTypeLabel(type)}
              </button>
            ))}
          </div>

          {(editingItem.linkType || 'none') === 'external' && (
            <>
              <div>
                <label htmlFor="pmc-external" className="text-xs text-[var(--color-text-secondary)]">{t('project.externalUrl')}</label>
                <Input
                  id="pmc-external"
                  type="url"
                  inputMode="url"
                  value={editingItem.externalLink || ''}
                  onChange={e => updateEditingCard('externalLink', e.target.value)}
                  className="mt-1"
                  placeholder="https://example.com/project"
                />
              </div>
              <div>
                <label htmlFor="pmc-linklabel" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkLabel')}</label>
                <Input
                  id="pmc-linklabel"
                  value={editingItem.linkLabel || ''}
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
                <label htmlFor="pmc-page" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkToPage')}</label>
                <Select
                  id="pmc-page"
                  className="mt-1"
                  value={editingItem.linkedPageSlug || ''}
                  onChange={(value) => updateEditingCard('linkedPageSlug', value)}
                  placeholder={t('project.selectPage')}
                  options={allProjectPages.map((pp: any) => ({
                    value: pp.slug,
                    label: pp.title || pp.slug,
                  }))}
                />
              </div>
              <div>
                <label htmlFor="pmc-linklabel-page" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkLabel')}</label>
                <Input
                  id="pmc-linklabel-page"
                  value={editingItem.linkLabel || ''}
                  onChange={e => updateEditingCard('linkLabel', e.target.value)}
                  className="mt-1"
                  placeholder="View Project"
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4" role="group" aria-labelledby="pmc-linked-content">
          <div className="flex items-center justify-between">
            <label id="pmc-linked-content" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkedContent')}</label>
            <Button size="sm" variant="secondary" onClick={() => setIsPickerOpen(true)} className="h-7 px-2 text-xs">
              <Plus className="me-1 h-3 w-3" /> {t('common.add')}
            </Button>
          </div>
          <div className="space-y-2">
            {(editingItem.items || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="rounded bg-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium capitalize">
                    {item.type?.replace('workspace_', '') || t('common.item')}
                  </span>
                  <span className="truncate">{item.title || item.workspaceItemId || item.externalUrl || t('common.item')}</span>
                </div>
                <button
                  aria-label={t('project.removeLinked')}
                  onClick={() => void removeCardLinkedContent(idx)} className="rounded-md p-1.5 text-[var(--color-danger)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(!editingItem.items || editingItem.items.length === 0) && (
              <p className="rounded border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
                {t('empty.linkedContent')}
              </p>
            )}
          </div>
        </div>

        {isPickerOpen && (
          <MediaPicker
            userId={profile.userId}
            onClose={() => setIsPickerOpen(false)}
            onSelect={(item: any) => updateEditingCard('items', [...(editingItem.items || []), item])}
          />
        )}
      </div>
    )
  }

  // ─── Item Mode Edit Form (editing an item within a project page) ──
  if (!isCardMode && editingItem && editingIndex !== null) {
    const removeItemLinkedContent = async (idx: number) => {
      const ok = await confirm({
        title: t('confirm.removeLinkedContentTitle'),
        message: t('confirm.removeLinkedContentMessage'),
        confirmLabel: t('confirm.confirm'),
        cancelLabel: t('confirm.cancel'),
        destructive: true,
      })
      if (!ok) return
      const key = editingItem.linkedContent ? 'linkedContent' : 'items'
      const newLc = [...(editingItem[key] || [])]
      newLc.splice(idx, 1)
      updateItemField(editingIndex, key, newLc)
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t('project.editItem')}</h3>
          <button onClick={() => { setEditingItem(null); setEditingIndex(null) }} className="text-xs text-[var(--color-primary)] hover:underline">{t('common.back')}</button>
        </div>

        <div>
          <label htmlFor="pmi-title" className="text-xs text-[var(--color-text-secondary)]">{t('field.title')}</label>
          <Input
            id="pmi-title"
            value={editingItem.title || ''}
            onChange={e => updateItemField(editingIndex, 'title', e.target.value)}
            className="mt-1"
            placeholder={t('placeholder.projectTitle')}
          />
        </div>

        <div>
          <label htmlFor="pmi-desc" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">{t('field.description')}</label>
          <textarea
            id="pmi-desc"
            value={editingItem.description || editingItem.textContent || ''}
            onChange={e => updateItemField(editingIndex, 'textContent', e.target.value)}
            className="mt-1 min-h-[120px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            rows={3}
            placeholder={t('placeholder.projectDescription')}
          />
        </div>

        <div>
          <label htmlFor="pmi-image" className="text-xs text-[var(--color-text-secondary)]">{t('field.image')}</label>
          <div className="mt-1 flex gap-2">
            <Input
              id="pmi-image"
              type="url"
              inputMode="url"
              value={editingItem.imageUrl || ''}
              onChange={e => updateItemField(editingIndex, 'imageUrl', e.target.value)}
              placeholder={t('placeholder.imageUrl')}
              className="flex-1"
            />
            <FileButton
              accept="image/*"
              disabled={uploading}
              onFiles={(files) => void handleItemCoverUpload(files?.[0], editingIndex)}
              aria-label={t('common.upload')}
              className="h-10 shrink-0 px-3 text-xs"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? t('common.uploading') : t('common.upload')}
            </FileButton>
          </div>
          {editingItem.imageUrl && (
            <img src={editingItem.imageUrl} alt={t('misc.coverPreview')} className="mt-2 h-32 w-full rounded-md border border-[var(--color-border)] object-cover" />
          )}
        </div>

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
          <label id="pmi-link-label" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {t('project.projectLink')}
          </label>
          <div role="group" aria-labelledby="pmi-link-label" className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            {(['none', 'external', ...(isFree ? [] : ['page'])] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={(editingItem.linkType || 'none') === type}
                onClick={() => {
                  updateItemField(editingIndex, 'linkType', type)
                  if (type === 'none') {
                    updateItemField(editingIndex, 'externalLink', '')
                    updateItemField(editingIndex, 'linkLabel', '')
                    updateItemField(editingIndex, 'linkedPageSlug', '')
                  }
                }}
                className={`flex-1 cursor-pointer rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                  (editingItem.linkType || 'none') === type
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {linkTypeLabel(type)}
              </button>
            ))}
          </div>

          {(editingItem.linkType || 'none') === 'external' && (
            <>
              <div>
                <label htmlFor="pmi-external" className="text-xs text-[var(--color-text-secondary)]">{t('project.externalUrl')}</label>
                <Input
                  id="pmi-external"
                  type="url"
                  inputMode="url"
                  value={editingItem.externalLink || ''}
                  onChange={e => updateItemField(editingIndex, 'externalLink', e.target.value)}
                  className="mt-1"
                  placeholder="https://example.com/project"
                />
              </div>
              <div>
                <label htmlFor="pmi-linklabel" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkLabel')}</label>
                <Input
                  id="pmi-linklabel"
                  value={editingItem.linkLabel || ''}
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
                <label htmlFor="pmi-page" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkToPage')}</label>
                <Select
                  id="pmi-page"
                  className="mt-1"
                  value={editingItem.linkedPageSlug || ''}
                  onChange={(value) => updateItemField(editingIndex, 'linkedPageSlug', value)}
                  placeholder={t('project.selectPage')}
                  options={allProjectPages.map((pp: any) => ({
                    value: pp.slug,
                    label: pp.title || pp.slug,
                  }))}
                />
              </div>
              <div>
                <label htmlFor="pmi-linklabel-page" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkLabel')}</label>
                <Input
                  id="pmi-linklabel-page"
                  value={editingItem.linkLabel || ''}
                  onChange={e => updateItemField(editingIndex, 'linkLabel', e.target.value)}
                  className="mt-1"
                  placeholder="View Project"
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4" role="group" aria-labelledby="pmi-linked-content">
          <div className="flex items-center justify-between">
            <label id="pmi-linked-content" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkedContent')}</label>
            <Button size="sm" variant="secondary" onClick={() => setIsPickerOpen(true)} className="h-7 px-2 text-xs">
              <Plus className="me-1 h-3 w-3" /> {t('common.add')}
            </Button>
          </div>
          <div className="space-y-2">
            {(editingItem.linkedContent || editingItem.items || []).map((lc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="rounded bg-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium capitalize">
                    {lc.type?.replace('workspace_', '') || t('common.item')}
                  </span>
                  <span className="truncate">{lc.title || lc.workspaceItemId || lc.externalUrl || t('common.item')}</span>
                </div>
                <button
                  aria-label={t('project.removeLinked')}
                  onClick={() => void removeItemLinkedContent(idx)} className="rounded-md p-1.5 text-[var(--color-danger)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {((!editingItem.linkedContent && !editingItem.items) || (editingItem.linkedContent?.length === 0 && editingItem.items?.length === 0)) && (
              <p className="rounded border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
                {t('empty.linkedContent')}
              </p>
            )}
          </div>
        </div>

        {isPickerOpen && (
          <MediaPicker
            userId={profile.userId}
            onClose={() => setIsPickerOpen(false)}
            onSelect={(item: any) => {
              const key = editingItem.linkedContent ? 'linkedContent' : 'items'
              updateItemField(editingIndex, key, [...(editingItem[key] || []), item])
            }}
          />
        )}
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
            <h3 className="text-sm font-semibold">{t('project.projectsTitle')}</h3>
            <Button size="sm" variant="primary" onClick={handleAddCard} className="h-8">
              <Plus className="me-1 h-4 w-4" /> {t('actions.newProject')}
            </Button>
          </div>

          {isFree && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              {t('project.pagesFreeHint')}
            </p>
          )}

          <div className="space-y-3">
            {projects.map((proj: any) => (
              <div key={proj.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{proj.title || t('common.untitled')}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{t('project.itemsLinked', { count: proj.items?.length || 0 })}</p>
                </div>
                <div className="flex gap-1">
                  <button aria-label={t('project.editProjectAria')} onClick={() => { setEditingItem(proj); setEditingIndex(null) }} className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button aria-label={t('project.deleteProjectAria')} onClick={() => void handleDeleteCard(proj.id)} className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                {t('empty.projects')}
              </p>
            )}
          </div>
        </>
      ) : (
        // ─── Item Mode: list of items within the current page ────────
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('project.pageItems')}</h3>
            <Button size="sm" variant="primary" onClick={() => handleAddItem()} className="h-8">
              <Plus className="me-1 h-4 w-4" /> {t('actions.addItem')}
            </Button>
          </div>

          <div className="space-y-3">
            {displayItems.map((item: any, idx: number) => (
              <div key={item.id || idx} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--color-surface-secondary)]">
                      <LinkIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{item.title || t('common.untitled')}</p>
                    <p className="truncate text-[10px] text-[var(--color-text-muted)]">
                      {item.type === 'workspace_strategy' && t('project.strategy')}
                      {item.type === 'workspace_content' && t('project.content')}
                      {item.type === 'workspace_planning' && t('project.planning')}
                      {item.type === 'external' && (item.externalUrl || t('project.externalLink'))}
                      {item.type === 'page_link' && t('project.pagePrefix', { slug: item.linkedPageSlug || item.externalUrl || '...' })}
                      {!item.type && t('common.item')}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button aria-label={t('project.editItemAria')} onClick={() => startEditItem(item, idx)} className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button aria-label={t('project.deleteItemAria')} onClick={() => void handleRemoveItem(idx)} className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {displayItems.length === 0 && (
              <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                {t('empty.projectPageItems')}
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
