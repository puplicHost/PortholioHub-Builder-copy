/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, Link as LinkIcon, Loader2, Upload, ChevronUp, ChevronDown, FolderOpen, FileText, Table2, Image as ImageIcon, File as FileIcon, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MediaPicker } from './MediaPicker'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { useBuilderI18n } from './i18n/BuilderI18nContext'
import { useConfirm } from './ui/ConfirmModal'
import { Select } from './ui/Select'
import { FileButton } from './ui/FileButton'
import { ImageDeleteButton } from './ui/ImageDeleteButton'
import type { Prisma } from '@prisma/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ProjectPageWithItems = Prisma.ProjectPageGetPayload<{ include: { items: true } }>

type ProjectGroup = { id: string; title?: any }

function projectContent(page: any): Record<string, any> {
  return page?.content && typeof page.content === 'object' && !Array.isArray(page.content)
    ? page.content
    : {}
}

function cardVisual(page: any): 'image' | 'file-icon' | 'none' {
  const value = projectContent(page).cardVisual
  return value === 'file-icon' || value === 'none' ? value : 'image'
}

function cardFileType(page: any): string {
  const value = projectContent(page).fileType
  return ['pdf', 'sheet', 'doc', 'slides', 'folder', 'photo', 'script', 'generic'].includes(value) ? value : 'generic'
}

function groupTitle(group: ProjectGroup, locale: 'en' | 'ar'): string {
  const title = group?.title
  if (title && typeof title === 'object') return title[locale] || title.en || title.ar || ''
  return typeof title === 'string' ? title : ''
}

function localId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12)
  return `${prefix}_${random}`
}

