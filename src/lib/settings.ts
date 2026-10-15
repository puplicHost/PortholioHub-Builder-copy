import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// Platform settings registry (plan Phase 2 §18 / Phase 7 §4).
// Every key has a Zod schema + default; unknown keys are rejected.
// Values stored as JSON in system_settings.
const registry = {
  'platform.name': {
    schema: z.string().trim().min(1).max(120),
    default: 'PortfolioHub',
    description: 'Platform display name',
  },
  'contact.whatsapp': {
    schema: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Invalid WhatsApp number'),
    default: '',
    description: 'WhatsApp number in international format (empty = button hidden)',
  },
  'contact.phone': {
    schema: z.string().trim().max(32),
    default: '',
    description: 'Public contact phone',
  },
  'subscription.graceDays': {
    schema: z.number().int().min(1).max(60),
    default: 15,
    description: 'Grace days after subscription expiry (snapshot per subscription)',
  },
  'subscription.reminderDays': {
    schema: z.array(z.number().int().min(1).max(30)),
    default: [7, 3],
    description: 'Days before expiry to remind the subscriber',
  },
} as const

export type SettingKey = keyof typeof registry
export const SETTING_KEYS = Object.keys(registry) as SettingKey[]

export function getSettingDefault(key: SettingKey): unknown {
  return registry[key].default
}

export function parseSettingValue(key: string, value: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  const entry = (registry as Record<string, { schema: z.ZodTypeAny } | undefined>)[key]
  if (!entry) return { ok: false, error: `Unknown setting: ${key}` }
  const parsed = entry.schema.safeParse(value)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(', ') }
  }
  return { ok: true, value: parsed.data }
}

export async function getSetting(key: SettingKey): Promise<unknown> {
  const row = await prisma.systemSetting.findUnique({ where: { key } }).catch(() => null)
  if (!row || row.value === null || row.value === undefined) return getSettingDefault(key)
  return row.value as unknown
}

export async function getSettings(keys: SettingKey[]): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    out[key] = await getSetting(key)
  }
  return out
}
