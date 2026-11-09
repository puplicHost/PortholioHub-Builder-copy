# Diagnostic Implementation

## Purpose

This phase adds a local-development-only runtime trace for the homepage project-card CTA. It does not change the resolver, persistence normalization, CTA conditions, or either template. The trace reads the same objects the Builder already has in memory and reports both the computed decision and the actual rendered DOM anchor.

## Files changed

| File | Change | Production behavior |
| --- | --- | --- |
| `src/app/profile/builder/ProjectCardDiagnostics.tsx` | New dev-only diagnostic panel, trace object, clipboard copy, and DOM probe. | Never mounted; returns `null` in production. |
| `src/app/profile/builder/ProjectManager.tsx` | Added optional `onEditingCardChange` callback + effect mirroring `editingItem`. | Callback is `undefined` in production, so no state is forwarded. |
| `src/app/profile/builder/BuilderClient.tsx` | Added `CARD_DIAGNOSTICS_ENABLED`, `diagnosticCard` state, wired `ProjectManager`, rendered the panel, passed the exact preview profile/template. | `CARD_DIAGNOSTICS_ENABLED` is `false` in production; no panel and no editor-state mirror. |
| `src/app/profile/builder/LivePreview.tsx` | Added two diagnostic `data-*` attributes to the existing preview surface. | Attributes are `undefined` in production. |

No database, API, dependency, environment, or deployment changes were made.

## Data flow

```
ProjectManager.editingItem
  └─ onEditingCardChange (development only)
       └─ BuilderClient.diagnosticCard
            └─ ProjectCardDiagnostics.card

BuilderClient.profile
  ├─ ProjectCardDiagnostics.profile          (current editor state)
  └─ previewProfile (stripFreePlanSections)
       └─ useDeferredValue
            └─ LivePreview.profile
                 └─ ProjectCardDiagnostics.previewProfile
```

The panel resolves the active template with the same helper the preview uses:

`resolvePreviewTemplateId(profile.appearance, previewTemplateId)`

## What the panel reports

### Raw selected card

- Card id/title
- Source of the link fields: top-level, nested `content`, both, or none
- Top-level and `content.linkType`
- Top-level and `content.linkedPageSlug`
- External URL
- Whether an empty top-level slug is shadowing a content slug
- Whether top-level and content link types conflict
- Whether the card has local changes (`isDirty`) and current save status

### Resolver output

- Current profile page count, username presence, and `isFree`
- Resolver destination (`null` or `{kind, href}`)
- Destination kind
- Target found / target slug / target `isPublished`
- Exact editor card fields used by the resolver

### Template-level decision

- Active template
- Exact CTA owner (Classic `ProjectCardBody` links vs Editorial `emk__project-link`)
- Classic `hasProjectLinks` result
- Editorial `href` result
- CTA label and href
- Why the CTA is hidden, if it is hidden

### Editor / preview comparison

- Whether the edited card exists in the deferred preview profile
- Preview card `linkType` and `linkedPageSlug`
- Preview resolver destination
- Whether the preview is stale relative to the editor

### Actual DOM evidence

The panel queries `[data-builder-preview-surface]` inside the live preview and checks for an anchor whose `href` matches the computed destination or whose text matches the CTA label. It reports:

- Preview surface mounted / not mounted
- Actual template rendered by `LivePreview` (`data-builder-preview-template`)
- Number of anchors in the preview and number matching
- DOM text/href
- `display`, `visibility`, `opacity`, `pointer-events`
- Box width/height
- Whether the anchor intersects the preview viewport
- Hit test (`elementFromPoint`) to detect clipping/overlay

The probe re-runs on preview mutations, scroll, and resize. This distinguishes:

- destination null → CTA was never rendered
- destination valid but no matching anchor → wrong template branch / parent suppression
- matching anchor present but zero size or hidden → CSS/layout defect
- matching anchor present but covered → overlay/stacking defect

## Production safety

- `CARD_DIAGNOSTICS_ENABLED = process.env.NODE_ENV !== 'production'` at module scope in `BuilderClient`.
- The panel is not mounted in production.
- `ProjectManager` receives `onEditingCardChange={undefined}` in production.
- `ProjectCardDiagnostics` also returns `null` when `NODE_ENV === 'production'` as a second guard.
- `LivePreview`'s diagnostic `data-*` attributes are `undefined` in production.
- No network requests, database reads, or extra customer data reads are made.
- The copied trace contains only card linkage fields, target slug/status, template decision, and DOM visibility data. It does not include profile content, contact details, media, or account identifiers.

## Known limitation

The component has not been executed in a real browser during this phase. Browser automation is prohibited and no live customer account was accessed. The panel is ready for the user's manual run; the reports mark observed runtime values as `NOT OBSERVED`.
