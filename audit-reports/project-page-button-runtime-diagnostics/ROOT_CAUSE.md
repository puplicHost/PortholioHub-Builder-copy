# Root Cause

## Status: NOT PROVEN

The exact runtime cause of the missing `View Project` CTA has **not** been proven. No browser, live Builder session, or customer account was available, and the task prohibits browser automation and live customer data access. Any file claiming a proven root cause without a runtime trace would repeat the previous false confidence.

This report records the strict constraints proven from source and the candidate defects the new panel is designed to confirm or eliminate. No resolver, persistence, or template behavior was changed in this phase.

## What is proven from source

### 1. The CTA is controlled by one shared destination decision

- Classic: `hasProjectLinks()` calls `resolveProjectCardDestination`, then `ProjectCardBody.links` is either rendered or `null`. `ClassicTemplate.tsx:1489–1505`, `1523`, `1549`.
- Editorial: `projectCards()` builds `p.href` from the same resolver; the main CTA is rendered only when `p.href` exists. `EditorialMarketingTemplate.tsx:331–336`, `841–855`.
- Resolver gates: `project-card-links.ts:45–87`.

A resolver result of `null` is sufficient to remove the button in both templates.

### 2. The resolver returns `null` for these page-link states

`src/lib/project-card-links.ts`:

- `isFree === true` → `null` (`:68`)
- no/empty `linkedPageSlug` → `null` (`:69`)
- target missing from supplied `pages` → `null` (`:76`)
- target `isPublished === false` → `null` (`:76`)
- non-real/residual slug → `null` (`:78`)
- missing `username` → `null` (`:79`)

Any of these states produces exactly the user-visible symptom.

### 3. Page and external CTAs share the same CSS

For Classic, both branches use the same class string (`text-sm font-semibold ... text-[var(--color-primary)]`). For Editorial, both use `styles['emk__project-link']`. The only difference is the icon. CSS cannot distinguish an internal page destination from an external URL.

Therefore, if an external CTA is visible on the same card and an internal page CTA is not, the missing button is **not** a simple CSS class difference. It must come from the destination/eligibility decision or a different render branch. The panel still probes CSS to rule out clipping/overlay in the actual layout.

### 4. The Builder and public route can legitimately receive different target sets

- Builder profile: all project pages (the Builder must show drafts).
- Public route: `projectPages: { where: { isPublished: true } }` (`src/app/u/[username]/page.tsx:29–33`), plus `isFree` derived from subscription (`:43`).

A target that is visible in the Builder can be absent publicly. The panel's `Target found` / `Target published` and public comparison rows are designed to expose this.

### 5. Tests executed previously did not observe the live path

Existing real-template tests use `renderToStaticMarkup` with hand-built profiles. They prove the JSX branch for the fixture. They do not prove:

- the actual `editingItem` object in the user's Builder,
- the deferred preview profile,
- the active template override,
- the target's `isPublished` / plan state,
- the rendered DOM or CSS.

This is why all tests can pass while the live button is missing.

## Candidate defects to confirm with the runtime trace

These are **code-level hazards**, not claims about which one is active.

### Candidate A — target is unpublished

`Target published: no` in the panel; `Destination: null`; CTA absent in both Builder and public.

The resolver intentionally hides the CTA for `isPublished === false` (`project-card-links.ts:76`).

Source-level defect that can prevent a fix: the main save path does **not** persist `isPublished`. `updatePortfolio`'s `projectData` has no `isPublished` field (`src/lib/actions/portfolio.ts:478–497`). The only `isPublished` reference in that action file is the unused `updateProjectPage` allow-list (`:968`). The Builder checkbox at `BuilderClient.tsx:2536–2537` updates local state through `updateProjectPageField`, but the main save cannot write it. If the target is currently unpublished, the UI may look like it can republish it while the database value does not change.

Confirm by:

1. Panel `Target published` on the editor card.
2. Toggle "Publish page" for the target, save, reload.
3. Reopen the panel: does `Target published` remain `no`?

Do not fix this until the trace confirms the target is actually unpublished.

### Candidate B — plan state suppresses internal links

`Is free plan: yes` and `Hidden because: isFree=true (paid-plan gate suppresses internal page links)`.

