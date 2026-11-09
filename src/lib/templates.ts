// Shared, dependency-free template identity helpers. Kept in a tiny module so
// neither the client bundle nor the server rendering path pulls the template
// components while resolving a plain string.
export const TEMPLATE_IDS = ['classic', 'editorial-marketing'] as const
export type TemplateId = (typeof TEMPLATE_IDS)[number]

export const DEFAULT_TEMPLATE_ID: TemplateId = 'classic'

export const EDITORIAL_TEMPLATE_ID: TemplateId = 'editorial-marketing'

export function resolveTemplateId(value: unknown): TemplateId {
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    if (lower === 'classic') return 'classic'
    if (lower === 'editorial-marketing' || lower === 'editorialmarketing' || lower === 'editorial') {
      return 'editorial-marketing'
    }
  }
  return DEFAULT_TEMPLATE_ID
}

export function resolveTemplateFromAppearance(appearance: any): TemplateId {
  const a = appearance as Record<string, unknown> | null | undefined
  if (!a) return DEFAULT_TEMPLATE_ID
  // Explicit template key only. Legacy `theme` values (e.g. `warm`) are Classic
  // color themes — mapping them here would silently change the public look of
  // existing Classic customers, so they never select a template.
  if (typeof a['template'] === 'string') return resolveTemplateId(a['template'])
  return DEFAULT_TEMPLATE_ID
}

/** Preview-only override resolution. The saved appearance is never mutated. */
export function resolvePreviewTemplateId(
  appearance: unknown,
  override: TemplateId | null | undefined,
): TemplateId {
  return override ?? resolveTemplateFromAppearance(appearance)
}
