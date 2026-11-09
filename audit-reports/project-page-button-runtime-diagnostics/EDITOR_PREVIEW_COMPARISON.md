# Editor / Preview Comparison

## Purpose

This comparison isolates whether the card being edited is the same card, with the same link fields, that the preview actually renders. No live values were available, so every runtime cell is `NOT OBSERVED`.

## Comparison table

| Signal | Editor state (`ProjectManager.editingItem`) | Preview props (`deferredPreviewProfile`) | Actual card component | DOM / CSS |
| --- | --- | --- | --- | --- |
| Card id | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Card title | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| `linkType` | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| `linkedPageSlug` | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| `content.linkType` | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| `content.linkedPageSlug` | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Target exists in `profile.projectPages` | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | — |
| Target `isPublished` | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | — |
| Resolver destination | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | — |
| `hasProjectLinks` / Editorial `href` | — | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| CTA text | — | — | NOT OBSERVED | NOT OBSERVED |
| CTA href | — | — | NOT OBSERVED | NOT OBSERVED |
| `display` / `visibility` / `opacity` | — | — | — | NOT OBSERVED |
| Anchor box / in preview viewport | — | — | — | NOT OBSERVED |
| Hit test | — | — | — | NOT OBSERVED |
| Preview stale vs editor | — | NOT OBSERVED | — | — |

## Exact identity checks the panel performs

1. **Same id or slug**
   `previewCard = previewPageList.find(page => page.id === card.id || page.slug === card.slug)`

2. **Same effective link type**
   Compares `card.linkType` (falling back to `card.content.linkType`) with the preview card's equivalent.

3. **Same effective slug**
   Compares the editor's top-level slug (falling back to content) with the preview card's equivalent.

4. **Same resolver destination**
   Runs `resolveProjectCardDestination` against the current profile and the preview profile, and compares `href`.

5. **Same template**
   `resolvePreviewTemplateId(profile.appearance, previewTemplateId)` is compared with the actual template recorded by `LivePreview` in its `data-builder-preview-template` attribute.

6. **Actual DOM**
   The panel queries the preview surface for an anchor whose href/text matches the expected CTA, then reads computed CSS, geometry, and hit testing.

## Why a mismatch can happen

### Deferred preview state

`BuilderClient` keeps the editor state in `profile` and passes a lower-priority copy to the preview:

```
previewProfile = isFreePlan ? stripLockedSectionsForFree(profile) : profile
deferredPreviewProfile = useDeferredValue(previewProfile)
LivePreview profile={deferredPreviewProfile}
```

The deferral is intentional for typing performance. A one- or two-render lag is expected. A **persistent** `Preview stale: yes` while the editor is idle is the signal that matters.

### Card identity after save

A newly created card uses a temporary client id (`new-...`). The server returns the real id in `savedProjects`. `BuilderClient` remaps `page.id` and `page.linkedPageSlug`, and records `projectIdAliases` so an open editor can follow the real id. The preview card lookup accepts either id or slug, but a remap that changes only the top-level object can still leave the nested `content` mirror stale (see `ROOT_CAUSE.md`, candidate 2).

### Link-field precedence

The resolver reads:

```
rawType = card.linkType || card.content.linkType
rawSlug = card.linkedPageSlug ?? card.content.linkedPageSlug
```

Therefore:

- empty top-level `linkType` falls back to content,
- empty top-level `linkedPageSlug` does **not** fall back (empty is not nullish),
- explicit top-level `none` wins over content.

The panel shows both layers and the derived `Top empty shadows content` flag.

### Preview vs public data

The Builder preview uses the full `profile.projectPages` list (content pages included). The public route uses `projectPages where isPublished:true`. A target that exists in the Builder preview but is filtered out publicly produces:

- Builder: `Target found: yes`, `CTA visible: true`
- Public: `Target found: no`, `Destination: null`, CTA absent

If the public-only failure is observed, the target's publication state or public query is the cause, not the resolver.

## What to record

At each of these points, use `Copy trace` and paste the JSON into the corresponding row of `ACTUAL_RUNTIME_TRACE.md`:

1. Select the card in the Projects section.
2. Choose `Project Page`.
3. Choose the target page.
4. Wait for the preview to settle (one second is enough; do not save yet).
5. Save.
6. Reload the Builder.
7. Open the published public portfolio.

If `Preview stale: yes` persists after step 4, stop and report the trace before saving. Do not apply another resolver change.
