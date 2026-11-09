/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { memo, useEffect, useState, type ComponentType } from 'react'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'
import { getPortfolioLang } from '@/lib/portfolio-language'
import { resolvePreviewTemplateId, type TemplateId } from '@/lib/templates'

// Rendered inline (no iframe) inside a fixed-width preview box. The template
// switches to container-query breakpoints (`cq-md:` …), so its layout follows
// the box width rather than the browser window. `transform` + `contain:
// paint` also make this wrapper the containing block for the template's
// `fixed` nav/bottom-bar/lightbox, keeping them inside the frame.
function LivePreviewImpl({
  profile,
  isFree = false,
  onThemeChange,
  templateOverride,
}: {
  profile: any
  isFree?: boolean
  onThemeChange?: (mode: 'light' | 'dark') => void
  // Preview-only template selection (never persisted): the builder passes
  // `null` while browsing so the SAVED `appearance.template` resolves.
  templateOverride?: TemplateId | null
}) {
  const appearance = profile?.appearance || {}
  const isAr = getPortfolioLang(appearance) === 'ar'
  const templateId = resolvePreviewTemplateId(appearance, templateOverride)

  // The editorial implementation is code-split: its chunk (Playfair Display +
  // scoped CSS) loads only when the editorial look is actually previewed.
  // Classic stays statically imported because it is the default template.
  const [Editorial, setEditorial] = useState<ComponentType<{
    profile: any
    isFree?: boolean
    preview?: boolean
    onThemeChange?: (mode: 'light' | 'dark') => void
  }> | null>(null)

  useEffect(() => {
    if (templateId !== 'editorial-marketing') return
    let cancelled = false
    import('@/components/portfolio/templates/EditorialMarketingTemplate').then(
      (mod) => {
        if (!cancelled) setEditorial(() => mod.EditorialMarketingTemplate)
      },
    )
    return () => {
      cancelled = true
    }
  }, [templateId])

  return (
    <div
      className="@container relative w-full h-full overflow-hidden isolate"
      style={{ transform: 'translateZ(0)', contain: 'paint' }}
      data-builder-preview-surface={
        process.env.NODE_ENV === 'production' ? undefined : ''
      }
      data-builder-preview-template={
        process.env.NODE_ENV === 'production' ? undefined : templateId
      }
    >
      <div
        data-preview-scroll
        className="w-full h-full overflow-y-auto scrollbar-thin scroll-smooth cq-md:[scroll-padding-top:5rem]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {templateId === 'editorial-marketing' && Editorial ? (
          <Editorial
            key={`editorial-${profile?.username || 'preview'}`}
            profile={profile}
            isFree={isFree}
            preview
            onThemeChange={onThemeChange}
          />
        ) : (
          <ClassicTemplate
            key={`classic-${profile?.username || 'preview'}`}
            profile={profile}
            isFree={isFree}
            preview
            onThemeChange={onThemeChange}
          />
        )}
      </div>
    </div>
  )
}

// The deferred profile reference is the only thing that should re-render the
// (very large) template; form state changes in the builder must not.
export const LivePreview = memo(
  LivePreviewImpl,
  (prev, next) =>
    prev.profile === next.profile &&
    prev.isFree === next.isFree &&
    prev.onThemeChange === next.onThemeChange &&
    prev.templateOverride === next.templateOverride
)
