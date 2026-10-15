import { SETTING_KEYS, getSettings } from '@/lib/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'

export const metadata = {
  title: 'Settings | Admin',
}

const DESCRIPTIONS: Record<string, string> = {
  'platform.name': 'Platform display name',
  'contact.whatsapp': 'WhatsApp number in international format (empty = button hidden)',
  'contact.phone': 'Public contact phone',
  'subscription.graceDays': 'Grace days after subscription expiry (snapshot per subscription)',
}

export default async function AdminSettingsPage() {
  const values = await getSettings(SETTING_KEYS)
  const items = SETTING_KEYS.map((key) => ({
    key,
    value: values[key],
    description: DESCRIPTIONS[key] || '',
  }))

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold">Settings</h1>
      <SettingsForm items={items} />
    </div>
  )
}
