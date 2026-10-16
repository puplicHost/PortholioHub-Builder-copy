import { prisma } from '@/lib/prisma'
import { SETTING_KEYS, getSettings } from '@/lib/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'
import { MaintenanceToggle } from '@/components/admin/MaintenanceToggle'

export const metadata = {
  title: 'Settings | Admin',
}

const DESCRIPTIONS: Record<string, string> = {
  'platform.name': 'Platform display name (shown across site and metadata)',
  'contact.whatsapp': 'WhatsApp number in international format (e.g. +201001234567)',
  'contact.phone': 'Public contact phone for freelancer support',
  'subscription.graceDays': 'Grace days allowed after plan expiry before access is revoked',
  'subscription.reminderDays': 'Days before expiry to send automated renewal alerts (e.g. 7, 3)',
}

export default async function AdminSettingsPage() {
  const [values, maintenanceSetting] = await Promise.all([
    getSettings(SETTING_KEYS),
    prisma.systemSetting.findUnique({
      where: { key: 'platform.maintenanceMode' },
    }),
  ])

  const items = SETTING_KEYS.map((key) => ({
    key,
    value: values[key],
    description: DESCRIPTIONS[key] || '',
  }))

  const isMaintenance = Boolean(
    maintenanceSetting?.value === true || maintenanceSetting?.value === 'true'
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          System settings
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Configure platform-wide branding, subscription policies, and emergency maintenance.
        </p>
      </div>

      {/* Emergency Platform Maintenance Switch */}
      <MaintenanceToggle initialEnabled={isMaintenance} />

      {/* Configuration Setting Groups */}
      <SettingsForm items={items} />
    </div>
  )
}
