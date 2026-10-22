# PortfolioHub Builder — Root-Cause Investigation Report

Date: 2026-10-22
Scope: Builder (`/profile/builder`), preview pipeline, public portfolio (`/u/[username]`), portfolio persistence layer.
Mode: **Read-only investigation. No code was modified.** No runtime test/build was executed (requires explicit approval).

---

## 1. Executive Summary

| # | Reported symptom | Primary root cause | Severity |
|---|---|---|---|
| 1 | Cannot delete a newly added Experience item | Destructive controls are hidden behind `group-hover` with no touch/keyboard fallback; deletion is local-only until a save that can fail silently at validation level | High |
| 2 | Preview does not react to edits and elements disappear | (a) Newly mounted `.fade-up` nodes are never observed because the `IntersectionObserver` is created once with `[]`; (b) on mobile/narrow viewports the preview is an iframe of **saved** DB state, not current state | Critical |
| 3 | Hide a section → show it again → nothing until full refresh | Same one-shot `IntersectionObserver`; unhidden section mounts with `opacity-0` and is never animated in. On mobile the iframe is stale by design | Critical |
| 4 | Save takes a long time | `updatePortfolio` performs dozens of **sequential** DB round-trips (per-section + per-project update/delete/recreate), with no transaction and a forced route revalidation on each save | High |
| 5 | Whole site feels slow | Full-size unoptimized Cloudinary images, render-blocking third-party font CSS, sequential uncached public queries, no ISR/cache, client-heavy 1 594-line template | High |
| 6 | Creating a page automatically creates a project card | `ProjectPage` is simultaneously the page entity and the home-page card entity; every row in `projectPages` is rendered in the Projects section | Critical (architecture) |

The issues are independent. Fixing #2/#3 is low risk and high impact; #6 is a data-model/presentation change and should be designed before implementation.

---

## 2. Issue 1 — A new Experience item cannot be deleted

### Symptom
After clicking **Add Experience**, the new item card cannot be removed (especially on touch devices / narrow viewports).

### Evidence

- `src/app/profile/builder/BuilderClient.tsx:433`
  ```tsx
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  ```
  The edit/delete buttons of every `ItemCard` (Experience, Skills, Testimonials, etc.) are **invisible until hover**.
- `BuilderClient.tsx:425-457` — `ItemCard` container uses `relative group`; there is no `group-focus-within` or `@media (hover: none)` fallback.
- `BuilderClient.tsx:3685` — the page delete button in the Pages tab uses the same `opacity-0 group-hover:opacity-100` pattern.
- `src/app/globals.css` — no `(hover: none)` / `pointer: coarse` fallback exists.
- `BuilderClient.tsx:2443-2447` — the removal itself only mutates client state:
  ```tsx
  const newItems = [...experienceItems]; newItems.splice(idx, 1);
  updateSectionContentRaw(selectedSection.id, 'items', newItems)
  ```
  The removal is **not persisted** until the user presses Save.

### Root cause
**Primary:** On touch devices and for keyboard users there is no discoverable/visible delete affordance. On a phone the builder has no hover state at all, so the trash icon never appears. On desktop the icon appears only while the pointer is over the card, which is easy to miss and impossible to reach with touch.

**Secondary risk (unconfirmed):** If a save fails, the deletion is silently reverted on reload. `experienceItem` is a strict Zod object (`src/lib/portfolio-schema.ts:74-92`), and any legacy/unknown key in a stored item makes `validateSections` reject the whole save (`src/lib/portfolio-schema.ts:423-440`, called at `src/lib/actions/portfolio.ts:321-324`). The failure surfaces as a generic toast, so users interpret it as "delete did nothing".

### Recommended fix
1. Make destructive actions always visible on touch: `opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100`, and add `focus-within` reveal.
2. Give the Delete action a persistent menu or a visible trash button in the item header.
3. Keep track of removed IDs and send an explicit removal delta (or at minimum surface save failure inline on the item).
4. Relax `experienceItem` to `.passthrough()` for unknown legacy keys, or migrate stored items once; never let one unknown key block every save.
5. Add an undo toast for destructive item removal.

