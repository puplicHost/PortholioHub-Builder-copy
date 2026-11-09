# Actual Runtime Trace

## Status

`NOT YET OBSERVED` — no real browser, live Builder session, or customer account was accessed in this phase. Browser automation and live customer data are prohibited by the task. This file records the exact instrumentation contract and the source-verified path; it does not invent runtime values.

Targeted verification after implementation: `npx tsc --noEmit` passed; `npx vitest run __tests__/project-card-cta.test.ts __tests__/current-bug-fixes.test.ts` passed 14/14. Those are synthetic checks, not the runtime trace.

## Component tree used by the failing UI

### Builder preview — Classic

```
src/app/profile/builder/BuilderClient.tsx
  └─ <LivePreview profile={deferredPreviewProfile} templateOverride={previewTemplateId}>
       src/app/profile/builder/LivePreview.tsx
         └─ <ClassicTemplate profile={deferredPreviewProfile} isFree={isFreePlan} preview>
              src/components/portfolio/templates/ClassicTemplate.tsx
                └─ case 'projects'
                     ├─ projects = profile.projectPages.filter(showInProjects !== false)   (1369–1371)
                     ├─ renderListCard(project)                                           (1507–1527)
                     │    └─ <ProjectCardBody links={hasProjectLinks(project) ? renderProjectLinks(project) : null}>
                     └─ renderGridCard(project, index)                                    (1529–1553)
                          └─ <ProjectCardBody links={hasProjectLinks(project) ? renderProjectLinks(project) : null}>
                               src/components/portfolio/ProjectCard.tsx
                                 └─ links ? <div class="mt-auto ...">{links}</div> : null    (167–205)
```

### Builder preview — Editorial

```
src/app/profile/builder/BuilderClient.tsx
  └─ <LivePreview profile={deferredPreviewProfile} templateOverride={previewTemplateId}>
       src/app/profile/builder/LivePreview.tsx
         └─ lazy <EditorialMarketingTemplate profile={deferredPreviewProfile} isFree={isFreePlan} preview>
              src/components/portfolio/templates/EditorialMarketingTemplate.tsx
                ├─ projectCards = profile.projectPages.filter(showInProjects !== false).map(...)   (327–380)
                │    └─ destination = resolveProjectCardDestination(project, {username, isFree, pages})  (331–335)
                └─ {p.href ? (p.isPage ? <Link> : <a>) : null}                                  (841–855)
```

### Public homepage

```
src/app/u/[username]/page.tsx
  ├─ prisma.userProfile.findUnique
  │    ├─ pages: where { slug:'home', isPublished:true }                               (24–28)
  │    └─ projectPages: where { isPublished:true }                                      (29–33)
  ├─ isFree = sub.state !== 'ACTIVE' && sub.state !== 'GRACE'                           (43)
  └─ <ClassicTemplate|EditorialMarketingTemplate profile isFree>
       └─ same projectPages render paths as above
```

## Exact CTA conditions

### Classic

`hasProjectLinks(project)` is true when either:

1. `resolveProjectCardDestination(project, { username, isFree, pages: profile.projectPages })` returns a destination, or
2. any `project.items[]` has a title/label and an absolute `http(s)` URL.

`ProjectCardBody.links` is `null` when `hasProjectLinks()` is false. When non-null, `renderProjectLinks()` emits the main page CTA only for `destination.kind === 'page'`. See `ClassicTemplate.tsx:1489–1505`, `1519–1525`, `1545–1551`.

### Editorial

The main CTA exists only when `p.href` is non-null, which comes from `resolveProjectCardDestination`. See `EditorialMarketingTemplate.tsx:331–336`, `375–378`, `841–855`.

### Shared resolver gates

`resolveProjectCardDestination` returns `null` for a page link when any of these is true:

- `isFree === true` (`project-card-links.ts:68`)
- `linkedPageSlug` is missing/empty (`:69`)
- the target is absent from `pages` when `pages` is supplied (`:76`)
- the target has `isPublished === false` (`:76`)
- the resolved slug is not a real slug (`:78`)
- `username` is missing (`:79`)

## Observed values

| Stage | linkType | linkedPageSlug | Resolver result | CTA decision |
| --- | --- | --- | --- | --- |
| Card editor initial state | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| After selecting Project Page | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| After editor state update | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Preview component props | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Actual card component props | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| CTA rendering decision | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Save payload | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Server-normalized result | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Reloaded/hydrated card | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |
| Public rendering input | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED | NOT OBSERVED |

The diagnostic panel now records exactly these columns. Use `Copy trace` at each stage and paste the JSON into this table.

## Source-derived fixture values (not runtime)

For orientation only. The existing synthetic tests build a profile with a card `{ linkType:'page', linkedPageSlug:'case-study' }` and a published target page `{ id:'page-1', slug:'case-study', showInProjects:false, isPublished:true }`. Source inspection says the panel would report:

| Field | Expected value for that fixture |
| --- | --- |
| `Template` | `classic` or `editorial-marketing` |
| `Source` | `top-level` |
| `linkType (top)` | `page` |
| `slug (top)` | `case-study` |
| `Target found` | `yes (case-study)` |
| `Target published` | `yes` |
| `Destination` | `/u/u1/projects/case-study` |
| `CTA visible` | `true` |
| `Classic hasProjectLinks` | `true` |
| `Editorial href` | `true` |
| `Hidden because` | `not hidden` |

This table is **not** evidence about the failing customer card. Only the running Builder can supply the actual values.

## What would explain each candidate failure in this trace

| Runtime observation | Meaning |
| --- | --- |
| `Is free plan: yes` and `Hidden because: isFree=true` | Plan/subscription state suppresses internal page links. |
| `Target published: no` | Target page is unpublished; resolver hides the CTA by design. Check whether the Builder's publish toggle persists (it currently does not, see `ROOT_CAUSE.md`). |
| `Target found: no`, `Destination: null` | Stored slug is stale/deleted, or points to a different profile/target. |
| `Top empty shadows content: yes` | Top-level `linkedPageSlug:''` prevents a valid content slug from resolving. |
| `CTA visible: true` but `Matching anchors: 0` | The computed decision says yes, but the actual component branch did not render it (wrong template, wrong profile, or parent suppression). |
| `Matching anchors: 1`, `CSS .../hidden/0` | The CTA is rendered but hidden by CSS. |
| `In preview viewport: no` | The card/CTA is outside the scroll area; scroll the preview to the card before concluding it is missing. |
| `Hit test: covered` | Another element overlays the CTA. |
| `Preview stale: yes` / `Preview destination: null` while editor destination is valid | The preview is reading a stale card snapshot. |
| `DOM template` differs from `Template` | The wrong template branch is rendering (e.g. Editorial chunk still loading, Classic fallback). |
| `DOM surface: not mounted` | The preview surface is not the homepage LivePreview (e.g. a Project Page preview is active). |
| After save: top-level slug `case-study`, content slug `new-...`; after reload: top-level becomes `new-...` | Temporary slug remained in the content mirror; client remap was lost on reload. |

## Required evidence before any fix

1. Copy the panel trace immediately after selecting a valid internal page.
2. Copy it after save.
3. Copy it after a full reload.
4. Copy the public route's rendered HTML/DevTools state for the same card.
5. State whether the target page is published and whether the account is Pro/active.

Without those values, identifying a root cause would be another guess.
