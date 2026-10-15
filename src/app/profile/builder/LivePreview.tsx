/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { ClassicTemplate } from '@/components/portfolio/templates/ClassicTemplate'

export function LivePreview({ profile }: { profile: any }) {
  const isAr = profile?.appearance?.defaultLanguage === 'ar'
  return (
    <div
      className="relative w-full h-full overflow-hidden isolate"
      style={{ transform: 'translateZ(0)', contain: 'paint' }}
    >
      <div className="w-full h-full overflow-y-auto scrollbar-thin" dir={isAr ? 'rtl' : 'ltr'}>
        <ClassicTemplate profile={profile} />
      </div>
    </div>
  )
}