### Files
`src/app/profile/builder/BuilderClient.tsx:425-457, 433, 2438-2447, 3680-3689`
`src/lib/portfolio-schema.ts:74-92, 423-440`
`src/lib/actions/portfolio.ts:321-324`

---

## 3. Issue 2 — Preview is not responsive and elements disappear

### Symptom
Edits do not appear in the preview promptly; added sections/items/cards silently vanish; switching display mode can make a whole section blank.

### Root cause A — one-shot `IntersectionObserver` (inline desktop preview)

`src/components/portfolio/templates/ClassicTemplate.tsx:109-128`
```tsx
useEffect(() => {
  const observer = new IntersectionObserver(...)
  document.querySelectorAll('.fade-up, .skill-bar').forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}, [])          // ← runs only on mount
```

Every section/item/card is rendered with:
```
fade-up opacity-0 translate-y-5 [&.animate-in]:opacity-100 ...
```
(e.g. `ClassicTemplate.tsx:319, 357, 428, 566, 673, 735, 843, 1496`)

Consequences:
1. A section that was hidden does not exist in the DOM, so it is not observed. When it is shown again it mounts with `opacity-0` and **no observer ever attaches** → invisible until a full reload.
2. Switching `displayMode` (`timeline` → `grid` → `list`) remounts the subtree; the new nodes are not observed → the whole section appears blank.
3. Newly added Experience/Project/Gallery items mount after the effect already ran. Any new `.fade-up` node outside the initial query stays invisible.
4. The template is used both on the public page and inline in the builder; the observer is scoped to `document`, which also makes behaviour depend on the builder's own scroll container.

This single defect explains both "elements disappear during changes" and "hide/unhide needs a refresh".

### Root cause B — mobile/narrow preview is a stale iframe

`src/app/profile/builder/BuilderClient.tsx:3314-3321`
```tsx
<iframe
  key={`mobile-preview-${lastSaved?.getTime() ?? 0}-${mobileRefreshKey}`}
  src={`/profile/builder/preview?t=${lastSaved?.getTime() ?? 0}-${mobileRefreshKey}`}
/>
```
`src/app/profile/builder/preview/page.tsx:14-22`
```tsx
const [profile, sub] = await Promise.all([getOrCreateProfile(), getSubscriptionState(user.id)])
...
return <ClassicTemplate profile={viewProfile} isFree={isFree} preview />
```

- The iframe loads a **server-rendered copy of the saved database row**.
- Its `key`/`src` only change on a successful save (`lastSaved`) or when the manual refresh button is pressed.
- Therefore, on a phone (or any window < 1024 px where `ScaledDesktopPreview` is used — `BuilderClient.tsx:3338-3342`) the preview cannot reflect unsaved edits, ever. It updates only after Save + reload.

### Root cause C — free plan hides locked sections from the preview

`BuilderClient.tsx:1272-1276`
```tsx
const previewProfile = isFreePlan ? stripLockedSectionsForFree(profile) : profile
```
`src/lib/free-sections.ts` locks `experience`, `skills`, `services`, `testimonials`.
If the account is not ACTIVE/GRACE, edits to those sections never appear in the preview by design. The sidebar shows a lock, but there is no inline explanation inside the preview. This can be mistaken for "preview is broken".

### Root cause D — full template re-render on every keystroke

- `LivePreview` (`src/app/profile/builder/LivePreview.tsx:7-17`) directly renders `ClassicTemplate` with no `React.memo`, no deferred value and no debounce.
- `ClassicTemplate.tsx` is 1 594 lines and holds state/effects/scroll listeners.
- Every keystroke re-renders the entire preview subtree, alongside `JSON.stringify` of the whole profile for `isDirty` (`BuilderClient.tsx:946-948`, `662-674`) and a localStorage draft write after 2.5 s (`1014-1029`).

