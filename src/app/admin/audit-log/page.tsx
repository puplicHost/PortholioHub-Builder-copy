import { prisma } from '@/lib/prisma'
import { parsePagination, buildMeta } from '@/lib/pagination'
import { sanitizeAuditMeta } from '@/lib/audit'
import { DataTable } from '@/components/admin/DataTable'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Audit log | Admin',
}

interface AuditLogPageProps {
  searchParams: Promise<{ actor?: string; action?: string; from?: string; to?: string; page?: string; pageSize?: string }>
}

export default async function AdminAuditLogPage({ searchParams }: AuditLogPageProps) {
  const sp = await searchParams
  const actor = (sp.actor || '').trim()
  const action = (sp.action || '').trim()
  const from = sp.from || ''
  const to = sp.to || ''
  const params = new URLSearchParams()
  if (actor) params.set('actor', actor)
  if (action) params.set('action', action)
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const { page, pageSize, skip, take } = parsePagination(params)

  const createdAt: { gte?: Date; lte?: Date } = {}
  const fromDate = from ? new Date(`${from}T00:00:00`) : null
  const toDate = to ? new Date(`${to}T23:59:59`) : null
  if (fromDate && !Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
  if (toDate && !Number.isNaN(toDate.getTime())) createdAt.lte = toDate

  const where = {
    ...(actor ? { adminId: actor } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: {
        id: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        metadata: true,
        createdAt: true,
        admin: { select: { email: true } },
        targetUser: { select: { email: true } },
      },
    }),
  ])
  const meta = buildMeta(page, pageSize, total)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Audit log</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <Input name="action" defaultValue={action} placeholder="Filter action…" className="max-w-xs" />
        <Input name="from" type="date" defaultValue={from} className="max-w-[180px]" />
        <Input name="to" type="date" defaultValue={to} className="max-w-[180px]" />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>
      <DataTable
        columns={[
          { key: 'when', header: 'When' },
          { key: 'admin', header: 'Admin' },
          { key: 'action', header: 'Action' },
          { key: 'target', header: 'Target' },
          { key: 'detail', header: 'Detail' },
        ]}
        rows={rows.map((r) => ({
          when: new Date(r.createdAt).toLocaleString(),
          admin: r.admin?.email || '—',
          action: <code className="text-xs font-mono">{r.action}</code>,
          target: `${r.targetType}${r.targetUser?.email ? ` · ${r.targetUser.email}` : ''}`,
          detail: (
            <span className="text-xs">
              {[r.reason, JSON.stringify(sanitizeAuditMeta(r.metadata))].filter(Boolean).join(' · ').slice(0, 200) || '—'}
            </span>
          ),
        }))}
        rowKeys={rows.map((r) => r.id)}
        meta={meta}
        basePath="/admin/audit-log"
        params={{ actor, action, from, to }}
        emptyText="No audit entries yet."
      />
    </div>
  )
}
