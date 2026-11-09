/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { resolveProjectCardDestination } from '@/lib/project-card-links'
import { resolvePreviewTemplateId, type TemplateId } from '@/lib/templates'

/**
 * LOCAL-DEVELOPMENT DIAGNOSTIC ONLY.
 *
 * Mirrors the exact card object currently being edited in ProjectManager and
 * the actual resolver/CTA decision used by Classic/Editorial. BuilderClient
 * mounts this only when `process.env.NODE_ENV !== 'production'` and only
 * forwards editor state in that build, so no production customer ever sees it.
 */
export function ProjectCardDiagnostics({
  card,
  profile,
  isFree,
  previewTemplateId,
  previewProfile,
  isDirty,
  saveStatus,
  showPanel = true,
}: {
  card: any | null
  profile: any
  isFree: boolean
  previewTemplateId: TemplateId | null
  previewProfile: any
  isDirty: boolean
  saveStatus: string
  /** Keep the diagnostic effects/logs running while hiding the visual panel. */
  showPanel?: boolean
}) {
  const isProduction = process.env.NODE_ENV === 'production'
  const templateId = resolvePreviewTemplateId(profile?.appearance, previewTemplateId)

  const pageList = Array.isArray(profile?.projectPages) ? profile.projectPages : []
  const previewPageList = Array.isArray(previewProfile?.projectPages)
    ? previewProfile.projectPages
    : []

  const resolverOptions = {
    username: profile?.username,
    isFree,
    pages: pageList,
  }
  const destination = card ? resolveProjectCardDestination(card, resolverOptions) : null

  const content =
    card?.content && typeof card.content === 'object' && !Array.isArray(card.content)
      ? card.content
      : {}
  const linkTypeTop = card?.linkType ?? null
  const linkTypeContent = content?.linkType ?? null
  const slugTop = card?.linkedPageSlug ?? null
  const slugContent = content?.linkedPageSlug ?? null
  const rawSlug = slugTop ?? slugContent ?? null
  const candidate =
    typeof rawSlug === 'string' ? rawSlug.trim().replace(/^\/projects\//, '') : ''

  const findTarget = (list: any[]) =>
    candidate
      ? list.find((page: any) => page?.slug === candidate || page?.id === candidate) || null
      : null
  const target = findTarget(pageList)

  const previewCard = card
    ? previewPageList.find(
        (page: any) => page.id === card.id || page.slug === card.slug,
      ) || null
    : null
  const previewResolver = previewCard
    ? resolveProjectCardDestination(previewCard, {
        username: previewProfile?.username,
        isFree,
        pages: previewPageList,
      })
    : null

  const extraHttpLinks = (Array.isArray(card?.items) ? card.items : []).filter((item: any) => {
    const url = typeof item?.externalUrl === 'string' ? item.externalUrl : ''
    return Boolean(item?.title && /^https?:\/\//i.test(url))
  })

  // Mirrors the two template-level decisions verbatim:
  // Classic renders ProjectCardBody.links when hasProjectLinks() is true
  // (destination OR any labelled http item); Editorial renders the main CTA
  // only when destination.href exists.
  const classicHasLinks = Boolean(destination?.href) || extraHttpLinks.length > 0
  const editorialHasHref = Boolean(destination?.href)
  const ctaOwner =
    templateId === 'editorial-marketing'
      ? 'EditorialMarketingTemplate · projectCards → emk__project-link'
      : 'ClassicTemplate · renderGridCard/renderListCard → ProjectCardBody links'
  const ctaVisible = templateId === 'editorial-marketing' ? editorialHasHref : classicHasLinks
  const ctaLabel =
    (typeof card?.linkLabel === 'string' && card.linkLabel.trim()) ||
    (destination?.kind === 'page' ? 'View Project' : '')
  const ctaHref = destination?.href ?? null

  const completelyUnlinked =
    !linkTypeTop && !linkTypeContent && !slugTop && !slugContent && !card?.externalLink
  // `??` in the resolver means an empty top-level slug is NOT nullish: it
  // shadows a valid `content.linkedPageSlug`. Flag it explicitly so the trace
  // distinguishes a stale/cleared top-level field from a missing destination.
  const topLevelEmptySlugShadowsContent =
    slugTop === '' && typeof slugContent === 'string' && slugContent.trim() !== ''
  const topLevelLinkTypeConflictsWithContent =
    Boolean(linkTypeTop) &&
    Boolean(linkTypeContent) &&
    String(linkTypeTop).toLowerCase() !== String(linkTypeContent).toLowerCase()
  const source =
    (linkTypeTop || slugTop) && (linkTypeContent || slugContent)
      ? 'top-level + content mirror'
      : linkTypeTop || slugTop
        ? 'top-level'
        : linkTypeContent || slugContent
          ? 'nested content'
          : completelyUnlinked
            ? 'none (no link fields)'
            : 'external fields only'

  const previewSlug = previewCard?.linkedPageSlug ?? previewCard?.content?.linkedPageSlug ?? null
  const previewLinkType = previewCard?.linkType ?? previewCard?.content?.linkType ?? null
  const stalePreview = Boolean(
    card &&
      (!previewCard ||
        String(previewSlug ?? '') !== String(rawSlug ?? '') ||
        String(previewLinkType ?? '') !== String(linkTypeTop ?? linkTypeContent ?? '') ||
        (previewResolver?.href ?? null) !== (destination?.href ?? null)),
  )

  const hiddenReason = (() => {
    if (!card) return 'no card selected in the editor'
    if (isFree) return 'isFree=true (paid-plan gate suppresses internal page links)'
    if (linkTypeTop === 'none' || (linkTypeTop == null && linkTypeContent === 'none')) {
      return 'linkType is explicitly "none"'
    }
    if (destination) return null
    if (topLevelEmptySlugShadowsContent) {
      return 'top-level linkedPageSlug is "" and shadows content.linkedPageSlug'
    }
    if (!rawSlug) return 'no linkedPageSlug was stored on the editor card'
    if (!target) return 'linked target is absent from profile.projectPages'
    if (target.isPublished === false) return 'linked target has isPublished=false'
    if (!profile?.username) return 'profile.username is missing'
    return 'resolver returned null for the current link fields'
  })()

  const trace = {
    templateId,
    ctaOwner,
    cardId: card?.id ?? null,
    cardTitle: card?.title ?? null,
    source,
    linkType: { top: linkTypeTop, content: linkTypeContent },
    linkedPageSlug: { top: slugTop, content: slugContent, effective: rawSlug },
    topLevelEmptySlugShadowsContent,
    topLevelLinkTypeConflictsWithContent,
    externalLink: card?.externalLink ?? null,
    linkLabel: card?.linkLabel ?? null,
    target: {
      found: Boolean(target),
      id: target?.id ?? null,
      slug: target?.slug ?? null,
      isPublished: target?.isPublished ?? null,
      showInProjects: target?.showInProjects ?? null,
    },
    resolverInput: {
      hasUsername: Boolean(resolverOptions.username),
      isFree,
      pageCount: pageList.length,
    },
    destination,
    ctaVisible,
    classicHasLinks,
    editorialHasHref,
    ctaLabel,
    ctaHref,
    hiddenReason,
    extraHttpLinks: extraHttpLinks.length,
    preview: {
      cardFound: Boolean(previewCard),
      linkType: previewLinkType,
      linkedPageSlug: previewSlug,
      destination: previewResolver,
      stale: stalePreview,
    },
    isDirty,
    saveStatus,
  }

  const [domProbe, setDomProbe] = useState<{
    surfaceFound: boolean
    domTemplate: string | null
    anchorCount: number
    matchingAnchors: number
    text: string | null
    href: string | null
    display: string | null
    visibility: string | null
    opacity: string | null
    pointerEvents: string | null
    width: number | null
    height: number | null
    inPreviewViewport: boolean | null
    hitTest: boolean | null
  }>({
    surfaceFound: false,
    domTemplate: null,
    anchorCount: 0,
    matchingAnchors: 0,
    text: null,
    href: null,
    display: null,
    visibility: null,
    opacity: null,
    pointerEvents: null,
    width: null,
    height: null,
    inPreviewViewport: null,
    hitTest: null,
  })

  // Actual DOM evidence: the panel checks the rendered preview (not a model of
  // it) for an anchor with the computed destination/label. This distinguishes
  // "never rendered" from "rendered but hidden" without touching templates.
  useEffect(() => {
    if (isProduction || typeof document === 'undefined') return
    let frame = 0
    let observer: MutationObserver | null = null
    let surface: Element | null = null

    const probe = () => {
      surface = document.querySelector('[data-builder-preview-surface]')
      if (!surface) {
        setDomProbe((prev) =>
          prev.surfaceFound
            ? { ...prev, surfaceFound: false, matchingAnchors: 0 }
            : prev,
        )
        return
      }
      const anchors = Array.from(surface.querySelectorAll('a')) as HTMLElement[]
      const matching = anchors.filter((anchor) => {
        const href = anchor.getAttribute('href') || ''
        if (ctaHref && href === ctaHref) return true
        const text = (anchor.textContent || '').trim()
        return Boolean(ctaLabel && text.includes(ctaLabel))
      })
      const first = matching[0] || null
      const style = first ? window.getComputedStyle(first) : null
      const rect = first ? first.getBoundingClientRect() : null
      const surfaceRect = surface.getBoundingClientRect()
      const inPreviewViewport = rect
        ? rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > surfaceRect.top &&
          rect.top < surfaceRect.bottom &&
          rect.right > surfaceRect.left &&
          rect.left < surfaceRect.right
        : null
      let hitTest: boolean | null = null
      if (first && rect && inPreviewViewport) {
        const hit = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        )
        hitTest = hit ? first === hit || first.contains(hit) : false
      }
      const next = {
        surfaceFound: true,
        domTemplate: surface.getAttribute('data-builder-preview-template'),
        anchorCount: anchors.length,
        matchingAnchors: matching.length,
        text: first ? (first.textContent || '').trim() : null,
        href: first ? first.getAttribute('href') : null,
        display: style?.display ?? null,
        visibility: style?.visibility ?? null,
        opacity: style?.opacity ?? null,
        pointerEvents: style?.pointerEvents ?? null,
        width: rect ? Math.round(rect.width) : null,
        height: rect ? Math.round(rect.height) : null,
        inPreviewViewport,
        hitTest,
      }
      setDomProbe((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
      )
    }

    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(probe)
    }

    surface = document.querySelector('[data-builder-preview-surface]')
    schedule()
    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(schedule)
      observer.observe(surface || document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['href', 'class', 'style'],
      })
    }
    window.addEventListener('resize', schedule)
    document.addEventListener('scroll', schedule, true)

    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('resize', schedule)
      document.removeEventListener('scroll', schedule, true)
    }
  }, [isProduction, ctaHref, ctaLabel, templateId, card?.id, previewProfile])

  useEffect(() => {
    if (isProduction || typeof console === 'undefined') return
    console.groupCollapsed?.(
      `[portfolio-card-diagnostic] ${trace.cardTitle || trace.cardId || 'none'}`,
    )
    console.log(trace)
    console.groupEnd?.()
    // The individual fields below are the complete observable state; logging
    // `trace` itself would re-fire this effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trace.cardId,
    linkTypeTop,
    linkTypeContent,
    slugTop,
    slugContent,
    trace.destination?.href,
    templateId,
    stalePreview,
    hiddenReason,
    saveStatus,
    isDirty,
  ])

  useEffect(() => {
    if (isProduction || typeof console === 'undefined') return
    console.log('[portfolio-card-diagnostic:dom]', domProbe)
  }, [domProbe, isProduction])

  // The Builder can keep the diagnostics mounted for console tracing while
  // suppressing the visual panel.
  if (isProduction || !showPanel) return null

  const Row = ({ label, value }: { label: string; value: unknown }) => (
    <div className="flex justify-between gap-2">
      <span className="shrink-0 text-[var(--color-text-muted)]">{label}</span>
      <span className="max-w-[210px] break-all text-end font-mono">{String(value)}</span>
    </div>
  )

  return (
    <div className="fixed bottom-3 end-3 z-[60] max-h-[70vh] w-[360px] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border border-amber-500/40 bg-[var(--color-surface)] p-3 text-[11px] text-[var(--color-text-primary)] shadow-xl max-md:bottom-20">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-amber-600">
        Card diagnostics · dev only
      </p>
      <button
        type="button"
        onClick={() => {
          const payload = JSON.stringify({ trace, domProbe }, null, 2)
          void navigator.clipboard?.writeText(payload)
          console.log('[portfolio-card-diagnostic:copy]', payload)
        }}
        className="mb-2 rounded border border-amber-500/40 px-2 py-1 text-[10px] font-semibold text-amber-700 hover:bg-amber-500/10"
      >
        Copy trace
      </button>
      <Row label="Template" value={templateId} />
      <Row label="CTA owner" value={ctaOwner} />
      <Row label="Card" value={card?.title || card?.id || 'none selected'} />
      <Row label="Card id" value={card?.id ?? '—'} />
      <Row label="Source" value={source} />
      <Row label="linkType (top)" value={linkTypeTop ?? '—'} />
      <Row label="linkType (content)" value={linkTypeContent ?? '—'} />
      <Row label="slug (top)" value={slugTop ?? '—'} />
      <Row label="slug (content)" value={slugContent ?? '—'} />
      <Row
        label="Top empty shadows content"
        value={topLevelEmptySlugShadowsContent ? 'yes' : 'no'}
      />
      <Row
        label="Top/content type conflict"
        value={topLevelLinkTypeConflictsWithContent ? 'yes' : 'no'}
      />
      <Row label="External URL" value={card?.externalLink || '—'} />
      <Row label="Target found" value={target ? `yes (${target.slug})` : 'no'} />
      <Row
        label="Target published"
        value={target ? (target.isPublished === false ? 'no' : 'yes') : '—'}
      />
      <Row label="Destination" value={destination?.href || 'null'} />
      <Row label="Destination kind" value={destination?.kind ?? 'null'} />
      <Row label="Project pages loaded" value={pageList.length} />
      <Row label="Is free plan" value={isFree ? 'yes' : 'no'} />
      <Row label="CTA label" value={ctaLabel || '—'} />
      <Row label="CTA href" value={ctaHref || '—'} />
      <Row label="CTA visible" value={ctaVisible ? 'true' : 'false'} />
      <Row label="Classic hasProjectLinks" value={classicHasLinks ? 'true' : 'false'} />
      <Row label="Editorial href" value={editorialHasHref ? 'true' : 'false'} />
      <Row label="Extra http links" value={extraHttpLinks.length} />
      <Row label="Preview card found" value={previewCard ? 'yes' : 'no'} />
      <Row label="Preview slug" value={previewSlug ?? '—'} />
      <Row label="Preview linkType" value={previewLinkType ?? '—'} />
      <Row label="Preview destination" value={previewResolver?.href || 'null'} />
      <Row label="Preview stale" value={stalePreview ? 'yes' : 'no'} />
      <Row label="DOM surface" value={domProbe.surfaceFound ? 'found' : 'not mounted'} />
      <Row label="DOM template" value={domProbe.domTemplate ?? '—'} />
      <Row label="Anchors in preview" value={domProbe.anchorCount} />
      <Row label="Matching anchors" value={domProbe.matchingAnchors} />
      <Row label="DOM text" value={domProbe.text ?? '—'} />
      <Row label="DOM href" value={domProbe.href ?? '—'} />
      <Row
        label="CSS display/vis/op"
        value={`${domProbe.display ?? '—'} / ${domProbe.visibility ?? '—'} / ${domProbe.opacity ?? '—'}`}
      />
      <Row label="Pointer events" value={domProbe.pointerEvents ?? '—'} />
      <Row label="Box (w×h)" value={domProbe.width == null ? '—' : `${domProbe.width}×${domProbe.height}`} />
      <Row
        label="In preview viewport"
        value={domProbe.inPreviewViewport == null ? '—' : domProbe.inPreviewViewport ? 'yes' : 'no'}
      />
      <Row
        label="Hit test"
        value={domProbe.hitTest == null ? '—' : domProbe.hitTest ? 'anchor reachable' : 'covered'}
      />
      <Row label="Dirty / save" value={`${isDirty ? 'dirty' : 'clean'} / ${saveStatus}`} />
      <p className="mt-2 text-[10px] font-semibold text-[var(--color-danger)]">
        Hidden because: {hiddenReason || 'not hidden'}
      </p>
      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
        Values are read from the live editor/preview state; no request is made.
      </p>
    </div>
  )
}