### Recommended fix
1. Replace the one-shot observer with a `MutationObserver`, a ref-callback `Reveal` component, or re-run the observation effect keyed on a content signature (`sections.length + ids + displayModes`). Simplest robust approach: a small `<Reveal>` component per element with its own `useEffect`.
2. Prefer CSS-only reveal (`animation` + `@starting-style` or `IntersectionObserver` per element) so remounts always animate.
3. For the mobile/narrow preview, stop using a server iframe for live editing. Either:
   - render the inline template inside a properly sized CSS container (use container queries), or
   - postMessage the current draft into the iframe, or
   - keep the iframe only as a "saved snapshot" with an explicit label ("Saved preview") and add a live inline mode.
4. Wrap the preview in `React.memo` and feed it `useDeferredValue(profile)` / `startTransition` so typing stays responsive.
5. Show a visible notice when the account is on the free plan and a locked section is being edited.

### Files
`src/components/portfolio/templates/ClassicTemplate.tsx:109-128, 210-212, 319, 428, 566, 673, 735, 843`
`src/app/profile/builder/BuilderClient.tsx:3314-3342`
`src/app/profile/builder/preview/page.tsx:14-22`
`src/app/profile/builder/LivePreview.tsx:7-17`
`src/lib/free-sections.ts`

---

## 4. Issue 3 — Hide then show a section: nothing until refresh

This is the same root cause as Issue 2-A, confirmed by the code path:

1. Hide: `toggleSectionVisibility` writes both `visible` and `settings.isVisible` (`BuilderClient.tsx:1299-1321`, helper `src/lib/section-visibility.ts`).
2. Template filters the section out: `visibleSections = sections.filter(isSectionVisible)` (`ClassicTemplate.tsx:210-212`).
3. Show again: the section remounts with class `fade-up opacity-0` but the observer effect has already run and will not re-run (`ClassicTemplate.tsx:126-128`).
4. A full page reload creates a fresh observer; the saved state renders normally — exactly the reported behaviour.

On mobile/narrow viewports the iframe never reloads on the toggle, so the section remains absent until Save + reload.

### Recommended fix
Same as Issue 2-A/B. Additionally, the visibility toggle could mark the section with `data-revealed` on mount so that toggling does not depend on the observer.

---

## 5. Issue 4 — Saving changes is slow

### Root cause — N+1 sequential writes in `updatePortfolio`

`src/lib/actions/portfolio.ts:276-566`:

- `requireUserWithWorkspace()` performs a workspace lookup on every call (`src/lib/actions/portfolio.ts:13-22`).
- `getCurrentUser()` performs a session lookup (`src/lib/auth.ts:39-56`).
- Profile lookup, version check (`309-317`).
- Sections: one `updateMany` **per section** in a sequential `for` loop (`385-413`).
- Projects: for **every** project, sequentially:
  - `projectPage.update` (`489-492`),
  - `projectItem.deleteMany` (`497`),
  - `projectItem.createMany` (`540-542`).
- Deleted projects: one `delete` per removed page (`549-553`).
- `revalidatePath('/profile/builder')` (`556`) triggers a refresh of the builder route; that re-runs `getOrCreateProfile`, `getSubscriptionState` and `getSetting` (`src/app/profile/builder/page.tsx:14-18`).
- No `prisma.$transaction`: profile `version` is incremented first (`353-363`); if a later write fails, the version is already bumped, so the next save hits the optimistic-concurrency conflict modal.

With 10–20 projects, a single Save issues roughly **35–65 sequential remote round-trips** to Supabase (EU pooler). At 30–100 ms each this alone is 1.5–6 s before rendering/revalidation.

