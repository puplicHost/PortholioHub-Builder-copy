'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Pencil, Trash2, Gift, Mail, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AdminModal, AdminConfirmModal } from './AdminModal'

export interface PlanOption {
  id: string
  name: string
  priceEgp: number
  durationDays?: number | null
}

interface UserActionsProps {
  userId: string
  status: string
  userEmail: string
  displayName?: string | null
  phone?: string | null
  isAdmin?: boolean
  availablePlans?: PlanOption[]
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: string }> = {
  notice: {
    subject: 'Important account notice regarding your PortfolioHub profile',
    body: 'Hello,\n\nWe are reaching out regarding your account on PortfolioHub. Please review your account settings and contact support if you need assistance.\n\nBest regards,\nThe PortfolioHub Team',
  },
  payment: {
    subject: 'Subscription renewal & payment reminder',
    body: 'Hello,\n\nThis is a friendly reminder that your PortfolioHub subscription is due for renewal. To ensure uninterrupted service for your portfolio, please complete the transfer.\n\nBest regards,\nThe PortfolioHub Team',
  },
  custom: {
    subject: '',
    body: '',
  },
}

export function UserActions({
  userId,
  status,
  userEmail,
  displayName,
  phone,
  isAdmin = false,
  availablePlans = [],
}: UserActionsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [busy, setBusy] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Modals state
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [unsuspendOpen, setUnsuspendOpen] = useState(false)
  const [resetPassOpen, setResetPassOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')

  // Edit details state
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(displayName || '')
  const [editEmail, setEditEmail] = useState(userEmail || '')
  const [editPhone, setEditPhone] = useState(phone || '')
  const [editIsAdmin, setEditIsAdmin] = useState(isAdmin)

  // Grant subscription state
  const [grantOpen, setGrantOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState(availablePlans[0]?.id || '')
  const [grantDuration, setGrantDuration] = useState('30')
  const [grantNote, setGrantNote] = useState('')

  // Send email state
  const [emailOpen, setEmailOpen] = useState(false)
  const [templateKey, setTemplateKey] = useState('notice')
  const [emailSubject, setEmailSubject] = useState(EMAIL_TEMPLATES.notice.subject)
  const [emailBody, setEmailBody] = useState(EMAIL_TEMPLATES.notice.body)

  const call = async (action: string, options?: Record<string, unknown>, successMsg?: string) => {
    setBusy(action)
    setTempPassword(null)
    setCopied(false)
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Action failed')
        return false
      }
      if (data?.tempPassword) {
        setTempPassword(data.tempPassword)
      }
      toast('success', successMsg || 'Action completed successfully')
      router.refresh()
      return true
    } catch {
      toast('error', 'Network error while executing action')
      return false
    } finally {
      setBusy(null)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy('edit')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          isAdmin: editIsAdmin,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to update user details')
        return
      }
      toast('success', 'User details updated successfully')
      setEditOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error updating user')
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (deleteInput.trim().toLowerCase() !== userEmail.trim().toLowerCase()) {
      toast('error', 'Please enter the exact email address to confirm deletion')
      return
    }

    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to delete user account')
        return
      }
      toast('success', 'User deleted permanently')
      setDeleteOpen(false)
      router.push('/admin/users')
    } catch {
      toast('error', 'Network error during account deletion')
    } finally {
      setBusy(null)
    }
  }

  const handleGrantSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlanId) {
      toast('error', 'Please select a plan')
      return
    }
    const days = Number(grantDuration)
    if (!Number.isFinite(days) || days < 1) {
      toast('error', 'Duration must be at least 1 day')
      return
    }

    setBusy('grant')
    try {
      const res = await fetch(`/api/admin/users/${userId}/grant-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          durationDays: days,
          note: grantNote.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to grant subscription')
        return
      }
      toast('success', 'Subscription granted successfully')
      setGrantOpen(false)
      setGrantNote('')
      router.refresh()
    } catch {
      toast('error', 'Network error granting subscription')
    } finally {
      setBusy(null)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailSubject.trim()) {
      toast('error', 'Subject is required')
      return
    }
    if (!emailBody.trim()) {
      toast('error', 'Message body is required')
      return
    }

    setBusy('email')
    try {
      const res = await fetch(`/api/admin/users/${userId}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject.trim(),
          bodyText: emailBody.trim(),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        toast('error', data?.message || 'Failed to send email')
        return
      }
      toast('success', 'Email sent and logged in audit history')
      setEmailOpen(false)
      router.refresh()
    } catch {
      toast('error', 'Network error sending email')
    } finally {
      setBusy(null)
    }
  }

  const copyPassword = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      toast('success', 'Temporary password copied to clipboard')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast('error', 'Failed to copy to clipboard')
    }
  }

  return (
    <div className="space-y-4">
      {/* Primary administrative action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          title="Edit user profile, contact info, and admin role"
          disabled={busy !== null}
          onClick={() => {
            setEditName(displayName || '')
            setEditEmail(userEmail || '')
            setEditPhone(phone || '')
            setEditIsAdmin(isAdmin)
            setEditOpen(true)
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit details
        </Button>

        <Button
          variant="secondary"
          size="sm"
          title="Grant complementary or manual subscription plan"
          disabled={busy !== null}
          onClick={() => {
            if (availablePlans.length > 0 && !selectedPlanId) {
              setSelectedPlanId(availablePlans[0].id)
            }
            setGrantOpen(true)
          }}
        >
          <Gift className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          Grant subscription
        </Button>

        <Button
          variant="secondary"
          size="sm"
          title="Send email notification or custom message to user"
          disabled={busy !== null}
          onClick={() => setEmailOpen(true)}
        >
          <Mail className="h-3.5 w-3.5" />
          Send email
        </Button>

        {status === 'SUSPENDED' ? (
          <Button
            variant="secondary"
            size="sm"
            title="Restore account access and activate user"
            disabled={busy !== null}
            onClick={() => setUnsuspendOpen(true)}
          >
            Unsuspend user
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            title="Suspend user account and block access"
            disabled={busy !== null}
            onClick={() => setSuspendOpen(true)}
          >
            Suspend user
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          title="Generate temporary one-time password"
          disabled={busy !== null}
          onClick={() => setResetPassOpen(true)}
        >
          Reset password
        </Button>

        <Button
          variant="secondary"
          size="sm"
          title="Invalidate all active sessions and sign user out"
          disabled={busy !== null}
          onClick={() => setRevokeOpen(true)}
        >
          Revoke sessions
        </Button>

        <Button
          variant="danger"
          size="sm"
          title="Permanently remove user account and all data"
          disabled={busy !== null}
          onClick={() => {
            setDeleteInput('')
            setDeleteOpen(true)
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete account
        </Button>
      </div>

      {tempPassword && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4 space-y-2">
          <p className="text-xs text-[var(--color-text-muted)] font-medium">
            Temporary password generated (shown once — copy and share with user):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono font-bold text-sm bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 rounded-md select-all text-[var(--color-primary)]">
              {tempPassword}
            </code>
            <Button variant="secondary" size="sm" onClick={copyPassword}>
              {copied ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Edit User Details Modal */}
      <AdminModal
        isOpen={editOpen}
        onClose={() => !busy && setEditOpen(false)}
        title="Edit user details"
        description="Update profile information, contact email, and administrative status."
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Display name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Ahmed Ali"
          />
          <Input
            label="Email address"
            type="email"
            required
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            placeholder="user@example.com"
          />
          <Input
            label="Phone number"
            type="tel"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="+201001234567"
          />
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="edit-is-admin"
              checked={editIsAdmin}
              onChange={(e) => setEditIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
            />
            <label htmlFor="edit-is-admin" className="text-xs font-medium text-[var(--color-text-primary)] cursor-pointer">
              Grant administrator privileges
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={busy === 'edit'}>
              Save changes
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Grant Subscription Modal */}
      <AdminModal
        isOpen={grantOpen}
        onClose={() => !busy && setGrantOpen(false)}
        title="Grant free subscription"
        description="Manually activate a subscription tier for this user without requiring payment."
      >
        <form onSubmit={handleGrantSubscription} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Subscription plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {availablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.priceEgp} EGP value)
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Duration (days)"
            type="number"
            min={1}
            max={3650}
            required
            value={grantDuration}
            onChange={(e) => setGrantDuration(e.target.value)}
            placeholder="e.g. 30"
          />
          <Input
            label="Internal note (recorded in audit log)"
            value={grantNote}
            onChange={(e) => setGrantNote(e.target.value)}
            placeholder="e.g. Customer support courtesy grant, partner promo..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setGrantOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={busy === 'grant'}>
              Grant subscription
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Send Email Modal */}
      <AdminModal
        isOpen={emailOpen}
        onClose={() => !busy && setEmailOpen(false)}
        title="Send email to user"
        description={`Send a formal notification to ${userEmail}. Logged in the audit trail.`}
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Message template</label>
            <select
              value={templateKey}
              onChange={(e) => {
                const key = e.target.value
                setTemplateKey(key)
                if (EMAIL_TEMPLATES[key]) {
                  setEmailSubject(EMAIL_TEMPLATES[key].subject)
                  setEmailBody(EMAIL_TEMPLATES[key].body)
                }
              }}
              className="w-full rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="notice">Account Notice (General)</option>
              <option value="payment">Payment & Renewal Reminder</option>
              <option value="custom">Custom Email</option>
            </select>
          </div>
          <Input
            label="Subject"
            required
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Email subject line..."
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]">Message body</label>
            <textarea
              required
              rows={5}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write message to the user..."
              className="w-full rounded-[14px] bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setEmailOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={busy === 'email'}>
              Send email
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Delete User Account Danger Modal */}
      <AdminModal
        isOpen={deleteOpen}
        onClose={() => !busy && setDeleteOpen(false)}
        title="Delete user account"
        description="Permanently remove this user and all associated records."
        maxWidth="sm"
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-3 text-[var(--color-danger)]">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Irreversible action</p>
              <p className="leading-relaxed">
                This will permanently delete <span className="font-bold underline">{userEmail}</span> along with all their
                portfolios, subscriptions, uploaded media, and payment records.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-[var(--color-text-secondary)]">
              To confirm, type the user's email: <strong className="select-all text-[var(--color-text-primary)]">{userEmail}</strong>
            </label>
            <Input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={userEmail}
              className="font-mono text-xs"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={deleteInput.trim().toLowerCase() !== userEmail.trim().toLowerCase()}
              loading={busy === 'delete'}
            >
              Permanently delete user
            </Button>
          </div>
        </form>
      </AdminModal>

      {/* Suspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={suspendOpen}
        onClose={() => !busy && setSuspendOpen(false)}
        onConfirm={async () => {
          await call('suspend', {}, 'User has been suspended')
          setSuspendOpen(false)
        }}
        title="Suspend user account"
        description="Are you sure you want to suspend this user? They will be immediately blocked from signing in and accessing their dashboard."
        confirmText="Suspend account"
        variant="danger"
        loading={busy === 'suspend'}
      />

      {/* Unsuspend Confirmation Modal */}
      <AdminConfirmModal
        isOpen={unsuspendOpen}
        onClose={() => !busy && setUnsuspendOpen(false)}
        onConfirm={async () => {
          await call('unsuspend', {}, 'User account restored to active')
          setUnsuspendOpen(false)
        }}
        title="Unsuspend user account"
        description="Restore this user account back to active status? They will be able to sign in normally."
        confirmText="Restore account"
        variant="primary"
        loading={busy === 'unsuspend'}
      />

      {/* Reset Password Confirmation Modal */}
      <AdminConfirmModal
        isOpen={resetPassOpen}
        onClose={() => !busy && setResetPassOpen(false)}
        onConfirm={async () => {
          await call('reset-password', {}, 'Password reset successfully')
          setResetPassOpen(false)
        }}
        title="Reset user password"
        description="Reset this user's password? A temporary password will be generated and shown once. The user will be required to change it on their next sign-in."
        confirmText="Generate temporary password"
        variant="primary"
        loading={busy === 'reset-password'}
      />

      {/* Revoke Sessions Confirmation Modal */}
      <AdminConfirmModal
        isOpen={revokeOpen}
        onClose={() => !busy && setRevokeOpen(false)}
        onConfirm={async () => {
          await call('revoke-sessions', {}, 'All active sessions have been revoked')
          setRevokeOpen(false)
        }}
        title="Revoke all sessions"
        description="Are you sure you want to log this user out of all devices? All active browser sessions and tokens will be invalidated."
        confirmText="Revoke all sessions"
        variant="danger"
        loading={busy === 'revoke-sessions'}
      />
    </div>
  )
}