`isFreePlan` is true unless `initialSubscriptionState` is `ACTIVE` or `GRACE` (`BuilderClient.tsx:945`). `getSubscriptionState` returns `SUSPENDED` for any `canceledAt` subscription (`src/lib/subscriptions.ts:47–56`), even if the paid period has not ended. A canceled/expired account therefore loses internal page CTAs.

Confirm by recording the panel's `Is free plan` and the account's subscription state (without exposing customer data in the report). This is expected product behavior, not a resolver bug.

### Candidate C — empty top-level slug shadows a valid content slug

`Top empty shadows content: yes`.

The resolver uses `card.linkedPageSlug ?? content.linkedPageSlug` (`project-card-links.ts:46`). An empty string is not nullish, so a valid nested slug is ignored. The card editor's `updateEditingCard` writes only the top-level field (`ProjectManager.tsx:631–640`); other paths (`linkCardToPage`, `updateProjectPageField`, `unlinkPageFromCards`) write both layers. A sequence such as select page → choose `No link` → choose `Project Page` can leave the top-level slug empty while the content slug is stale.

Confirm by:

1. Panel `slug (top)` and `slug (content)`.
2. `Top empty shadows content` flag.
3. `Hidden because` text.

If confirmed, the minimal correct fix is to keep the two layers consistent in `updateEditingCard` (or normalize the effective slug). Do not change the resolver until the trace shows this state.

### Candidate D — temporary target slug survives in the content mirror

After save:

- `slug (top)`: real target slug (client remap)
- `slug (content)`: old `new-...` / `project-new-...` value
- `Preview stale: no`, CTA visible

After reload:

- `slug (top)`: the temporary value (rebuilt from content by `getOrCreateProfile`)
- `slug (content)`: the temporary value
- `Target found: no`, `Destination: null`, CTA absent

Source path:

- `handleSaveChanges`'s `applyProjectRemaps` updates only `page.linkedPageSlug`, not `page.content.linkedPageSlug` (`BuilderClient.tsx:1337–1362`).
- `getOrCreateProfile` rebuilds the top-level field from `content` (`src/lib/actions/portfolio.ts:47–53`).
- Server normalization cannot canonicalize a temp target created in the same save because `existingProjects` is queried before the new rows exist (`src/lib/actions/portfolio.ts:393–396`, `466–488`).

This precisely matches a button that works immediately after save but disappears after reload. Confirm with the after-save and after-reload traces. If confirmed, the fix belongs in the save/reload normalization path, not the resolver.

### Candidate E — stale preview

`Preview stale: yes` persists after the preview settles; `Preview destination` differs from `Destination`.

`LivePreview` receives `deferredPreviewProfile` (`BuilderClient.tsx:1772–1780`, `4850`, `4863`). The deferral is intentional. A persistent mismatch points to a state/remap problem, not the resolver.

### Candidate F — wrong template branch

`Template` says `editorial-marketing` but `DOM template` says `classic`.

`LivePreview` renders Classic until the lazy Editorial chunk loads (`LivePreview.tsx:64–80`). A transient mismatch is expected on first open; a persistent mismatch means the template resolution or load failed.

### Candidate G — CSS/layout

`CTA visible: true`, `Matching anchors: 1`, but `CSS display/vis/op` is `none/hidden/0`, `In preview viewport: no`, or `Hit test: covered`.

For this branch, the destination is correct and the button exists in the DOM. The fix is in the actual style/layout, not the resolver. Source analysis says page and external CTAs share classes, so this is less likely than A–F, but the panel now proves or eliminates it.

### Candidate H — card is not the rendered card at all

`Target found` is based on the editor card, but `Preview card found: no` or `Preview destination` uses a different card. This indicates an identity/remap issue, not a destination issue.

## Why previous fixes could miss the real cause

1. They changed the resolver before observing which resolver input was actually failing.
2. They tested hand-built card objects, not the live editor card or the deferred preview card.
3. They never checked target publication or plan state.
4. They never inspected the rendered anchor's computed CSS/geometry.
5. They sometimes reported `COMPLETED` despite explicitly noting no browser/staging verification.

## Required proof before a fix

The trace must show:

- the exact editor `linkType` / `linkedPageSlug` (both layers),
- the exact preview card values,
- target existence and `isPublished`,
- plan state,
- resolver destination,
- template-level decision,
- actual DOM anchor presence and computed visibility,
- the same values after save and after reload,
- the public route's target set.

Only then can the defective layer be named. Until then, status remains `PARTIALLY COMPLETED`.