### Additional costs
- Client sends and serializes the whole profile on every save (`sections` + all `projectPages` + all items) — `BuilderClient.tsx:1035-1045`.
- `getProfileSnapshot` runs `JSON.stringify` on the entire profile on every render (`BuilderClient.tsx:662-674, 946-948`).
- localStorage draft writes serialize the same payload again (`1014-1029`).
- `revalidatePath` is synchronous within the Server Action response.

### Recommended fix
1. Wrap all writes for one save in `prisma.$transaction`.
2. Send a diff/delta instead of the full state, or at least skip unchanged sections/projects server-side.
3. Replace per-project `deleteMany + createMany` with a diff (update changed items, insert new, delete removed) or a single `createMany` after `deleteMany` inside the transaction — not one transaction per project.
4. Compute the unique slug set against `existingProjects` before writing, and perform deletions before insert/update, to avoid `P2002` ordering failures.
5. Remove the workspace lookup from the hot save path (cache it per request, or only ensure it on profile creation).
6. Move `revalidatePath` to `after()` / a route handler so the save response returns before revalidation.
7. Show optimistic feedback ("Saved locally, syncing…") and keep the draft until the server confirms.

### Files
`src/lib/actions/portfolio.ts:13-22, 276-566, 350-372, 385-414, 419-554, 556-559`
`src/app/profile/builder/BuilderClient.tsx:662-674, 946-948, 1014-1029, 1031-1134`
`src/app/profile/builder/page.tsx:14-18`
`src/lib/auth.ts:39-56`

---

## 6. Issue 5 — The site feels slow

> No profiling was run (requires approval). The items below are code-level contributors, ordered by expected impact.

### A. Unoptimized images (likely largest LCP/bandwidth cost)
- `src/lib/cloudinary.ts:21-38` uploads with **no transformation**: the stored URL is the original full-resolution asset.
- `ClassicTemplate.tsx` renders raw `<img>` tags at `326-330, 495, 582, 747, 846, 960, 1500`.
- Only the gallery image has `loading="lazy"` (`ClassicTemplate.tsx:960`). Covers, avatars and company logos load eagerly.
- No `width`/`height` on most images → layout shift (CLS).
- `next.config.ts` has no `images.remotePatterns`, so Next/Image is not used at all.

**Fix:** request transformed Cloudinary URLs (`f_auto,q_auto,w_640`), add `loading="lazy"`, `decoding="async"`, dimensions/aspect-ratio boxes, and migrate to `next/image` with `remotePatterns`.

### B. Render-blocking third-party CSS
- `src/app/layout.tsx:85` loads the **Material Icons** stylesheet on every route (public portfolio included).
- `ClassicTemplate.tsx:1360` injects `<link rel="stylesheet" href={fontLink}>` into the body for the owner-selected Google font.
- `ClassicTemplate.tsx:183-194` also injects/updates a `#dynamic-font-link` in `document.head` from a client effect.
- The font CSS is requested twice in some paths, and neither is preloaded for the actual portfolio font.

**Fix:** self-host or preload the portfolio font, remove unused Material Icons CSS, and inject a single `<link>` in the document head.

### C. Unauthenticated public page is uncached and sequential
`src/app/u/[username]/page.tsx:16-38`
```tsx
const row = await prisma.userProfile.findUnique(...)
if (!row) return null
const sub = await getSubscriptionState(row.userId)   // second round-trip, sequential
```
- The portfolio row and subscription are fetched **sequentially**.
- No `revalidate`/`unstable_cache`/tag: every visitor triggers fresh DB reads.
- No `Suspense` boundary: the whole page waits for DB before any HTML is streamed.
- The root layout reads a language cookie (`src/app/layout.tsx:76-79`), which opts every route into dynamic rendering.

**Fix:** parallelize the two reads, cache the published profile by `username` + `version` with tag invalidation on save, and stream the page shell with Suspense.

