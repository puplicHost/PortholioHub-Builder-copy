'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { AdminModal, AdminConfirmModal } from './AdminModal'
import { StatusBadge } from './StatusBadge'

export interface AnnouncementItem {
  id: string
  title: string
  body: string
  type: string
  active: boolean
  targetAudience: string
  dismissible: boolean
  startsAt: string | Date
  expiresAt: string | Date | null
  createdAt: string | Date
}

interface AnnouncementManagerProps {
  initialAnnouncements: AnnouncementItem[]
}

export function AnnouncementManager({ initialAnnouncements }: AnnouncementManagerProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<AnnouncementItem | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('INFO')
  const [targetAudience, setTargetAudience] = useState('ALL')
  const [active, setActive] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')

  const openCreateModal = () => {
    setTitle('')
    setBody('')
    setType('INFO')
    setTargetAudience('ALL')
    setActive(true)
    setExpiresAt('')
    setCreateOpen(true)
  }

  const openEditModal = (item: AnnouncementItem) => {
    setEditItem(item)
    setTitle(item.title)
    setBody(item.body)
    setType(item.type)
    setTargetAudience(item.targetAudience)
    setActive(item.active)
    setExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : '')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          targetAudience,
          active,
          expiresAt: expiresAt || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to create announcement')
        return
      }
      toast('success', 'Announcement published successfully')
      setCreateOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error creating announcement')
    } finally {
      setBusy(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/announcements/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          type,
          targetAudience,
          active,
          expiresAt: expiresAt || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to update announcement')
        return
      }
      toast('success', 'Announcement updated successfully')
      setEditItem(null)
      router.refresh()
    } catch {
      toast('error', 'Network error updating announcement')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (item: AnnouncementItem) => {
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      })
      if (!res.ok) {
        toast('error', 'Failed to toggle status')
        return
      }
      toast('success', item.active ? 'Announcement deactivated' : 'Announcement activated')
      router.refresh()
    } catch {
      toast('error', 'Network error toggling status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/announcements/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast('error', 'Failed to delete announcement')
        return
      }
      toast('success', 'Announcement deleted')
      setDeleteId(null)
      router.refresh()
    } catch {
      toast('error', 'Network error deleting announcement')
    } finally {
      setBusy(false)
    }
  }

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-purple-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          {initialAnnouncements.length} announcement{initialAnnouncements.length === 1 ? '' : 's'} broadcasted
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Announcement</span>
        </Button>
      </div>

      {initialAnnouncements.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Megaphone className="h-10 w-10 text-[var(--color-text-muted)] mx-auto opacity-60" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            No system announcements
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto">
            Broadcast important platform updates, scheduled maintenance, new features, or promotional notices to your users.
          </p>
          <Button variant="secondary" size="sm" onClick={openCreateModal} className="mt-2">
            Create First Announcement
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {initialAnnouncements.map((item) => (
            <Card
              key={item.id}
              className={`p-4 transition-all ${
                item.active
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-[var(--color-border)]/60 bg-[var(--color-surface-secondary)]/30 opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                      {getTypeIcon(item.type)}
                      <span>{item.type}</span>
                    </span>
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <StatusBadge status={item.active ? 'ACTIVE' : 'EXPIRED'} size="sm" />
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-muted)] pt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Audience: <strong className="text-[var(--color-text-primary)]">{item.targetAudience}</strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    {item.expiresAt && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleActive(item)}
                    className="text-xs"
                  >
                    {item.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(item)}
                    className="p-2"
                    aria-label="Edit announcement"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(item.id)}
                    className="p-2"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AdminModal
        isOpen={createOpen}
        onClose={() => !busy && setCreateOpen(false)}
        title="Create Platform Announcement"
        description="Broadcast a banner notification to users across their dashboard and portfolio builder."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled maintenance this Friday at 2 AM"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">
              Message Body
            </label>
            <textarea
              required
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Provide clear details and next steps for creators..."
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Notification Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="INFO">INFO (General announcement)</option>
                <option value="WARNING">WARNING (Action required)</option>
                <option value="SUCCESS">SUCCESS (New feature / milestone)</option>
                <option value="MAINTENANCE">MAINTENANCE (System downtime)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="ALL">ALL (Every visitor & user)</option>
                <option value="SUBSCRIBERS">SUBSCRIBERS (Paid accounts only)</option>
                <option value="FREE">FREE (Free tier users)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Expiration Date (Optional)
              </label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="create-active-cb"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
              <label
                htmlFor="create-active-cb"
                className="text-xs font-medium text-[var(--color-text-primary)] cursor-pointer"
              >
                Publish immediately (Active)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={busy}>
              Publish Announcement
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Edit Modal */}
      <AdminModal
        isOpen={Boolean(editItem)}
        onClose={() => !busy && setEditItem(null)}
        title="Edit Announcement"
        description="Update announcement copy, visibility, or audience settings."
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-primary)]">
              Message Body
            </label>
            <textarea
              required
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Notification Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="ALL">ALL</option>
                <option value="SUBSCRIBERS">SUBSCRIBERS</option>
                <option value="FREE">FREE</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-primary)]">
                Expiration Date
              </label>
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id="edit-active-cb"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
              />
              <label
                htmlFor="edit-active-cb"
                className="text-xs font-medium text-[var(--color-text-primary)] cursor-pointer"
              >
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => setEditItem(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={busy}>
              Save Changes
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => !busy && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? It will be permanently removed from all user interfaces."
        confirmText="Delete announcement"
        variant="danger"
        loading={busy}
      />
    </div>
  )
}
