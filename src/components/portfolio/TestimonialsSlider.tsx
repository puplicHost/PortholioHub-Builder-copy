'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useMounted } from '@/lib/hooks/useMounted'
import { pickLang } from '@/lib/portfolio-language'

interface TestimonialItem {
  id?: string
  name?: string | { en?: string; ar?: string }
  title?: string | { en?: string; ar?: string }
  photoUrl?: string
  text?: { en?: string; ar?: string } | string
  rating?: number
}

// Multi-card slider (3 on desktop, 2 on tablet, 1 on mobile) + Lightbox on click
export function TestimonialsSlider({
  items,
  lang,
}: {
  items: TestimonialItem[]
  lang: 'ar' | 'en'
  accent?: string
}) {
  const [index, setIndex] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const mounted = useMounted()

  // Close lightbox on Escape key & lock body scroll
  useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null)
      }
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIndex])

  // Skip items with no photoUrl
  const list = (items || []).filter(
    (t) => typeof t?.photoUrl === 'string' && t.photoUrl.trim() !== '',
  )
  if (list.length === 0) return null

  const safeIndex = index % list.length

  const go = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + list.length) % list.length)
  }

  // Multi-card shift: track width = list.length * cardWidth.
  // Shifting by 1 card is shifting (100 / list.length)% of the track.
  const offsetPct = (safeIndex * 100) / list.length
  const activeLightboxItem = lightboxIndex !== null ? list[lightboxIndex] : null

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Slider Viewport */}
      <div className="relative mx-auto max-w-5xl overflow-hidden py-4">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(${lang === 'ar' ? offsetPct : -offsetPct}%)`,
          }}
        >
          {list.map((t, i) => {
            const isCenterCard = i === (safeIndex + 1) % list.length

            return (
              <div
                key={t.id || i}
                className="w-full shrink-0 px-2.5 cq-sm:w-1/2 cq-lg:w-1/3"
              >
                <div
                  onClick={() => setLightboxIndex(i)}
                  className={`group cursor-pointer overflow-hidden rounded-2xl bg-slate-900 p-2.5 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:bg-slate-950 ${
                    isCenterCard
                      ? 'ring-1 ring-[var(--color-primary)]/40 brightness-105'
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  title={pickLang(t.name, lang) ? `View ${pickLang(t.name, lang)}` : 'View photo'}
                >
                  <img
                    src={t.photoUrl}
                    alt={pickLang(t.name, lang) || 'Testimonial'}
                    loading="lazy"
                    className="h-[220px] w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      {list.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(lang === 'ar' ? 1 : -1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
            aria-label="Previous testimonial"
          >
            {lang === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <div className="flex gap-1.5">
            {list.map((t, i) => (
              <button
                key={t.id || i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === safeIndex ? 'w-6 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(lang === 'ar' ? -1 : 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer"
            aria-label="Next testimonial"
          >
            {lang === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Lightbox Modal (rendered via Portal to avoid z-index conflicts) */}
      {mounted &&
        activeLightboxItem &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setLightboxIndex(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Testimonial Photo Lightbox"
          >
            <div
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeLightboxItem.photoUrl}
                alt={pickLang(activeLightboxItem.name, lang) || 'Testimonial photo'}
                className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-black/90 cursor-pointer cq-sm:-top-4 cq-sm:-right-4 cq-sm:h-9 cq-sm:w-9"
                aria-label="Close lightbox"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