### D. Client-heavy template and repeated effects
- `ClassicTemplate` is a 1 594-line client component with scroll listeners (`108-128, 219-239`), font injection, and all section logic shipped to the browser.
- Every project/item is rendered in one page; no pagination/lazy section.
- `TrackBeacon` adds a post-load DB-write request (`src/components/portfolio/TrackBeacon.tsx:36-54`), which is non-blocking but adds server load on every view.

**Fix:** keep the template primarily server-rendered, isolate interactive bits (theme/nav) into small client islands, and consider paginating/collapsing large project lists.

### E. Middleware overhead
`src/middleware.ts:3-39` runs on nearly every request, parses `NEXT_PUBLIC_APP_URL`, and rewrites subdomains. It is lightweight but on the critical path; keep the static-asset early return (already present at line 10).

---

## 7. Issue 6 — Every new page becomes a project card

### Current behaviour
1. The Pages tab lists `profile.projectPages` (`BuilderClient.tsx:3630-3693`).
2. **New Project Page** calls `createProjectPage()` (`BuilderClient.tsx:1432-1528`), which inserts a `ProjectPage` row and returns it (`src/lib/actions/portfolio.ts:675-745`).
3. That same row is loaded into `profile.projectPages` and the home **Projects** section renders **all** rows:
   ```tsx
   case 'projects':
     const projects = profile.projectPages || []   // ClassicTemplate.tsx:730-731
   ```
4. There is no `showInProjects`/`isCard` filter. `isPublished` cannot be used to hide only the card, because it also hides the detail page (`src/app/u/[username]/page.tsx:24-27`).
5. The UI claims otherwise: the "Not linked" badge says "hidden from public navigation until linked" (`BuilderClient.tsx:3671-3679`), but `ClassicTemplate` still renders the card, and the page slug is the card's own slug.

**Conclusion:** the data model conflates “content page” and “project card” in a single `ProjectPage` row. The linking feature (`linkCardToPage`, `BuilderClient.tsx:1552-1561`) implies separate card/page rows, but creation paths do not enforce that separation.

### Recommended design (minimal, low-risk)
Add an explicit presentation flag to `ProjectPage`:

```
showInProjects Boolean @default(true)   // true = home-page card
```

- **New Project Page** (Pages tab): create with `showInProjects = false`.
- **New Project** (Projects section): create with `showInProjects = true`.
- **Projects section**: render only `projectPages.filter(p => p.showInProjects !== false)`.
- **Page settings**: add a toggle "Show as project card".
- **Linking**: unchanged — a card (`linkType='page'`, `linkedPageSlug`) points to a page.
- **Backfill**: existing rows get `true` to preserve current output; users can turn cards off per page.
- Persist the flag in `updatePortfolio.projectData`, `createProjectPage`, and return it in the client payload.
- Update `linkedPageSlugs` logic: a page is "linked" when a *different* card row references its slug; exclude the page row itself from the link dropdown to prevent self-linking (`BuilderClient.tsx:1656-1660`).

### Alternative (cleaner, larger)
Introduce a separate `PortfolioPage` entity (title/slug/sections/published) and keep `ProjectPage` as the home card, with `ProjectPage.pageId` or `linkedPageSlug` as the relation. This removes the conflation permanently but requires a migration, public-query changes and builder changes.

### Files
`prisma/schema.prisma:907-935` (`ProjectPage`)
`src/lib/actions/portfolio.ts:34-37, 675-745`
`src/app/profile/builder/BuilderClient.tsx:1432-1528, 1552-1561, 1638-1667, 3630-3714`
`src/components/portfolio/templates/ClassicTemplate.tsx:730-731, 741-936`
`src/app/u/[username]/page.tsx:23-27`

---

## 8. Severity / priority matrix