function SortableGroupRow({
  group,
  index,
  total,
  showEn,
  showAr,
  onTitleChange,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAddCard,
}: {
  group: ProjectGroup
  index: number
  total: number
  showEn?: boolean
  showAr?: boolean
  onTitleChange: (groupId: string, lang: 'en' | 'ar', value: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  onAddCard: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id })
  const { t, locale } = useBuilderI18n()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const titleName = groupTitle(group, locale) || t('project.untitledGroup')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 transition-all ${
        isDragging ? 'z-50 opacity-60 shadow-lg ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      <div className="flex items-start gap-1.5">
        <div
          {...attributes}
          {...listeners}
          aria-label={t('project.dragReorderGroup')}
          className="cursor-grab active:cursor-grabbing p-1.5 mt-1 rounded hover:bg-black/5 dark:hover:bg-white/10 touch-none flex items-center justify-center shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="grid flex-1 gap-1">
          {showEn && (
            <Input
              aria-label={t('project.groupTitleEn')}
              value={groupTitle(group, 'en')}
              onChange={(e) => onTitleChange(group.id, 'en', e.target.value)}
              placeholder={t('project.groupTitleEn')}
              className="h-8 text-xs"
            />
          )}
          {showAr && (
            <Input
              aria-label={t('project.groupTitleAr')}
              dir="rtl"
              value={groupTitle(group, 'ar')}
              onChange={(e) => onTitleChange(group.id, 'ar', e.target.value)}
              placeholder={t('project.groupTitleAr')}
              className="h-8 text-xs text-right"
            />
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            aria-label={t('project.moveGroupUp', { name: titleName })}
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t('project.moveGroupDown', { name: titleName })}
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          aria-label={t('project.deleteGroupAria', { name: titleName })}
          onClick={onDelete}
          className="shrink-0 rounded p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={onAddCard}
        className="inline-flex items-center gap-1 rounded-md border border-dashed border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <Plus className="h-3 w-3" /> {t('project.addCardToGroup')}
      </button>
    </div>
  )
}

function SortableProjectRow({
  proj,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: {
  proj: any
  index: number
  total: number
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: proj.id })
  const { t } = useBuilderI18n()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all ${
        isDragging ? 'z-50 opacity-60 shadow-lg ring-2 ring-[var(--color-primary)]' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div
          {...attributes}
          {...listeners}
          aria-label={t('project.dragReorderCard')}
          className="cursor-grab active:cursor-grabbing p-1 -ms-1 rounded hover:bg-black/5 dark:hover:bg-white/10 touch-none flex items-center justify-center shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </div>

        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]" aria-hidden="true">
          {cardVisual(proj) === 'file-icon' ? (
            cardFileType(proj) === 'pdf' ? <FileText className="h-4 w-4" /> :
            cardFileType(proj) === 'sheet' ? <Table2 className="h-4 w-4" /> :
            cardFileType(proj) === 'folder' ? <FolderOpen className="h-4 w-4" /> :
            cardFileType(proj) === 'photo' ? <ImageIcon className="h-4 w-4" /> :
            cardFileType(proj) === 'doc' ? <FileText className="h-4 w-4" /> :
            <FileIcon className="h-4 w-4" />
          ) : proj.coverImage ? (
            <img src={proj.coverImage} alt="" className="h-9 w-9 rounded-md object-cover" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{proj.title || t('common.untitled')}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">{t('project.itemsLinked', { count: proj.items?.length || 0 })}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <div className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            aria-label={t('project.moveCardUp')}
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label={t('project.moveCardDown')}
            disabled={index === total - 1}
            onClick={onMoveDown}
            className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          aria-label={t('project.editProjectAria')}
          onClick={onEdit}
          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <Edit className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label={t('project.deleteProjectAria')}
          onClick={onDelete}
          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ProjectManager({
  profile,
  updateProfile,
  isCardMode = false,
  allProjectPages = [],
  isFree = false,
  groups = [],
  onGroupsChange,
  showEn = true,
  showAr = true,
}: {
  profile: any
  updateProfile: any
  isCardMode?: boolean
  allProjectPages?: ProjectPageWithItems[]
  isFree?: boolean
  groups?: ProjectGroup[]
  onGroupsChange?: (groups: ProjectGroup[]) => void
  showEn?: boolean
  showAr?: boolean
}) {
  const { t, locale } = useBuilderI18n()
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
  const [uploadProgress, setUploadProgress] = useState(0)

  const groupIds = new Set(groups.map((group) => group.id))
  const groupedCards = groups.map((group) => ({
    group,
    cards: projects.filter((project: any) => projectContent(project).groupId === group.id),
  }))
  const ungroupedCards = projects.filter((project: any) => {
    const groupId = projectContent(project).groupId
    return !groupId || !groupIds.has(groupId)
  })

  const linkTypeLabel = (type: string) =>
    type === 'none' ? t('project.noLink') : type === 'external' ? t('project.externalUrl') : t('project.projectPage')

  // ─── Project groups (stored on the Projects section content) ──────
  const setGroups = (next: ProjectGroup[]) => onGroupsChange?.(next)

  const handleAddGroup = () => {
    if (!onGroupsChange) return
    setGroups([...groups, { id: localId('group'), title: { en: 'New Group', ar: 'مجموعة جديدة' } }])
  }

  const updateGroupTitle = (groupId: string, lang: 'en' | 'ar', value: string) => {
    setGroups(
      groups.map((group) => {
        if (group.id !== groupId) return group
        const current = group.title && typeof group.title === 'object' ? group.title : {}
        return { ...group, title: { ...current, [lang]: value } }
      }),
    )
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const moveGroup = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= groups.length) return
    const next = arrayMove(groups, index, target)
    setGroups(next)
  }

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groups.findIndex((g) => g.id === active.id)
    const newIndex = groups.findIndex((g) => g.id === over.id)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
    const next = arrayMove(groups, oldIndex, newIndex)
    setGroups(next)
  }

  const reorderCardsInGroup = (groupId: string | null, newCards: any[]) => {
    updateProfile((p: any) => {
      const pages = p.projectPages || []
      const indices: number[] = []
      pages.forEach((page: any, idx: number) => {
        if (page.showInProjects === false) return
        const gId = projectContent(page).groupId
        if (groupId === null) {
          if (!gId || !groupIds.has(gId)) {
            indices.push(idx)
          }
        } else {
          if (gId === groupId) {
            indices.push(idx)
          }
        }
      })

      if (indices.length !== newCards.length) return p

      const nextPages = [...pages]
      indices.forEach((pageIdx, k) => {
        nextPages[pageIdx] = newCards[k]
      })

      let cardOrder = 0
      nextPages.forEach((page: any) => {
        if (page.showInProjects !== false) {
          page.sortOrder = cardOrder++
        }
      })

      return { ...p, projectPages: nextPages }
    })
  }

  const moveCardInGroup = (groupId: string | null, cardsList: any[], index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= cardsList.length) return
    const nextCards = arrayMove(cardsList, index, target)
    reorderCardsInGroup(groupId, nextCards)
  }

  const handleCardDragEnd = (groupId: string | null, groupCards: any[], event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groupCards.findIndex((c: any) => c.id === active.id)
    const newIndex = groupCards.findIndex((c: any) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return
    const nextCards = arrayMove(groupCards, oldIndex, newIndex)
    reorderCardsInGroup(groupId, nextCards)
  }

  const handleDeleteGroup = async (groupId: string) => {
    const groupCards = projects.filter((project: any) => projectContent(project).groupId === groupId)
    const count = groupCards.length
    const group = groups.find((g) => g.id === groupId)
    const gName = group ? groupTitle(group, locale) : ''

    const message = locale === 'ar'
      ? `هل أنت متأكد من حذف هذه المجموعة${gName ? ` (${gName})` : ''}؟ سيتم حذف المجموعة وجميع كروت المشاريع التابعة لها (${count} مشروع) نهائياً.`
      : `Are you sure you want to delete this group${gName ? ` (${gName})` : ''}? This group and all ${count} project card${count === 1 ? '' : 's'} inside it will be permanently deleted.`

    const ok = await confirm({
      title: locale === 'ar' ? 'حذف المجموعة ومشاريعها' : 'Delete Group & Projects',
      message,
      confirmLabel: t('confirm.confirm'),
      cancelLabel: t('confirm.cancel'),
      destructive: true,
    })
    if (!ok) return

    setGroups(groups.filter((group) => group.id !== groupId))

    // Delete the group and all project cards belonging to it
    updateProfile((p: any) => ({
      ...p,
      projectPages: (p.projectPages || []).filter((project: any) => {
        const content = projectContent(project)
        return content.groupId !== groupId
      }),
    }))

    if (editingItem && projectContent(editingItem).groupId === groupId) {
      setEditingItem(null)
      setEditingIndex(null)
    }
  }

  const assignCardGroup = (groupId: string) => {
    const content = projectContent(editingItem)
    if (groupId) updateEditingCard('content', { ...content, groupId })
    else {
      const nextContent = { ...content }
      delete nextContent.groupId
      updateEditingCard('content', nextContent)
    }
  }

  // ─── Card visuals (stored on ProjectPage.content) ─────────────────
  const cardVisual = (page: any): 'image' | 'file-icon' | 'none' => {
    const value = projectContent(page).cardVisual
    return value === 'file-icon' || value === 'none' ? value : 'image'
  }

  const cardFileType = (page: any): string => {
    const value = projectContent(page).fileType
    return ['pdf', 'sheet', 'doc', 'slides', 'folder', 'photo', 'script', 'generic'].includes(value) ? value : 'generic'
  }

  const setCardVisual = (value: 'image' | 'file-icon' | 'none') => {
    updateEditingCard('content', { ...projectContent(editingItem), cardVisual: value })
  }

  const setCardFileType = (value: string) => {
    updateEditingCard('content', { ...projectContent(editingItem), fileType: value })
  }

  const cardImageFit = (page: any): 'cover' | 'contain' => {
    const value = projectContent(page).imageFit
    return value === 'contain' ? 'contain' : 'cover'
  }

  const setCardImageFit = (value: 'cover' | 'contain') => {
    updateEditingCard('content', { ...projectContent(editingItem), imageFit: value })
  }

  // ─── Card Mode (home page): manages project pages ─────────────────
  const handleAddCard = (groupId?: string) => {
    const newProject = {
      id: `new-${localId('project')}`,
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
      content: groupId ? { groupId } : {},
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
    setUploadProgress(0)
    try {
      const result = await uploadToCloudinary(file, setUploadProgress)
      updateEditingCard('coverImage', result.url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
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
    setUploadProgress(0)
    try {
      const result = await uploadToCloudinary(file, setUploadProgress)
      updateItemField(index, 'imageUrl', result.url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
      setUploadProgress(0)
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

  const removeCardLinkedContent = (idx: number) => {
    const newItems = [...(editingItem.items || [])]
    newItems.splice(idx, 1)
    updateEditingCard('items', newItems)
  }

  const moveCardLinkedContent = (idx: number, direction: 'up' | 'down') => {
    const items = [...(editingItem.items || [])]
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= items.length) return
    const temp = items[idx]
    items[idx] = items[targetIdx]
    items[targetIdx] = temp
    updateEditingCard('items', items)
  }

  const updateCardLinkedItem = (idx: number, field: string, value: any) => {
    const items = [...(editingItem.items || [])]
    if (!items[idx]) return
    items[idx] = { ...items[idx], [field]: value }
    updateEditingCard('items', items)
  }

  // ─── Card Mode Edit Form ──────────────────────────────────────────
  if (isCardMode && editingItem) {
    // A linked card is only a home-page entry; its items belong to the page
    // row (the public detail route reads page.items). Hide the card-level
    // content picker so new items cannot be stranded on the card.
    const cardLinkedSlug =
      editingItem.linkType === 'page' && typeof editingItem.linkedPageSlug === 'string'
        ? editingItem.linkedPageSlug.trim()
        : ''
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
              {uploading ? `${t('common.uploading')} ${uploadProgress}%` : t('common.upload')}
            </FileButton>
            {editingItem.coverImage && (
              <ImageDeleteButton
                onDelete={() => updateEditingCard('coverImage', '')}
                className="h-10 min-h-[40px]"
              />
            )}
          </div>
          {editingItem.coverImage && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{t('project.imageFit')}</span>
                <div role="group" aria-label={t('project.imageFit')} className="inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
                  {(['cover', 'contain'] as const).map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      aria-pressed={cardImageFit(editingItem) === fit}
                      onClick={() => setCardImageFit(fit)}
                      className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        cardImageFit(editingItem) === fit
                          ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {fit === 'cover' ? t('project.fitCover') : t('project.fitContain')}
                    </button>
                  ))}
                </div>
              </div>
              <img
                src={editingItem.coverImage}
                alt={t('misc.coverPreview')}
                className={`h-32 w-full rounded-md border border-[var(--color-border)] ${
                  cardImageFit(editingItem) === 'contain' ? 'object-contain p-2 bg-[var(--color-surface-secondary)]' : 'object-cover'
                }`}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label id="pmc-visual" className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            {t('project.cardVisual')}
          </label>
          <div role="group" aria-labelledby="pmc-visual" className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-0.5">
            {(['image', 'file-icon', 'none'] as const).map((visual) => (
              <button
                key={visual}
                type="button"
                aria-pressed={cardVisual(editingItem) === visual}
                onClick={() => setCardVisual(visual)}
                className={`flex-1 cursor-pointer rounded-md py-1.5 text-[11px] font-semibold transition-colors ${
                  cardVisual(editingItem) === visual
                    ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {visual === 'image'
                  ? t('project.visualImage')
                  : visual === 'file-icon'
                    ? t('project.visualFileIcon')
                    : t('project.visualNone')}
              </button>
            ))}
          </div>
          {cardVisual(editingItem) === 'file-icon' && (
            <Select
              id="pmc-file-type"
              value={cardFileType(editingItem)}
              onChange={setCardFileType}
              options={[
                { value: 'pdf', label: t('fileIcon.pdf') },
                { value: 'sheet', label: t('fileIcon.sheet') },
                { value: 'doc', label: t('fileIcon.doc') },
                { value: 'slides', label: t('fileIcon.slides') },
                { value: 'folder', label: t('fileIcon.folder') },
                { value: 'photo', label: t('fileIcon.photo') },
                { value: 'script', label: t('fileIcon.script') },
                { value: 'generic', label: t('fileIcon.generic') },
              ]}
            />
          )}
        </div>

        {groups.length > 0 && (
          <div>
            <label htmlFor="pmc-group" className="text-xs text-[var(--color-text-secondary)]">{t('project.cardGroup')}</label>
            <Select
              id="pmc-group"
              className="mt-1"
              value={projectContent(editingItem).groupId || ''}
              onChange={assignCardGroup}
              placeholder={t('project.ungrouped')}
              options={[
                { value: '', label: t('project.ungrouped') },
                ...groups.map((group) => ({
                  value: group.id,
                  label: groupTitle(group, locale) || t('project.untitledGroup'),
                })),
              ]}
            />
          </div>
        )}

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

          {(editingItem.linkType || 'none') === 'page' && (() => {
            const contentPages = allProjectPages.filter(
              (pp: any) => pp.showInProjects === false && pp.id !== editingItem?.id
            )
            const selectablePages = contentPages.length > 0
              ? contentPages
              : allProjectPages.filter((pp: any) => pp.id !== editingItem?.id)
            return (
              <>
                <div>
                  <label htmlFor="pmc-page" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkToPage')}</label>
                  <Select
                    id="pmc-page"
                    className="mt-1"
                    value={editingItem.linkedPageSlug || ''}
                    onChange={(value) => updateEditingCard('linkedPageSlug', value)}
                    placeholder={t('project.selectPage')}
                    options={[
                      { value: '', label: t('project.selectPage') },
                      ...selectablePages.map((pp: any) => ({
                        value: pp.slug,
                        label: `${pp.title || t('common.untitled')} (/projects/${pp.slug})`,
                      })),
                    ]}
                  />
                  {selectablePages.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                      {locale === 'ar'
                        ? 'لا توجد صفحات منشأة بعد. يمكنك إنشاء صفحات وإدارتها من تبويب "الصفحات" في الشريط الجانبي.'
                        : 'No pages created yet. You can create and manage pages from the "Pages" tab in the left sidebar.'}
                    </p>
                  )}
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
            )
          })()}
        </div>

        {cardLinkedSlug ? (
          <div role="note" className="rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/5 p-3">
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {t('projectManager.linkedContentMoved', { slug: cardLinkedSlug })}
            </p>
          </div>
        ) : null}

        <div className="space-y-3 border-t border-[var(--color-border)] pt-4" role="group" aria-labelledby="pmc-linked-content">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label id="pmc-linked-content" className="text-xs font-semibold text-[var(--color-text-primary)]">
                {t('project.linkedContent')}
              </label>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                {locale === 'ar'
                  ? 'هذه الروابط تظهر كأزرار إضافية على الكارد.'
                  : 'These links appear as extra buttons on the card.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const newItem = {
                    id: `link-${Date.now()}`,
                    type: 'external_link',
                    title: '',
                    externalUrl: '',
                    iconType: 'generic',
                  }
                  updateEditingCard('items', [...(editingItem.items || []), newItem])
                }}
                className="h-7 px-2.5 text-xs"
              >
                <Plus className="me-1 h-3 w-3" />
                {locale === 'ar' ? 'إضافة رابط' : 'Add Link'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsPickerOpen(true)}
                className="h-7 px-2 text-xs"
                title={locale === 'ar' ? 'رفع صورة' : 'Upload Image'}
              >
                <Upload className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {(editingItem.items || []).map((item: any, idx: number) => {
              const isImage = item.type === 'external_image' || (item.imageUrl && !item.externalUrl)
              if (isImage) {
                return (
                  <div key={item.id || idx} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-2.5 text-xs">
                    <div className="flex items-center gap-2.5 truncate">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                      ) : (
                        <span className="rounded bg-[var(--color-border)] p-1.5">
                          <ImageIcon className="h-4 w-4 text-[var(--color-text-muted)]" />
                        </span>
                      )}
                      <span className="truncate text-xs font-medium">{item.title || item.name || t('common.item')}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCardLinkedContent(idx, 'up')}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
                        title={locale === 'ar' ? 'تحريك لأعلى' : 'Move up'}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (editingItem.items || []).length - 1}
                        onClick={() => moveCardLinkedContent(idx, 'down')}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
                        title={locale === 'ar' ? 'تحريك لأسفل' : 'Move down'}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('project.removeLinked')}
                        onClick={() => removeCardLinkedContent(idx)}
                        className="rounded-md p-1.5 text-[var(--color-danger)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                        title={locale === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              }

              // External link item
              const urlVal = item.externalUrl || item.url || ''
              const isInvalidUrl = Boolean(urlVal.trim() && !/^https?:\/\//i.test(urlVal.trim()))
              const currentIconType = item.iconType || (['generic', 'pdf', 'sheet', 'doc', 'folder'].includes(item.textContent) ? item.textContent : 'generic')

              return (
                <div key={item.id || idx} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      {locale === 'ar' ? `زر رابط #${idx + 1}` : `Link Button #${idx + 1}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCardLinkedContent(idx, 'up')}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
                        title={locale === 'ar' ? 'تحريك لأعلى' : 'Move up'}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (editingItem.items || []).length - 1}
                        onClick={() => moveCardLinkedContent(idx, 'down')}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:pointer-events-none"
                        title={locale === 'ar' ? 'تحريك لأسفل' : 'Move down'}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('project.removeLinked')}
                        onClick={() => removeCardLinkedContent(idx)}
                        className="rounded-md p-1.5 text-[var(--color-danger)] hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                        title={locale === 'ar' ? 'حذف' : 'Delete'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] block mb-1">
                        {locale === 'ar' ? 'نص الزر (مطلوب)' : 'Button Label (required)'}
                      </label>
                      <Input
                        value={item.title || item.label || item.linkLabel || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          updateCardLinkedItem(idx, 'title', val)
                          updateCardLinkedItem(idx, 'label', val)
                          updateCardLinkedItem(idx, 'linkLabel', val)
                        }}
                        placeholder={locale === 'ar' ? 'مثال: Drive، PDF، الكود' : 'e.g. Drive, PDF, Code'}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[var(--color-text-secondary)] block mb-1">
                        {locale === 'ar' ? 'نوع الأيقونة' : 'Icon Type'}
                      </label>
                      <select
                        value={currentIconType}
                        onChange={(e) => {
                          updateCardLinkedItem(idx, 'iconType', e.target.value)
                          updateCardLinkedItem(idx, 'textContent', e.target.value)
                        }}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <option value="generic">{locale === 'ar' ? 'عام (رابط خارجي)' : 'Generic (Link)'}</option>
                        <option value="pdf">PDF</option>
                        <option value="sheet">{locale === 'ar' ? 'جدول بيانات (Sheet)' : 'Spreadsheet (Sheet)'}</option>
                        <option value="doc">{locale === 'ar' ? 'مستند (Doc)' : 'Document (Doc)'}</option>
                        <option value="folder">{locale === 'ar' ? 'مجلد (Folder)' : 'Folder'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-[var(--color-text-secondary)] block mb-1">
                      {locale === 'ar' ? 'رابط الزر (URL)' : 'Button URL'}
                    </label>
                    <Input
                      type="url"
                      value={urlVal}
                      onChange={(e) => {
                        updateCardLinkedItem(idx, 'externalUrl', e.target.value)
                        updateCardLinkedItem(idx, 'url', e.target.value)
                      }}
                      placeholder="https://..."
                      className={`h-8 text-xs ${isInvalidUrl ? 'border-[var(--color-danger)]' : ''}`}
                    />
                    {isInvalidUrl && (
                      <p className="text-[11px] text-[var(--color-danger)] mt-1">
                        {locale === 'ar'
                          ? 'الرابط يجب أن يبدأ بـ http:// أو https://'
                          : 'URL must start with http:// or https://'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {(!editingItem.items || editingItem.items.length === 0) && (
              <p className="rounded-lg border border-dashed border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
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
              {uploading ? `${t('common.uploading')} ${uploadProgress}%` : t('common.upload')}
            </FileButton>
            {editingItem.imageUrl && (
              <ImageDeleteButton
                onDelete={() => updateItemField(editingIndex, 'imageUrl', '')}
                className="h-10 min-h-[40px]"
              />
            )}
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
                    updateItemField(editingIndex, 'externalUrl', '')
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
                  value={editingItem.externalUrl || ''}
                  onChange={e => updateItemField(editingIndex, 'externalUrl', e.target.value)}
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

          {(editingItem.linkType || 'none') === 'page' && (() => {
            const selectablePages = allProjectPages.filter(
              (pp: any) => pp.showInProjects === false && pp.id !== editingItem?.id
            )
            return (
              <>
                <div>
                  <label htmlFor="pmi-page" className="text-xs text-[var(--color-text-secondary)]">{t('project.linkToPage')}</label>
                  <Select
                    id="pmi-page"
                    className="mt-1"
                    value={editingItem.linkedPageSlug || ''}
                    onChange={(value) => updateItemField(editingIndex, 'linkedPageSlug', value)}
                    placeholder={t('project.selectPage')}
                    options={selectablePages.map((pp: any) => ({
                      value: pp.slug,
                      label: pp.title || pp.slug,
                    }))}
                  />
                  {selectablePages.length === 0 && (
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      {locale === 'ar'
                        ? 'لا توجد صفحات مخصصة بعد. أنشئ صفحة جديدة من تبويب الصفحات في القائمة الجانبية.'
                        : 'No standalone pages yet. Create one from the Pages tab in the left sidebar.'}
                    </p>
                  )}
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
            )
          })()}
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

  return (
    <div className="space-y-6">
      {isCardMode ? (
        // ─── Card Mode: list of project pages ────────────────────────
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('project.projectsTitle')}</h3>
            <Button size="sm" variant="primary" onClick={() => handleAddCard()} className="h-8">
              <Plus className="me-1 h-4 w-4" /> {t('actions.newProject')}
            </Button>
          </div>

          {isFree && (
            <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
              {t('project.pagesFreeHint')}
            </p>
          )}

          {onGroupsChange && (
            <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">{t('project.groups')}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{t('project.groupsHint')}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={handleAddGroup} className="h-7 shrink-0 px-2 text-xs">
                  <Plus className="me-1 h-3 w-3" /> {t('project.addGroup')}
                </Button>
              </div>

              {groups.length > 0 && (
                <DndContext
                  id="dnd-groups-manager"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleGroupDragEnd}
                >
                  <SortableContext
                    items={groups.map((g) => g.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {groups.map((group, index) => (
                        <SortableGroupRow
                          key={group.id}
                          group={group}
                          index={index}
                          total={groups.length}
                          showEn={showEn}
                          showAr={showAr}
                          onTitleChange={updateGroupTitle}
                          onMoveUp={() => moveGroup(index, -1)}
                          onMoveDown={() => moveGroup(index, 1)}
                          onDelete={() => void handleDeleteGroup(group.id)}
                          onAddCard={() => handleAddCard(group.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          )}

          {groups.length > 0 ? (
            <div className="space-y-5">
              {groupedCards.map(({ group, cards }, groupIdx) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                      {groupTitle(group, locale) || t('project.untitledGroup')}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={t('project.moveGroupUp', { name: groupTitle(group, locale) || t('project.untitledGroup') })}
                        disabled={groupIdx === 0}
                        onClick={() => moveGroup(groupIdx, -1)}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('project.moveGroupDown', { name: groupTitle(group, locale) || t('project.untitledGroup') })}
                        disabled={groupIdx === groups.length - 1}
                        onClick={() => moveGroup(groupIdx, 1)}
                        className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <DndContext
                    id={`dnd-cards-${group.id}`}
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleCardDragEnd(group.id, cards, e)}
                  >
                    <SortableContext
                      items={cards.map((c: any) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {cards.map((proj: any, idx: number) => (
                          <SortableProjectRow
                            key={proj.id}
                            proj={proj}
                            index={idx}
                            total={cards.length}
                            onMoveUp={() => moveCardInGroup(group.id, cards, idx, -1)}
                            onMoveDown={() => moveCardInGroup(group.id, cards, idx, 1)}
                            onEdit={() => { setEditingItem(proj); setEditingIndex(null) }}
                            onDelete={() => void handleDeleteCard(proj.id)}
                          />
                        ))}
                        {cards.length === 0 && (
                          <p className="rounded-lg border border-dashed border-[var(--color-border)] py-3 text-center text-[10px] text-[var(--color-text-muted)]">
                            {t('project.emptyGroup')}
                          </p>
                        )}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              ))}

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('project.ungrouped')}
                </p>
                <DndContext
                  id="dnd-cards-ungrouped"
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleCardDragEnd(null, ungroupedCards, e)}
                >
                  <SortableContext
                    items={ungroupedCards.map((c: any) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {ungroupedCards.map((proj: any, idx: number) => (
                        <SortableProjectRow
                          key={proj.id}
                          proj={proj}
                          index={idx}
                          total={ungroupedCards.length}
                          onMoveUp={() => moveCardInGroup(null, ungroupedCards, idx, -1)}
                          onMoveDown={() => moveCardInGroup(null, ungroupedCards, idx, 1)}
                          onEdit={() => { setEditingItem(proj); setEditingIndex(null) }}
                          onDelete={() => void handleDeleteCard(proj.id)}
                        />
                      ))}
                      {ungroupedCards.length === 0 && (
                        <p className="rounded-lg border border-dashed border-[var(--color-border)] py-3 text-center text-[10px] text-[var(--color-text-muted)]">
                          {t('empty.projects')}
                        </p>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          ) : (
            <DndContext
              id="dnd-cards-flat"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleCardDragEnd(null, projects, e)}
            >
              <SortableContext
                items={projects.map((c: any) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {projects.map((proj: any, idx: number) => (
                    <SortableProjectRow
                      key={proj.id}
                      proj={proj}
                      index={idx}
                      total={projects.length}
                      onMoveUp={() => moveCardInGroup(null, projects, idx, -1)}
                      onMoveDown={() => moveCardInGroup(null, projects, idx, 1)}
                      onEdit={() => { setEditingItem(proj); setEditingIndex(null) }}
                      onDelete={() => void handleDeleteCard(proj.id)}
                    />
                  ))}
                  {projects.length === 0 && (
                    <p className="py-8 text-center text-xs text-[var(--color-text-muted)]">
                      {t('empty.projects')}
                    </p>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
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
