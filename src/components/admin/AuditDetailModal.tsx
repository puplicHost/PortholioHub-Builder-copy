'use client'

import { useState } from 'react'
import { Eye, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AdminModal } from './AdminModal'

interface AuditDetailModalProps {
  id: string
  action: string
  adminEmail: string
  target: string
  reason?: string | null
  metadata?: unknown
  createdAt: string
}

export function AuditDetailModal({
  action,
  adminEmail,
  target,
  reason,
  metadata,
  createdAt,
}: AuditDetailModalProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const jsonString = metadata ? JSON.stringify(metadata, null, 2) : null

  const copyMetadata = async () => {
    if (!jsonString) return
    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      toast('success', 'Metadata copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast('error', 'Failed to copy')
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-secondary)] truncate max-w-[200px]">
          {reason || (jsonString ? 'Has metadata' : '—')}
        </span>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] transition-colors cursor-pointer shrink-0"
        >
          <Eye className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
          View event
        </button>
      </div>

      <AdminModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Audit event details"
        description={`Recorded on ${new Date(createdAt).toLocaleString()}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs bg-[var(--color-surface-secondary)] p-3.5 rounded-lg border border-[var(--color-border)]">
            <div>
              <p className="text-[var(--color-text-muted)] font-medium">Action</p>
              <code className="font-mono font-bold text-[var(--color-text-primary)]">{action}</code>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] font-medium">Admin</p>
              <p className="font-medium text-[var(--color-text-primary)]">{adminEmail}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] font-medium">Target</p>
              <p className="font-medium text-[var(--color-text-primary)]">{target}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] font-medium">Timestamp</p>
              <p className="text-[var(--color-text-primary)]">{new Date(createdAt).toLocaleString()}</p>
            </div>
          </div>

          {reason && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Reason or note:</p>
              <p className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] p-3 rounded-lg text-[var(--color-text-primary)]">
                {reason}
              </p>
            </div>
          )}

          {jsonString ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">Event metadata (JSON):</p>
                <Button variant="ghost" size="sm" onClick={copyMetadata} className="h-7 text-xs px-2">
                  {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>
              <pre className="max-h-60 overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3 text-[11px] font-mono text-[var(--color-text-primary)] leading-relaxed">
                {jsonString}
              </pre>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)] italic">No additional metadata recorded with this event.</p>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </AdminModal>
    </>
  )
}