| Priority | Item | Effort | Risk |
|---|---|---|---|
| P0 | Fix one-shot reveal observer (Preview blank/disappearing) | S | Low |
| P0 | Make delete controls visible on touch/keyboard | S | Low |
| P0 | Separate card creation from page creation (`showInProjects`) | M | Medium |
| P1 | Make mobile/narrow preview live (or clearly label as saved snapshot) | M–L | Medium |
| P1 | Transactional + batched save, delta payload, async revalidation | M–L | Medium |
| P1 | Image optimization + font cleanup | S–M | Low |
| P2 | Parallelize public queries + cache/ISR | M | Medium |
| P2 | Split template into server shell + client islands | L | High |
| P2 | Relax/strict-schema migration for experience items | S | Low |

---

## 9. Suggested implementation order

1. **Preview reveal fix** (observer / `<Reveal>`): unblocks reliable verification of every other UI change.
2. **Delete affordance**: always-visible on touch, focus-within reveal, undo toast.
3. **Pages vs cards flag**: schema + server actions + Projects filter + builder toggle.
4. **Save pipeline**: transaction, diff writes, remove workspace lookup from hot path, async revalidation.
5. **Live mobile preview**: container-query inline preview or postMessage iframe.
6. **Performance**: Cloudinary transforms + `next/image`; font cleanup; parallel public queries + caching; then profile with `web-perf`.

---

## 10. Verification plan (after approval)

- Unit: `validateSections` accepts legacy unknown experience keys; rejects real invalid data.
- Integration: add → delete → save → reload an experience item; assert DB no longer contains it.
- Integration: create page from Pages tab → assert it does **not** render as a card; create card → link → assert navigation works.
- E2E: hide/unhide each section; assert visible immediately in the desktop preview without reload.
- E2E: mobile viewport; edit a section; assert preview updates live.
- Perf: Lighthouse/Core Web Vitals on `/u/<user>` before/after; count DB queries per save (Prisma query log) and target < 10.
- Regression: public page renders identical for existing data; no free-plan locked-section leaks.

---

## 11. Reference index

| Concern | Location |
|---|---|
| Hover-only item actions | `BuilderClient.tsx:433, 3685` |
| Experience add/remove | `BuilderClient.tsx:2438-2447, 2605-2617` |
| Strict experience schema | `portfolio-schema.ts:74-92, 423-440` |
| One-shot reveal observer | `ClassicTemplate.tsx:109-128, 126-128` |
| Fade-up elements | `ClassicTemplate.tsx:319, 357, 428, 566, 673, 735, 843, 1496` |
| Section visibility filter | `ClassicTemplate.tsx:210-212`; `section-visibility.ts` |
| Mobile/narrow iframe | `BuilderClient.tsx:3314-3342` |
| Preview server page | `preview/page.tsx:14-22` |
| Free-plan preview stripping | `BuilderClient.tsx:1272-1276`; `free-sections.ts` |
| Full preview re-render | `LivePreview.tsx:7-17`; `ClassicTemplate.tsx` |
| Dirty snapshot stringify | `BuilderClient.tsx:662-674, 946-948` |
| Draft autosave | `BuilderClient.tsx:1014-1029` |
| Save action loops | `actions/portfolio.ts:385-414, 419-554` |
| Version bump before writes | `actions/portfolio.ts:350-372` |
| Save revalidation | `actions/portfolio.ts:556-559`; `builder/page.tsx:14-18` |
| Page creation | `actions/portfolio.ts:675-745` |
| Projects render all pages | `ClassicTemplate.tsx:730-731` |
| “Not linked” claim | `BuilderClient.tsx:3671-3679` |
| Link card ↔ page | `BuilderClient.tsx:1552-1561, 1638-1667` |
| Public query sequencing | `u/[username]/page.tsx:16-38` |
| Raw images | `ClassicTemplate.tsx:326, 495, 582, 747, 846, 1500` |
| Cloudinary original URL | `cloudinary.ts:21-38` |
| Font CSS | `layout.tsx:85`; `ClassicTemplate.tsx:183-194, 1360` |

---

No code has been changed. Reply with the items you want implemented (e.g. “P0 only” or “all”) and I will implement them in the order above.
