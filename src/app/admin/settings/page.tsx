import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { MaintenanceToggle } from '@/components/admin/MaintenanceToggle'

export const metadata = {
  title: 'Settings | Admin',
}

const SETTING_KEYS = [
  'contact.whatsapp',
  'contact.email',
  'contact.facebook',
  'contact.instagram',
  'contact.linkedin',
  'contact.twitter',
  'platform.name',
  'subscription.graceDays',
] as const

export default async function AdminSettingsPage() {
  const [values, maintenanceSetting, plans] = await Promise.all([
    getSettings([...SETTING_KEYS]),
    prisma.systemSetting.findUnique({
      where: { key: 'platform.maintenanceMode' },
    }),
    prisma.plan.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, priceEgp: true, durationDays: true, isActive: true },
    }),
  ])

  const items = SETTING_KEYS.map((key) => ({ key, value: values[key] }))

  const isMaintenance = Boolean(
    maintenanceSetting?.value === true || maintenanceSetting?.value === 'true'
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          الإعدادات
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          معلومات التواصل، الباقات، وإعدادات المنصة.
        </p>
      </div>

      {/* Emergency Platform Maintenance Switch */}
      <MaintenanceToggle initialEnabled={isMaintenance} />

      {/* Grouped settings + plans */}
      <SettingsForm
        items={items}
        plans={plans.map((p) => ({
          id: p.id,
          name: typeof p.name === 'string' ? p.name : p.id,
          priceEgp: p.priceEgp,
          durationDays: p.durationDays ?? 30,
          isActive: p.isActive,
        }))}
      />
    </div>
  )
}
