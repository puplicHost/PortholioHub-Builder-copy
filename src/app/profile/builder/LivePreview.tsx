/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { memo } from 'react'
import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'
import { getPortfolioLang } from '@/lib/portfolio-language'

// Rendered inline (no iframe) inside a fixed-width preview box. The template
// switches to container-query breakpoints (`cq-md:` …), so its layout follows
// the box width rather than the browser window. `transform` + `contain:
// paint` also make this wrapper the containing block for the template's
// `fixed` nav/bottom-bar/lightbox, keeping them inside the frame.
function LivePreviewImpl({
  profile,
  isFree = false,
  onThemeChange,
}: {
  profile: any
  isFree?: boolean
  onThemeChange?: (mode: 'light' | 'dark') => void
}) {
  const isAr = getPortfolioLang(profile?.appearance) === 'ar'
  return (
    <div
      className="@container relative w-full h-full overflow-hidden isolate"
      style={{ transform: 'translateZ(0)', contain: 'paint' }}
    >
      <div
        data-preview-scroll
        className="w-full h-full overflow-y-auto scrollbar-thin scroll-smooth cq-md:[scroll-padding-top:5rem]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <ClassicTemplate
          profile={profile}
          isFree={isFree}
          preview
          onThemeChange={onThemeChange}
        />
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
    prev.onThemeChange === next.onThemeChange
)
